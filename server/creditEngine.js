
// Credit Configuration
const CREDIT_CONFIG = {
    TIERS: {
        BRONZE: { min: 0 },
        SILVER: { min: 100 },
        GOLD: { min: 300 },
        PLATINUM: { min: 700 }
    },
    REWARDS: {
        ANSWER_ACCEPTED: {
            Easy: 10,
            Medium: 20,
            Hard: 35
        },
        MAINTAINER_VERIFIED_BONUS: 20
    },
    DAILY_CAP: 50
};

export class CreditEngine {
    constructor(db) {
        this.db = db;
    }

    // --- Helpers ---

    getTier(credits) {
        if (credits >= CREDIT_CONFIG.TIERS.PLATINUM.min) return 'Platinum';
        if (credits >= CREDIT_CONFIG.TIERS.GOLD.min) return 'Gold';
        if (credits >= CREDIT_CONFIG.TIERS.SILVER.min) return 'Silver';
        return 'Bronze';
    }

    async getCreditsToday(userId) {
        // Start of day in UTC. For simplicity, we use SQLite's 'start of day' or JS date.
        // Let's use JS logic to be TZ agnostic relative to server.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await this.db.get(`
            SELECT SUM(amount) as total 
            FROM credit_transactions 
            WHERE user_id = ? 
            AND type = 'EARN'
            AND created_at >= ?
        `, userId, startOfDay.toISOString());

        return result.total || 0;
    }

    // --- Core Actions ---

    /**
     * @param {number} userId 
     * @param {number} amount 
     * @param {string} reason 
     * @param {string} type 'EARN' | 'SPEND' | 'PENALTY'
     */
    async awardCredits(userId, amount, reason, type = 'EARN') {
        if (amount <= 0) return { success: false, reason: 'Amount must be positive' };

        // 1. Check Daily Cap if Earning
        if (type === 'EARN') {
            const earnedToday = await this.getCreditsToday(userId);
            if (earnedToday + amount > CREDIT_CONFIG.DAILY_CAP) {
                // Determine if we can award partial or 0
                const allowed = Math.max(0, CREDIT_CONFIG.DAILY_CAP - earnedToday);
                if (allowed === 0) {
                    return { success: false, reason: 'Daily credit cap reached' };
                }
                amount = allowed; // Cap the earnings
                reason += ` (Capped. Original: ${reason})`;
            }
        }

        // 2. Transact
        // Assuming we are INSIDE a transact block or we just run it here.
        // Since we want this atomic with the logic calling it, usually the CALLER manages the transaction.
        // However, if we accept 'db' as a transaction object (which sqlite `open` instance isn't directly, but `db.run` works),
        // we should probably just run the updates. Ideally, the caller wraps this in `BEGIN TRANSACTION`.

        await this.db.run('UPDATE users SET credits = credits + ? WHERE id = ?', amount, userId);
        await this.db.run(
            'INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            userId, amount, type, reason
        );

        return { success: true, amount };
    }
}

export { CREDIT_CONFIG };
