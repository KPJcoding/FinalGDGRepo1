import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';
import { sendOtpEmail, verifyConnection } from './mailer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

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
                isVerified: !!user.isVerified
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
                isVerified: !!user.isVerified
            }
        });

    } catch (error) {
        console.error('Error in /auth/login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// -------------------------------------------------------------
// ACCOUNT MANAGEMENT
// -------------------------------------------------------------

app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
    // req.user is populated by authenticateToken middleware
    // structure: { userId: 1, email: '...', iat: ..., exp: ... }
    const { userId, email } = req.user;

    try {
        const db = await getDb();



        // Hard Delete User
        await db.run('DELETE FROM users WHERE id = ?', userId);

        // Hard Delete OTP records
        await db.run('DELETE FROM otp_verifications WHERE email = ?', email);

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Error in /auth/delete-account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

import { CreditEngine, CREDIT_CONFIG } from './creditEngine.js';
import { queryRAG, getRAGStatus } from './rag.js';

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
        const result = await db.run(
            'INSERT INTO questions (title, content, difficulty, author_id) VALUES (?, ?, ?, ?)',
            title, content, normalizedDiff, userId
        );
        res.json({ id: result.lastID, message: 'Question created successfully' });

    } catch (error) {
        console.error('Error in POST /questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. List Questions
app.get('/questions', async (req, res) => {
    try {
        const db = await getDb();
        // Naive approach: get all, then we might want to attach vote counts.
        // For foundation, basic list is fine.
        const questions = await db.all(`
            SELECT q.*, u.name as author_name,
            (SELECT SUM(value) FROM votes WHERE target_id = q.id AND target_type = 'question') as vote_count
            FROM questions q 
            JOIN users u ON q.author_id = u.id 
            ORDER BY q.created_at DESC
        `);
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

        const answers = await db.all(`
            SELECT a.*, u.name as author_name 
            FROM answers a 
            JOIN users u ON a.author_id = u.id 
            WHERE a.question_id = ? 
            ORDER BY a.is_maintainer_verified DESC, a.is_accepted DESC, a.created_at ASC
        `, id);

        // Attach votes to answers
        for (const ans of answers) {
            ans.vote_count = await getVoteCount(db, ans.id, 'answer');
        }

        res.json({ ...question, answers });

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

        await db.run(
            'INSERT INTO answers (question_id, author_id, content) VALUES (?, ?, ?)',
            id, userId, content
        );
        res.json({ message: 'Answer posted' });

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



// Start Server Logic
(async () => {
    // Only attempt to verify connection if required params are present (handled inside verifyConnection)
    // But we want to fail fast if they are missing.

    const isConnected = await verifyConnection();
    if (!isConnected) {
        console.error('[SERVER] Aborting startup. Critical email configuration missing or invalid.');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})();
