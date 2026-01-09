
// Credit Configuration
const CREDIT_CONFIG = {
    TIERS: {
        BRONZE: { min: 0 },
        SILVER: { min: 300 },
        GOLD: { min: 500 },
        PLATINUM: { min: 750 },
        DIAMOND: { min: 1000 }
    },
    REWARDS: {
        ANSWER_ACCEPTED: {
            Easy: 10,  // Legacy support
            Medium: 20,  // Legacy support
            Hard: 35,  // Legacy support
            Bronze: 15,
            Silver: 30,
            Gold: 50,
            Platinum: 75
        },
        MAINTAINER_VERIFIED_BONUS: 20,
        MIN_UPVOTES_FOR_CREDIT: 3  // Minimum upvotes needed to earn credits on Explore
    },
    DAILY_CAP: 50
};

export class CreditEngine {
    constructor(db) {
        this.db = db;
    }

    // --- Helpers ---

    getTier(credits) {
        if (credits >= CREDIT_CONFIG.TIERS.DIAMOND.min) return 'Diamond';
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

    /**
     * Check if an answer on Explore page qualifies for credits
     * Credits awarded only if answer upvotes > min(other answers) AND upvotes >= 3
     */
    async checkExploreAnswerCredits(answerId, questionId, difficulty_tier) {
        const answer = await this.db.get(
            'SELECT answer_upvotes, author_id FROM answers WHERE id = ?',
            answerId
        );

        if (!answer) return { eligible: false, reason: 'Answer not found' };

        // Check minimum engagement requirement
        if (answer.answer_upvotes < CREDIT_CONFIG.REWARDS.MIN_UPVOTES_FOR_CREDIT) {
            return {
                eligible: false,
                reason: `Need at least ${CREDIT_CONFIG.REWARDS.MIN_UPVOTES_FOR_CREDIT} upvotes`,
                required: CREDIT_CONFIG.REWARDS.MIN_UPVOTES_FOR_CREDIT
            };
        }

        // Get all other answers for this question
        const otherAnswers = await this.db.all(
            'SELECT answer_upvotes FROM answers WHERE question_id = ? AND id != ?',
            questionId,
            answerId
        );

        if (otherAnswers.length === 0) {
            // First answer - eligible if meets minimum
            const creditAmount = CREDIT_CONFIG.REWARDS.ANSWER_ACCEPTED[difficulty_tier] || 15;
            return { eligible: true, creditAmount, isFirst: true };
        }

        // Find minimum upvotes among other answers
        const minOtherUpvotes = Math.min(...otherAnswers.map(a => a.answer_upvotes));

        if (answer.answer_upvotes > minOtherUpvotes) {
            const creditAmount = CREDIT_CONFIG.REWARDS.ANSWER_ACCEPTED[difficulty_tier] || 15;
            return {
                eligible: true,
                creditAmount,
                threshold: minOtherUpvotes,
                currentUpvotes: answer.answer_upvotes
            };
        }

        return {
            eligible: false,
            reason: `Need more than ${minOtherUpvotes} upvotes (current: ${answer.answer_upvotes})`,
            threshold: minOtherUpvotes,
            currentUpvotes: answer.answer_upvotes
        };
    }
}

export { CREDIT_CONFIG };
