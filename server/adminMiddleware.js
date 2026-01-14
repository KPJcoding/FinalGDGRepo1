// Admin middleware - verifies user has ADMIN role
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Authenticate token and populate req.user
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Check if authenticated user is admin
const requireAdmin = async (req, res, next) => {
    // First authenticate the token
    authenticateToken(req, res, async () => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const { userId } = req.user;
            const db = await getDb();

            const user = await db.get('SELECT role FROM users WHERE id = ?', userId);

            if (!user || user.role !== 'ADMIN') {
                console.log(`[Admin Middleware] Access denied for user ${userId}`);
                return res.status(403).json({ error: 'Admin access required' });
            }

            next();
        } catch (error) {
            console.error('[Admin Middleware] Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

export { requireAdmin };

/**
 * Helper function to check if a user is admin (for queries)
 */
export async function isAdmin(userId) {
    try {
        const db = await getDb();
        const user = await db.get('SELECT role FROM users WHERE id = ?', userId);
        return user && user.role === 'ADMIN';
    } catch (error) {
        console.error('[Admin Helper] Error checking admin status:', error);
        return false;
    }
}
