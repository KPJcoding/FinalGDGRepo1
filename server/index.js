import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { sendOtpEmail, verifyConnection } from './mailer.js';
import { requireAdmin } from './adminMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CreditEngine, CREDIT_CONFIG } from './creditEngine.js';
import { queryRAG, getRAGStatus } from './rag.js';
import { extractAll as extractWebsiteContent } from './extract-website-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads', 'issues');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'issue-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
        }
    }
});

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper: Validate Email
function isValidEmail(email) {
    return email && email.endsWith('@iiitn.ac.in');
}

// Middleware: Authenticate Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Helper: Transact Credits
async function transactCredits(db, userId, amount, type, description) {
    // Start transaction for consistency
    await db.exec('BEGIN TRANSACTION');
    try {
        // 1. Update user balance
        await db.run('UPDATE users SET credits = credits + ? WHERE id = ?', amount, userId);

        // 2. Record transaction
        await db.run(
            'INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            userId, amount, type, description
        );

        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

// -------------------------------------------------------------
// SIGN UP FLOW
// -------------------------------------------------------------

// 1. Initiate Sign Up (Send OTP)
app.post('/auth/signup/initiate', async (req, res) => {
    try {
        const { email } = req.body;

        // Domain Check
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Only @iiitn.ac.in emails are allowed' });
        }

        const db = await getDb();

        // Existence Check
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (user) {
            return res.status(409).json({ error: 'User already exists. Please Sign In.' });
        }

        // Generate & Link OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
        const expiresAt = Date.now() + 5 * 60 * 1000;

        await db.run(
            'INSERT INTO otp_verifications (email, otpHash, expiresAt) VALUES (?, ?, ?)',
            email,
            otpHash,
            expiresAt
        );

        // Send Real Email
        await sendOtpEmail(email, otp);

        res.json({ message: 'OTP sent successfully', email });

    } catch (error) {
        console.error('Error in /auth/signup/initiate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Verify OTP & Create Account
app.post('/auth/signup/verify', async (req, res) => {
    try {
        const { email, otp, password, name, batch, branch } = req.body;

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email domain' });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const db = await getDb();

        // Verify OTP
        const record = await db.get(
            'SELECT * FROM otp_verifications WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1',
            email
        );

        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        if (Date.now() > record.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // specific check for attempts could go here

        const match = await bcrypt.compare(otp, record.otpHash);
        if (!match) {
            await db.run('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', record.id);
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark used
        await db.run('UPDATE otp_verifications SET used = 1 WHERE id = ?', record.id);

        // Create User
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Check again if user exists to prevent race condition
        const existing = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (existing) {
            return res.status(409).json({ error: 'User already created.' });
        }

        const result = await db.run(
            'INSERT INTO users (email, password_hash, name, batch, branch, isVerified, lastLogin) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
            email, passwordHash, name, batch, branch
        );

        const newUser = await db.get('SELECT * FROM users WHERE id = ?', result.lastID);

        // Issue Token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Account created successfully',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                isVerified: true
            }
        });

    } catch (error) {
        console.error('Error in /auth/signup/verify:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// -------------------------------------------------------------
// SIGN IN FLOW
// -------------------------------------------------------------

// 1. Initiate Sign In (Send OTP to existing user)
app.post('/auth/signin/initiate', async (req, res) => {
    try {
        const { email } = req.body;

        // Domain Check
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Only @iiitn.ac.in emails are allowed' });
        }

        const db = await getDb();

        // Check if user exists
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please sign up first.' });
        }

        // Generate & Store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        await db.run(
            'INSERT INTO otp_verifications (email, otpHash, expiresAt) VALUES (?, ?, ?)',
            email,
            otpHash,
            expiresAt
        );

        // Send Real Email
        await sendOtpEmail(email, otp);

        res.json({ message: 'OTP sent successfully', email });

    } catch (error) {
        console.error('Error in /auth/signin/initiate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Verify OTP & Sign In
app.post('/auth/signin/verify', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email domain' });
        }

        const db = await getDb();

        // Verify user exists
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify OTP
        const record = await db.get(
            'SELECT * FROM otp_verifications WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1',
            email
        );

        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        if (Date.now() > record.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        const match = await bcrypt.compare(otp, record.otpHash);
        if (!match) {
            await db.run('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', record.id);
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Mark OTP as used
        await db.run('UPDATE otp_verifications SET used = 1 WHERE id = ?', record.id);

        // Update last login
        await db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', user.id);

        // Issue Token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isVerified: !!user.isVerified,
                role: user.role || 'USER' // Include role for admin detection
            }
        });

    } catch (error) {
        console.error('Error in /auth/signin/verify:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Password-based Login (Legacy)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const db = await getDb();

        const user = await db.get('SELECT * FROM users WHERE email = ?', email);

        // Generic error message for security
        const invalidMsg = 'Invalid email or password';

        if (!user) {
            // Don't reveal user doesn't exist
            return res.status(401).json({ error: invalidMsg });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: invalidMsg });
        }

        // Update login time
        await db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', user.id);

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isVerified: !!user.isVerified,
                role: user.role || 'USER' // Include role for admin detection
            }
        });

    } catch (error) {
        console.error('Error in /auth/login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// -------------------------------------------------------------
// QUESTION & ANSWER FLOW
// -------------------------------------------------------------

// Helper: Get Vote Count (Visual Only)
async function getVoteCount(db, targetId, targetType) {
    const result = await db.get(
        'SELECT SUM(value) as count FROM votes WHERE target_id = ? AND target_type = ?',
        targetId, targetType
    );
    return result.count || 0;
}

// 1. Create Question
app.post('/questions', authenticateToken, async (req, res) => {
    try {
        const { title, content, difficulty } = req.body;
        const { userId } = req.user;

        if (!title || !content || !difficulty) {
            return res.status(400).json({ error: 'Title, content, and difficulty are required' });
        }

        const validDiffs = Object.keys(CREDIT_CONFIG.REWARDS.ANSWER_ACCEPTED);
        const normalizedDiff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
        if (!validDiffs.includes(normalizedDiff)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        const db = await getDb();
        // Insert with is_verified = 0. Difficulty is stored as PROPOSAL.
        // Credits are NOT awarded here anymore.
        const result = await db.run(
            'INSERT INTO questions (title, content, difficulty, difficulty_tier, author_id, is_verified) VALUES (?, ?, ?, ?, ?, 0)',
            title, content, normalizedDiff, normalizedDiff, userId
        );

        console.log(`[QUESTION] New question submitted by user ${userId} - pending verification`);

        res.json({
            id: result.lastID,
            message: 'Question submitted for review. It will be visible after admin verification.'
        });

    } catch (error) {
        console.error('Error in POST /questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. List Questions (Public)
app.get('/questions', async (req, res) => {
    try {
        const { status } = req.query; // 'contribute' or 'explore'
        const db = await getDb();

        let questions;
        if (status === 'explore') {
            // Explore: Show VERIFIED questions with at least 1 answer
            questions = await db.all(`
                SELECT q.*, u.name as author_name,
                (SELECT SUM(value) FROM votes WHERE target_id = q.id AND target_type = 'question') as vote_count,
                (SELECT COUNT(*) FROM answers WHERE question_id = q.id AND is_maintainer_verified = 1) as answer_count
                FROM questions q 
                JOIN users u ON q.author_id = u.id 
                WHERE q.is_verified = 1 
                AND (SELECT COUNT(*) FROM answers WHERE question_id = q.id) >= 1
                ORDER BY q.created_at DESC
            `);
        } else {
            // Contribute: Show UNVERIFIED questions OR verified questions with 0 answers
            questions = await db.all(`
                SELECT q.*, u.name as author_name,
                (SELECT SUM(value) FROM votes WHERE target_id = q.id AND target_type = 'question') as vote_count,
                (SELECT COUNT(*) FROM answers WHERE question_id = q.id AND is_maintainer_verified = 1) as answer_count
                FROM questions q 
                JOIN users u ON q.author_id = u.id 
                WHERE q.is_verified = 0 
                OR (q.is_verified = 1 AND (SELECT COUNT(*) FROM answers WHERE question_id = q.id) = 0)
                ORDER BY q.created_at DESC
            `);
        }

        res.json(questions);
    } catch (error) {
        console.error('Error in GET /questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Get Question Details
app.get('/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const question = await db.get(`
            SELECT q.*, u.name as author_name 
            FROM questions q 
            JOIN users u ON q.author_id = u.id 
            WHERE q.id = ?
        `, id);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        question.vote_count = await getVoteCount(db, id, 'question');

        // Check if user is admin (via token if provided)
        let isUserAdmin = false;
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await db.get('SELECT role FROM users WHERE id = ?', decoded.userId);
                isUserAdmin = user && user.role === 'ADMIN';
            } catch (err) {
                // Invalid token or no token - treat as non-admin
            }
        }

        // Filter answers based on verification status
        // Admin sees ALL answers, non-admin sees only verified answers
        const answerQuery = isUserAdmin
            ? `SELECT a.*, u.name as author_name 
               FROM answers a 
               JOIN users u ON a.author_id = u.id 
               WHERE a.question_id = ? 
               ORDER BY a.is_maintainer_verified DESC, a.is_accepted DESC, a.created_at ASC`
            : `SELECT a.*, u.name as author_name 
               FROM answers a 
               JOIN users u ON a.author_id = u.id 
               WHERE a.question_id = ? AND a.is_verified = 1
               ORDER BY a.is_maintainer_verified DESC, a.is_accepted DESC, a.created_at ASC`;

        const answers = await db.all(answerQuery, id);

        // Attach votes to answers
        for (const ans of answers) {
            ans.vote_count = await getVoteCount(db, ans.id, 'answer');
        }

        res.json({ ...question, answers, isAdmin: isUserAdmin });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Post Answer
app.post('/questions/:id/answers', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // Question ID
        const { content } = req.body;
        const { userId } = req.user;

        if (!content) return res.status(400).json({ error: 'Content is required' });

        const db = await getDb();
        // Check self-answer could be added here as abuse prevention, but strictly rule only said 'repeated credit farming'.
        // We will allow self-answer but maybe block accepting self-answer (handled in accept logic).

        const question = await db.get('SELECT id FROM questions WHERE id = ?', id);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        // Insert answer with is_verified = 0 (unverified by default)
        const result = await db.run(
            'INSERT INTO answers (question_id, author_id, content, is_verified) VALUES (?, ?, ?, 0)',
            id, userId, content
        );

        console.log(`[ANSWER] New answer submitted by user ${userId} for question ${id} - pending verification`);

        res.json({
            message: 'Answer submitted successfully! It will be visible after admin verification.',
            answerId: result.lastID
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// 5. Accept Answer (Updated with CreditEngine)
app.post('/answers/:id/accept', authenticateToken, async (req, res) => {
    try {
        const answerId = req.params.id;
        const { userId } = req.user;
        const db = await getDb();
        const engine = new CreditEngine(db);

        const answer = await db.get(`
            SELECT a.*, q.author_id as question_owner_id, q.id as q_id, q.difficulty
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.id = ?
        `, answerId);

        if (!answer) return res.status(404).json({ error: 'Answer not found' });
        if (answer.question_owner_id !== userId) return res.status(403).json({ error: 'Only author can accept' });

        // Abuse Prevention: Cannot accept own answer
        if (answer.author_id === userId) return res.status(400).json({ error: 'Cannot accept your own answer' });

        const existing = await db.get('SELECT id FROM answers WHERE question_id = ? AND is_accepted = 1', answer.q_id);
        if (existing) return res.status(400).json({ error: 'Already accepted an answer' });

        await db.exec('BEGIN TRANSACTION');
        try {
            await db.run('UPDATE answers SET is_accepted = 1 WHERE id = ?', answerId);

            // Calculate Reward
            const reward = CREDIT_CONFIG.REWARDS.ANSWER_ACCEPTED[answer.difficulty] || 10;
            const result = await engine.awardCredits(answer.author_id, reward, `Answer accepted (Diff: ${answer.difficulty})`);

            await db.exec('COMMIT');
            res.json({ message: 'Accepted', credit_result: result });
        } catch (e) {
            await db.exec('ROLLBACK');
            throw e;
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});


// 6. Vote (Visibility Only)
app.post('/votes', authenticateToken, async (req, res) => {
    try {
        const { target_id, target_type, value } = req.body; // value: 1 or -1
        const { userId } = req.user;

        if (![-1, 1].includes(value)) return res.status(400).json({ error: 'Invalid vote value' });
        if (!['question', 'answer'].includes(target_type)) return res.status(400).json({ error: 'Invalid target type' });

        const db = await getDb();

        // Check ownership (Optional: Block self-voting)
        // Let's implement block self-voting as requested "Safeguards against abuse"
        let ownerId;
        if (target_type === 'question') {
            const q = await db.get('SELECT author_id FROM questions WHERE id = ?', target_id);
            if (q) ownerId = q.author_id;
        } else {
            const a = await db.get('SELECT author_id FROM answers WHERE id = ?', target_id);
            if (a) ownerId = a.author_id;
        }

        if (ownerId === userId) return res.status(400).json({ error: 'Cannot vote on your own content' });

        // Upsert Vote
        const existing = await db.get('SELECT id FROM votes WHERE user_id=? AND target_id=? AND target_type=?', userId, target_id, target_type);
        if (existing) {
            await db.run('UPDATE votes SET value = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', value, existing.id);
        } else {
            await db.run('INSERT INTO votes (user_id, target_id, target_type, value) VALUES (?, ?, ?, ?)', userId, target_id, target_type, value);
        }

        res.json({ message: 'Vote recorded' });

    } catch (error) {
        console.error('Error in /votes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Vote Endpoints with Upvote/Downvote Tracking
// 6b. Vote on Question
app.post('/questions/:id/vote', authenticateToken, async (req, res) => {
    try {
        const questionId = parseInt(req.params.id);
        const { vote_type } = req.body; // 'upvote' or 'downvote'
        const { userId } = req.user;

        if (!['upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        const db = await getDb();

        // Check if question exists
        const question = await db.get('SELECT author_id, question_upvotes, question_downvotes FROM questions WHERE id = ?', questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        // Prevent self-voting
        if (question.author_id === userId) {
            return res.status(400).json({ error: 'Cannot vote on your own question' });
        }

        // Check existing vote
        const existingVote = await db.get(
            'SELECT vote_type FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
            userId, questionId, 'question'
        );

        let upvotes = question.question_upvotes || 0;
        let downvotes = question.question_downvotes || 0;
        let removed = false;

        if (existingVote) {
            if (existingVote.vote_type === vote_type) {
                // Same vote - remove it (toggle off)
                await db.run(
                    'DELETE FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    userId, questionId, 'question'
                );

                // Decrease count (prevent negative)
                if (vote_type === 'upvote') {
                    upvotes = Math.max(0, upvotes - 1);
                } else {
                    downvotes = Math.max(0, downvotes - 1);
                }
                removed = true;
            } else {
                // Different vote - update it
                await db.run(
                    'UPDATE votes SET vote_type = ? WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    vote_type, userId, questionId, 'question'
                );

                // Decrease old vote, increase new vote
                if (vote_type === 'upvote') {
                    upvotes = upvotes + 1;
                    downvotes = Math.max(0, downvotes - 1);
                } else {
                    downvotes = downvotes + 1;
                    upvotes = Math.max(0, upvotes - 1);
                }
            }
        } else {
            // New vote  
            await db.run(
                'INSERT INTO votes (user_id, target_id, target_type, vote_type, value) VALUES (?, ?, ?, ?, ?)',
                userId, questionId, 'question', vote_type, vote_type === 'upvote' ? 1 : -1
            );

            // Increase count
            if (vote_type === 'upvote') {
                upvotes = upvotes + 1;
            } else {
                downvotes = downvotes + 1;
            }
        }

        // Update question vote counts
        await db.run(
            'UPDATE questions SET question_upvotes = ?, question_downvotes = ? WHERE id = ?',
            upvotes, downvotes, questionId
        );

        res.json({
            upvotes,
            downvotes,
            removed,
            user_vote: removed ? null : vote_type
        });

    } catch (error) {
        console.error('Error in /questions/:id/vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 6c. Vote on Answer
app.post('/answers/:id/vote', authenticateToken, async (req, res) => {
    try {
        const answerId = parseInt(req.params.id);
        const { vote_type } = req.body; // 'upvote' or 'downvote'
        const { userId } = req.user;

        if (!['upvote', 'downvote'].includes(vote_type)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        const db = await getDb();

        // Check if answer exists
        const answer = await db.get('SELECT author_id, answer_upvotes, answer_downvotes FROM answers WHERE id = ?', answerId);
        if (!answer) return res.status(404).json({ error: 'Answer not found' });

        // Prevent self-voting
        if (answer.author_id === userId) {
            return res.status(400).json({ error: 'Cannot vote on your own answer' });
        }

        // Check existing vote
        const existingVote = await db.get(
            'SELECT vote_type FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
            userId, answerId, 'answer'
        );

        let upvotes = answer.answer_upvotes || 0;
        let downvotes = answer.answer_downvotes || 0;
        let removed = false;

        if (existingVote) {
            if (existingVote.vote_type === vote_type) {
                // Same vote - remove it (toggle off)
                await db.run(
                    'DELETE FROM votes WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    userId, answerId, 'answer'
                );

                // Decrease count (prevent negative)
                if (vote_type === 'upvote') {
                    upvotes = Math.max(0, upvotes - 1);
                } else {
                    downvotes = Math.max(0, downvotes - 1);
                }
                removed = true;
            } else {
                // Different vote - update it
                await db.run(
                    'UPDATE votes SET vote_type = ? WHERE user_id = ? AND target_id = ? AND target_type = ?',
                    vote_type, userId, answerId, 'answer'
                );

                // Decrease old vote, increase new vote
                if (vote_type === 'upvote') {
                    upvotes = upvotes + 1;
                    downvotes = Math.max(0, downvotes - 1);
                } else {
                    downvotes = downvotes + 1;
                    upvotes = Math.max(0, upvotes - 1);
                }
            }
        } else {
            // New vote
            await db.run(
                'INSERT INTO votes (user_id, target_id, target_type, vote_type, value) VALUES (?, ?, ?, ?, ?)',
                userId, answerId, 'answer', vote_type, vote_type === 'upvote' ? 1 : -1
            );

            // Increase count
            if (vote_type === 'upvote') {
                upvotes = upvotes + 1;
            } else {
                downvotes = downvotes + 1;
            }
        }

        // Update answer vote counts
        await db.run(
            'UPDATE answers SET answer_upvotes = ?, answer_downvotes = ? WHERE id = ?',
            upvotes, downvotes, answerId
        );

        res.json({
            upvotes,
            downvotes,
            removed,
            user_vote: removed ? null : vote_type
        });

    } catch (error) {
        console.error('Error in /answers/:id/vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------------------------------
// REPORT ISSUE FLOW
// -------------------------------------------------------------

// 1. Submit Issue
app.post('/issues', upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, email } = req.body;
        // User is optional (can report anonymously or logged in)
        // But we want to capture user if token exists. The optional auth check:
        let reporterId = null;
        let reporterName = null;
        let reporterEmail = email || null;

        const authHeader = req.headers['authorization'];
        let userUser = null;

        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                const db = await getDb();
                userUser = await db.get('SELECT id, name, email FROM users WHERE id = ?', decoded.userId);
                if (userUser) {
                    reporterId = userUser.id;
                    reporterName = userUser.name;
                    reporterEmail = userUser.email; // Prefer account email
                }
            } catch (e) {
                // Ignore invalid token for reporting
            }
        }

        if (!title || !description || !category) {
            return res.status(400).json({ error: 'Title, description, and category are required' });
        }

        const imagePath = req.file ? `/uploads/issues/${req.file.filename}` : null;

        const db = await getDb();
        const result = await db.run(
            `INSERT INTO issues (title, description, category, image_path, reporter_id, reporter_name, reporter_email, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
            title, description, category, imagePath, reporterId, reporterName, reporterEmail
        );

        res.json({ message: 'Report submitted successfully', id: result.lastID });
    } catch (error) {
        console.error('Error in POST /issues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Get Issues (Admin)
// We need to use 'authenticateToken' and verify admin role
app.get('/admin/issues', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const db = await getDb();

        // Strict Admin Check
        const user = await db.get('SELECT role, email FROM users WHERE id = ?', userId);
        const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];
        const isAdmin = user && (user.role === 'ADMIN' || ADMIN_EMAILS.includes(user.email));

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const issues = await db.all('SELECT * FROM issues ORDER BY created_at DESC');
        res.json(issues);

    } catch (error) {
        console.error('Error in GET /admin/issues:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Update Issue (Admin)
app.put('/admin/issues/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const { userId } = req.user;

        const db = await getDb();

        // Strict Admin Check
        const user = await db.get('SELECT role, email FROM users WHERE id = ?', userId);
        const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];
        const isAdmin = user && (user.role === 'ADMIN' || ADMIN_EMAILS.includes(user.email));

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await db.run(
            'UPDATE issues SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            status, admin_notes, id
        );

        res.json({ message: 'Issue updated successfully' });

    } catch (error) {
        console.error('Error in PUT /admin/issues/:id:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// 7. Maintainer Verify
app.post('/answers/:id/verify', authenticateToken, async (req, res) => {
    try {
        const answerId = req.params.id;
        const { userId } = req.user;
        const db = await getDb();

        // Check if user is Maintainer
        const user = await db.get('SELECT role FROM users WHERE id = ?', userId);
        if (user.role !== 'maintainer') return res.status(403).json({ error: 'Maintainer access required' });

        const answer = await db.get('SELECT * FROM answers WHERE id = ?', answerId);
        if (!answer) return res.status(404).json({ error: 'Answer not found' });
        if (answer.is_maintainer_verified) return res.status(400).json({ error: 'Already verified' });

        const engine = new CreditEngine(db);

        await db.exec('BEGIN TRANSACTION');
        try {
            await db.run('UPDATE answers SET is_maintainer_verified = 1 WHERE id = ?', answerId);
            const result = await engine.awardCredits(answer.author_id, CREDIT_CONFIG.REWARDS.MAINTAINER_VERIFIED_BONUS, 'Maintainer Verification Bonus');
            await db.exec('COMMIT');
            res.json({ message: 'Verified', credit_result: result });
        } catch (e) {
            await db.exec('ROLLBACK');
            throw e;
        }
    } catch (error) {
        console.error('Error in verify:', error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// 8. Get Current User Info (with Tier)
app.get('/users/me', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const db = await getDb();
        const user = await db.get('SELECT id, email, name, role, credits, isVerified, batch, branch FROM users WHERE id = ?', userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const engine = new CreditEngine(db);
        const tier = engine.getTier(user.credits || 0);

        res.json({ ...user, tier });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// -------------------------------------------------------------
// CHATBOT & RAG
// -------------------------------------------------------------

// Simple in-memory rate limiting (replace with Redis in production)
const chatRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(userId) {
    const now = Date.now();
    const userLimits = chatRateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    if (now > userLimits.resetAt) {
        // Reset window
        chatRateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userLimits.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    userLimits.count++;
    chatRateLimits.set(userId, userLimits);
    return true;
}

// 9. Chat Endpoint (Protected)
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const { userId } = req.user;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.trim().length === 0) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
        }

        // Rate limiting
        if (!checkRateLimit(userId)) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please wait before sending more messages.'
            });
        }

        // Query RAG system
        const reply = await queryRAG(message);

        res.json({ reply });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 10. RAG Status Endpoint (for debugging)
app.get('/api/chat/status', authenticateToken, async (req, res) => {
    try {
        const status = getRAGStatus();
        res.json(status);
    } catch (error) {
        console.error('Error in /api/chat/status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// -------------------------------------------------------------
// TAGS API
// -------------------------------------------------------------

// Get popular tags (most frequently used in questions)
app.get('/api/tags/popular', async (req, res) => {
    try {
        const db = await getDb();

        // Get top 15 most used tags from question_tags table
        const result = await db.all(`
            SELECT 
                tag_name,
                COUNT(*) as usage_count
            FROM question_tags
            GROUP BY tag_name
            ORDER BY usage_count DESC
            LIMIT 15
        `);

        // Format the response
        const popularTags = result.map(row => ({
            name: row.tag_name,
            count: row.usage_count
        }));

        res.json(popularTags);
    } catch (error) {
        console.error('Error in /api/tags/popular:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// -------------------------------------------------------------
// LEADERBOARD API
// -------------------------------------------------------------

// Get leaderboard data (users with 50+ credits)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const db = await getDb();

        // Get users with at least 50 credits, ordered by credits desc
        const users = await db.all(`
            SELECT 
                u.id,
                u.name,
                u.batch,
                u.branch,
                u.credits,
                COUNT(DISTINCT CASE WHEN a.is_accepted = 1 THEN a.id END) as answersAccepted,
                COUNT(DISTINCT a.id) as totalAnswers,
                COUNT(DISTINCT CASE WHEN q.is_verified = 1 THEN q.id END) as merges
            FROM users u
            LEFT JOIN answers a ON u.id = a.author_id
            LEFT JOIN questions q ON a.question_id = q.id
            WHERE u.credits >= 50
            GROUP BY u.id
            ORDER BY u.credits DESC
            LIMIT 100
        `);

        // Calculate accuracy for each user
        const leaderboard = users.map(user => ({
            id: user.id,
            name: user.name || `User#${user.id}`,
            batch: user.batch || 'N/A',
            branch: user.branch || 'CSE',
            credits: user.credits,
            answersAccepted: user.answersAccepted,
            accuracy: user.totalAnswers > 0
                ? Math.round((user.answersAccepted / user.totalAnswers) * 100)
                : 0,
            merges: user.merges
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Error in /api/leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS - Answer Verification System
// -------------------------------------------------------------

// 1. Get All Unverified Answers (Admin Only)
app.get('/admin/answers/unverified', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = await getDb();

        const unverifiedAnswers = await db.all(`
            SELECT 
                a.id,
                a.content,
                a.created_at,
                a.question_id,
                q.title as question_title,
                q.difficulty as question_difficulty,
                q.difficulty as difficulty_tier,
                q.difficulty,
                u.id as author_id,
                u.name as author_name,
                u.email as author_email
            FROM answers a
            JOIN users u ON a.author_id = u.id
            JOIN questions q ON a.question_id = q.id
            WHERE a.is_verified = 0
            ORDER BY a.created_at DESC
        `);

        // Calculate credit_value based on difficulty
        const creditMap = { Bronze: 5, Silver: 10, Gold: 20, Platinum: 40 };
        unverifiedAnswers.forEach(answer => {
            answer.credit_value = creditMap[answer.difficulty] || 15;
        });

        res.json(unverifiedAnswers);

    } catch (error) {
        console.error('[Admin] Error fetching unverified answers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Verify Answer (Admin Only)
app.post('/admin/answers/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const answerId = req.params.id;
        const adminId = req.user.userId;
        const db = await getDb();

        await db.exec('BEGIN TRANSACTION');

        try {
            // Get answer details
            const answer = await db.get(`
                SELECT a.*, q.credit_value, q.title as question_title
                FROM answers a
                JOIN questions q ON a.question_id = q.id
                WHERE a.id = ?
            `, answerId);

            if (!answer) {
                await db.exec('ROLLBACK');
                return res.status(404).json({ error: 'Answer not found' });
            }

            if (answer.is_maintainer_verified === 1) {
                await db.exec('ROLLBACK');
                return res.status(400).json({ error: 'Answer already verified' });
            }

            // Update answer verification status
            await db.run(`
                UPDATE answers 
                SET is_maintainer_verified = 1,
                    verified_by = ?,
                    verified_at = datetime('now')
                WHERE id = ?
            `, adminId, answerId);

            // Award credits to the author
            const creditValue = answer.credit_value || 15;
            await db.run(`
                UPDATE users 
                SET credits = COALESCE(credits, 0) + ?
                WHERE id = ?
            `, creditValue, answer.author_id);

            // Record credit transaction
            await db.run(`
                INSERT INTO credit_transactions (user_id, amount, type, description)
                VALUES (?, ?, 'ANSWER_VERIFIED', ?)
            `, answer.author_id, creditValue, `Answer verified for: ${answer.question_title}`);

            await db.exec('COMMIT');

            console.log(`[Admin] Answer ${answerId} verified by admin ${adminId}, ${creditValue} credits awarded`);

            res.json({
                message: 'Answer verified successfully',
                creditsAwarded: creditValue,
                answerId: answerId
            });

        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('[Admin] Error verifying answer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Reject/Delete Answer (Admin Only)
app.delete('/admin/answers/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const answerId = req.params.id;
        const { reason } = req.body; // Optional rejection reason
        const db = await getDb();

        // Check if answer exists and is unverified
        const answer = await db.get('SELECT * FROM answers WHERE id = ?', answerId);

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        if (answer.is_verified === 1) {
            return res.status(400).json({ error: 'Cannot reject verified answer' });
        }

        // Delete the answer
        await db.run('DELETE FROM answers WHERE id = ?', answerId);

        console.log(`[Admin] Answer ${answerId} rejected and deleted. Reason: ${reason || 'Not specified'}`);

        res.json({ message: 'Answer rejected and removed' });

    } catch (error) {
        console.error('[Admin] Error rejecting answer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Get Verified Answers (Admin Only)
app.get('/admin/answers/verified', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const verifiedAnswers = await db.all(`
            SELECT 
                a.*,
                u.name as author_name,
                u.email as author_email,
                q.title as question_title
            FROM answers a
            JOIN users u ON a.author_id = u.id
            JOIN questions q ON a.question_id = q.id
            WHERE a.is_verified = 1
            ORDER BY a.verified_at DESC
            LIMIT 50
        `);
        res.json(verifiedAnswers);
    } catch (error) {
        console.error('Error fetching verified answers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Get Admin Dashboard Stats (Admin Only)
app.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = await getDb();

        const pendingCount = await db.get('SELECT COUNT(*) as count FROM answers WHERE is_verified = 0');
        const verifiedCount = await db.get('SELECT COUNT(*) as count FROM answers WHERE is_verified = 1');
        const totalQuestions = await db.get('SELECT COUNT(*) as count FROM questions');
        const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');

        // Recent activity
        const recentVerifications = await db.all(`
            SELECT 
                a.id,
                a.verified_at,
                u.name as author_name,
                q.title as question_title
            FROM answers a
            JOIN users u ON a.author_id = u.id
            JOIN questions q ON a.question_id = q.id
            WHERE a.is_verified = 1 AND a.verified_at IS NOT NULL
            ORDER BY a.verified_at DESC
            LIMIT 10
        `);

        res.json({
            pendingReviews: pendingCount.count,
            totalVerified: verifiedCount.count,
            totalQuestions: totalQuestions.count,
            totalUsers: totalUsers.count,
            recentVerifications
        });

    } catch (error) {
        console.error('[Admin] Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 5. Delete Any Answer (Admin Only)
app.delete('/admin/answers/:id/delete', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const answerId = req.params.id;
        const db = await getDb();

        // Check if answer exists
        const answer = await db.get('SELECT * FROM answers WHERE id = ?', answerId);

        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }

        // Delete the answer (admin can delete any answer)
        await db.run('DELETE FROM answers WHERE id = ?', answerId);

        console.log(`[Admin] Answer ${answerId} deleted by admin`);

        res.json({ message: 'Answer deleted successfully' });

    } catch (error) {
        console.error('[Admin] Error deleting answer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------------------------------
// ADMIN QUESTION MANAGEMENT
// -------------------------------------------------------------

// 1. Get Pending Questions (Admin Only)
app.get('/admin/questions/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const pendingQuestions = await db.all(`
            SELECT 
                q.*,
                u.name as author_name,
                u.email as author_email
            FROM questions q
            JOIN users u ON q.author_id = u.id
            WHERE q.is_verified = 0 OR q.is_verified IS NULL
            ORDER BY q.created_at DESC
        `);
        res.json(pendingQuestions);
    } catch (error) {
        console.error('[Admin] Error fetching pending questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Verify Question (Admin Only)
app.post('/admin/questions/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const questionId = req.params.id;
        const { difficulty } = req.body;
        const adminId = req.user.userId;
        const db = await getDb();

        if (!difficulty) {
            return res.status(400).json({ error: 'Difficulty is required' });
        }

        // Validate difficulty
        const validDiffs = ['Bronze', 'Silver', 'Gold', 'Platinum'];
        if (!validDiffs.includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid difficulty' });
        }

        // Check if question exists
        const question = await db.get('SELECT * FROM questions WHERE id = ?', questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        if (question.is_verified === 1) {
            return res.status(400).json({ error: 'Question already verified' });
        }

        try {
            await db.exec('BEGIN TRANSACTION');

            // Update question verification status and difficulty
            await db.run(`
                UPDATE questions 
                SET is_verified = 1,
                    verified_by = ?,
                    verified_at = datetime('now'),
                    difficulty = ?
                WHERE id = ?
            `, adminId, difficulty, questionId);

            // Award credits based on difficulty
            const creditMap = {
                'Bronze': 5,
                'Silver': 10,
                'Gold': 20,
                'Platinum': 40
            };
            const creditsAwarded = creditMap[difficulty];

            await db.run(`
                UPDATE users 
                SET credits = COALESCE(credits, 0) + ?
                WHERE id = ?
            `, creditsAwarded, question.author_id);

            // Record credit transaction
            await db.run(`
                INSERT INTO credit_transactions (user_id, amount, type, description)
                VALUES (?, ?, 'QUESTION_VERIFIED', ?)
            `, question.author_id, creditsAwarded, `Question verified: ${question.title}`);

            await db.exec('COMMIT');

            console.log(`[Admin] Question ${questionId} verified by admin ${adminId}, ${creditsAwarded} credits awarded`);

            res.json({
                message: 'Question verified successfully',
                creditsAwarded,
                questionId
            });

        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('[Admin] Error verifying question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Delete Question (Admin Only)
app.delete('/admin/questions/:id/delete', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const questionId = req.params.id;
        const db = await getDb();

        // Check if question exists
        const question = await db.get('SELECT * FROM questions WHERE id = ?', questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        try {
            await db.exec('BEGIN TRANSACTION');

            // Delete associated votes on answers
            await db.run(`
                DELETE FROM votes 
                WHERE target_type = 'answer' 
                AND target_id IN (SELECT id FROM answers WHERE question_id = ?)
            `, questionId);

            // Delete associated answers
            await db.run('DELETE FROM answers WHERE question_id = ?', questionId);

            // Delete votes on the question itself
            await db.run(`
                DELETE FROM votes 
                WHERE target_type = 'question' AND target_id = ?
            `, questionId);

            // Delete the question
            await db.run('DELETE FROM questions WHERE id = ?', questionId);

            await db.exec('COMMIT');

            console.log(`[Admin] Question ${questionId} and associated content deleted`);

            res.json({ message: 'Question and associated content deleted successfully' });

        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('[Admin] Error deleting question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// -------------------------------------------------------------
// GOODIES MARKETPLACE APIs
// -------------------------------------------------------------

// Get all active goodies (public)
app.get('/api/goodies', async (req, res) => {
    try {
        const db = await getDb();
        const goodies = await db.all(`
            SELECT id, name, description, image_url, cost, stock, category, created_at
            FROM goodies
            WHERE is_active = 1
            ORDER BY category, cost ASC
        `);
        res.json(goodies);
    } catch (error) {
        console.error('[Goodies] Error fetching goodies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single goodie details
app.get('/api/goodies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        const goodie = await db.get(`
            SELECT id, name, description, image_url, cost, stock, category, created_at
            FROM goodies
            WHERE id = ? AND is_active = 1
        `, id);

        if (!goodie) {
            return res.status(404).json({ error: 'Goodie not found' });
        }

        res.json(goodie);
    } catch (error) {
        console.error('[Goodies] Error fetching goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Purchase a goodie
app.post('/api/goodies/:id/purchase', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const db = await getDb();

        // Get goodie details
        const goodie = await db.get('SELECT * FROM goodies WHERE id = ? AND is_active = 1', id);
        if (!goodie) {
            return res.status(404).json({ error: 'Goodie not found' });
        }

        // Check stock
        if (goodie.stock === 0) {
            return res.status(400).json({ error: 'Out of stock' });
        }

        // Get user credits
        const user = await db.get('SELECT credits FROM users WHERE id = ?', userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user has enough credits
        if (user.credits < goodie.cost) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        // Execute purchase in transaction
        await db.exec('BEGIN TRANSACTION');
        try {
            // Deduct credits
            await db.run('UPDATE users SET credits = credits - ? WHERE id = ?', goodie.cost, userId);

            // Record purchase
            await db.run(
                'INSERT INTO purchases (user_id, goodie_id, cost_paid, status) VALUES (?, ?, ?, ?)',
                userId, goodie.id, goodie.cost, 'completed'
            );

            // Record credit transaction
            await db.run(
                'INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
                userId, -goodie.cost, 'SPEND', `Purchased: ${goodie.name}`
            );

            // Update stock (if not unlimited)
            if (goodie.stock !== -1) {
                await db.run('UPDATE goodies SET stock = stock - 1 WHERE id = ?', goodie.id);
            }

            await db.exec('COMMIT');

            // Get updated credits
            const updatedUser = await db.get('SELECT credits FROM users WHERE id = ?', userId);

            console.log(`[Goodies] User ${userId} purchased ${goodie.name} for ${goodie.cost} credits`);

            res.json({
                message: 'Purchase successful',
                goodie: { id: goodie.id, name: goodie.name },
                credits: updatedUser.credits
            });
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('[Goodies] Error purchasing goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's purchase history
app.get('/api/users/purchases', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const db = await getDb();

        const purchases = await db.all(`
            SELECT p.*, g.name as goodie_name, g.description, g.image_url, g.category
            FROM purchases p
            JOIN goodies g ON p.goodie_id = g.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, userId);

        res.json(purchases);
    } catch (error) {
        console.error('[Goodies] Error fetching purchases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------------------------------
// ADMIN GOODIES MANAGEMENT
// -------------------------------------------------------------

// Get all goodies (including inactive) - Admin only
app.get('/admin/goodies', requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const goodies = await db.all(`
            SELECT g.*, 
                   (SELECT COUNT(*) FROM purchases WHERE goodie_id = g.id) as total_purchases,
                   (SELECT SUM(cost_paid) FROM purchases WHERE goodie_id = g.id) as total_revenue
            FROM goodies g
            ORDER BY g.created_at DESC
        `);
        res.json(goodies);
    } catch (error) {
        console.error('[Admin] Error fetching goodies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new goodie - Admin only
app.post('/admin/goodies', requireAdmin, async (req, res) => {
    try {
        const { name, description, image_url, cost, stock, category } = req.body;

        if (!name || !description || cost === undefined || cost === null) {
            return res.status(400).json({ error: 'Name, description, and cost are required' });
        }

        if (cost < 0) {
            return res.status(400).json({ error: 'Cost cannot be negative' });
        }

        const db = await getDb();
        const result = await db.run(`
            INSERT INTO goodies (name, description, image_url, cost, stock, category, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `, name, description, image_url || '/placeholder.svg', cost, stock || -1, category || 'Other');

        const newGoodie = await db.get('SELECT * FROM goodies WHERE id = ?', result.lastID);

        console.log(`[Admin] Created new goodie: ${name}`);
        res.json(newGoodie);
    } catch (error) {
        console.error('[Admin] Error creating goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update goodie - Admin only
app.put('/admin/goodies/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image_url, cost, stock, category, is_active } = req.body;

        const db = await getDb();
        const goodie = await db.get('SELECT * FROM goodies WHERE id = ?', id);
        if (!goodie) {
            return res.status(404).json({ error: 'Goodie not found' });
        }

        await db.run(`
            UPDATE goodies
            SET name = ?, description = ?, image_url = ?, cost = ?, stock = ?, category = ?, is_active = ?
            WHERE id = ?
        `,
            name || goodie.name,
            description || goodie.description,
            image_url || goodie.image_url,
            cost !== undefined ? cost : goodie.cost,
            stock !== undefined ? stock : goodie.stock,
            category || goodie.category,
            is_active !== undefined ? is_active : goodie.is_active,
            id
        );

        const updatedGoodie = await db.get('SELECT * FROM goodies WHERE id = ?', id);
        console.log(`[Admin] Updated goodie: ${updatedGoodie.name}`);
        res.json(updatedGoodie);
    } catch (error) {
        console.error('[Admin] Error updating goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Toggle goodie active status - Admin only
app.patch('/admin/goodies/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const goodie = await db.get('SELECT * FROM goodies WHERE id = ?', id);
        if (!goodie) {
            return res.status(404).json({ error: 'Goodie not found' });
        }

        const newStatus = goodie.is_active === 1 ? 0 : 1;
        await db.run('UPDATE goodies SET is_active = ? WHERE id = ?', newStatus, id);

        console.log(`[Admin] Toggled goodie ${goodie.name} to ${newStatus === 1 ? 'active' : 'inactive'}`);
        res.json({ is_active: newStatus });
    } catch (error) {
        console.error('[Admin] Error toggling goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete goodie - Admin only
app.delete('/admin/goodies/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();

        const goodie = await db.get('SELECT * FROM goodies WHERE id = ?', id);
        if (!goodie) {
            return res.status(404).json({ error: 'Goodie not found' });
        }

        // Soft delete by setting is_active to 0
        await db.run('UPDATE goodies SET is_active = 0 WHERE id = ?', id);

        console.log(`[Admin] Deleted goodie: ${goodie.name}`);
        res.json({ message: 'Goodie deleted successfully' });
    } catch (error) {
        console.error('[Admin] Error deleting goodie:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -------------------------------------------------------------
// ANSWER CHALLENGE APIs
// -------------------------------------------------------------

// Submit challenge for a verified answer
app.post('/answers/:id/challenge', authenticateToken, async (req, res) => {
    try {
        const { id: answerId } = req.params;
        const { content } = req.body;
        const { userId } = req.user;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Challenge content is required' });
        }

        const db = await getDb();

        // Get user credits
        const user = await db.get('SELECT credits FROM users WHERE id = ?', userId);
        if (!user || user.credits < 500) {
            return res.status(403).json({ error: 'You need at least 500 credits to challenge an answer' });
        }

        // Verify answer exists and is verified
        const answer = await db.get('SELECT id, is_verified FROM answers WHERE id = ?', answerId);
        if (!answer) {
            return res.status(404).json({ error: 'Answer not found' });
        }
        if (answer.is_verified !== 1) {
            return res.status(400).json({ error: 'Only verified answers can be challenged' });
        }

        // Create challenge
        const result = await db.run(`
            INSERT INTO answer_challenges (answer_id, challenger_id, challenge_content, status)
            VALUES (?, ?, ?, 'pending')
        `, answerId, userId, content);

        console.log(`[Challenge] User ${userId} challenged answer ${answerId}`);

        res.json({
            message: 'Challenge submitted successfully',
            challengeId: result.lastID
        });
    } catch (error) {
        console.error('[Challenge] Error submitting challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all challenges (Admin only)
app.get('/admin/challenges', requireAdmin, async (req, res) => {
    try {
        const db = await getDb();
        const challenges = await db.all(`
            SELECT 
                ac.*,
                a.content as original_content,
                a.question_id,
                q.title as question_title,
                u.name as challenger_name,
                u.email as challenger_email
            FROM answer_challenges ac
            JOIN answers a ON ac.answer_id = a.id
            JOIN questions q ON a.question_id = q.id
            JOIN users u ON ac.challenger_id = u.id
            ORDER BY 
                CASE ac.status 
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'rejected' THEN 3
                END,
                ac.created_at DESC
        `);
        res.json(challenges);
    } catch (error) {
        console.error('[Admin] Error fetching challenges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve challenge (Admin only)
app.put('/admin/challenges/:id/approve', requireAdmin, async (req, res) => {
    try {
        const { id: challengeId } = req.params;
        const { userId: adminId } = req.user;
        const db = await getDb();

        // Get challenge details
        const challenge = await db.get(`
            SELECT ac.*, a.user_id as original_author_id
            FROM answer_challenges ac
            JOIN answers a ON ac.answer_id = a.id
            WHERE ac.id = ?
        `, challengeId);

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        if (challenge.status !== 'pending') {
            return res.status(400).json({ error: 'Challenge already reviewed' });
        }

        await db.exec('BEGIN TRANSACTION');
        try {
            // Update original answer with new content
            await db.run(`
                UPDATE answers 
                SET content = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, challenge.challenge_content, challenge.answer_id);

            // Mark challenge as approved
            await db.run(`
                UPDATE answer_challenges
                SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
                WHERE id = ?
            `, adminId, challengeId);

            // Award credits to challenger (150 credits)
            await db.run('UPDATE users SET credits = credits + 150 WHERE id = ?', challenge.challenger_id);

            // Record credit transaction
            await db.run(`
                INSERT INTO credit_transactions (user_id, amount, type, description)
                VALUES (?, 150, 'REWARD', 'Challenge approved for answer')
            `, challenge.challenger_id);

            await db.exec('COMMIT');

            console.log(`[Admin] Challenge ${challengeId} approved by admin ${adminId}`);
            res.json({ message: 'Challenge approved successfully' });
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('[Admin] Error approving challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject challenge (Admin only)
app.put('/admin/challenges/:id/reject', requireAdmin, async (req, res) => {
    try {
        const { id: challengeId } = req.params;
        const { admin_notes } = req.body;
        const { userId: adminId } = req.user;
        const db = await getDb();

        const challenge = await db.get('SELECT * FROM answer_challenges WHERE id = ?', challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        if (challenge.status !== 'pending') {
            return res.status(400).json({ error: 'Challenge already reviewed' });
        }

        await db.run(`
            UPDATE answer_challenges
            SET status = 'rejected', admin_notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
            WHERE id = ?
        `, admin_notes || '', adminId, challengeId);

        console.log(`[Admin] Challenge ${challengeId} rejected by admin ${adminId}`);
        res.json({ message: 'Challenge rejected successfully' });
    } catch (error) {
        console.error('[Admin] Error rejecting challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Server startup and initialization
// Start Server Logic
(async () => {
    // Only attempt to verify connection if required params are present (handled inside verifyConnection)
    // But we want to fail fast if they are missing.

    const isConnected = await verifyConnection();
    if (!isConnected) {
        console.error('[SERVER] Aborting startup. Critical email configuration missing or invalid.');
        process.exit(1);
    }

    // Extract website content before initializing RAG
    console.log('[SERVER] Extracting website content...');
    extractWebsiteContent();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
