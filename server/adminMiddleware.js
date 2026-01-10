// Admin middleware - verifies user has ADMIN role
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

/**
 * Middleware to check if the authenticated user has ADMIN role
 * Must be used AFTER authenticateToken middleware
 */
export async function requireAdmin(req, res, next) {
    try {
        // User should already be authenticated by authenticateToken middleware
        const { userId } = req.user;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const db = await getDb();
        const user = await db.get('SELECT id, email, role FROM users WHERE id = ?', userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Attach full user info to request for convenience
        req.adminUser = user;
        next();

    } catch (error) {
        console.error('[Admin Middleware] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

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
