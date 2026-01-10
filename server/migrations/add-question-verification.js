import { getDb } from '../db.js';

console.log('[MIGRATION] Starting question verification migration...');

async function columnExists(db, tableName, columnName) {
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    return columns.some(col => col.name === columnName);
}

async function migrate() {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        // 1. Add verification columns to questions table
        const isVerifiedExists = await columnExists(db, 'questions', 'is_verified');
        if (!isVerifiedExists) {
            console.log('[MIGRATION] Adding is_verified column to questions...');
            await db.exec(`ALTER TABLE questions ADD COLUMN is_verified INTEGER DEFAULT 0`);
            console.log('[MIGRATION] ✓ is_verified column added');
        } else {
            console.log('[MIGRATION] is_verified column already exists');
        }

        const verifiedByExists = await columnExists(db, 'questions', 'verified_by');
        if (!verifiedByExists) {
            console.log('[MIGRATION] Adding verified_by column to questions...');
            await db.exec(`ALTER TABLE questions ADD COLUMN verified_by INTEGER`);
            console.log('[MIGRATION] ✓ verified_by column added');
        }

        const verifiedAtExists = await columnExists(db, 'questions', 'verified_at');
        if (!verifiedAtExists) {
            console.log('[MIGRATION] Adding verified_at column to questions...');
            await db.exec(`ALTER TABLE questions ADD COLUMN verified_at TEXT`);
            console.log('[MIGRATION] ✓ verified_at column added');
        }

        // 2. Mark existing questions as verified
        console.log('[MIGRATION] Checking existing questions...');
        const unverifiedCount = await db.get('SELECT COUNT(*) as count FROM questions WHERE is_verified = 0 OR is_verified IS NULL');

        if (unverifiedCount && unverifiedCount.count > 0) {
            console.log(`[MIGRATION] Marking ${unverifiedCount.count} existing questions as verified...`);
            // We can set a default verified_at time, or leave it null/current time. 
            // Setting verified_by to NULL (system) or a default admin ID if known.
            await db.run(`UPDATE questions SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL`);
            console.log('[MIGRATION] ✓ Existing questions marked as verified');
        } else {
            console.log('[MIGRATION] All existing questions are already verified');
        }

        await db.exec('COMMIT');

        console.log('\n=== MIGRATION SUMMARY ===');
        console.log('✓ Question verification columns added');
        console.log('✓ Existing questions grandfathered as verified');
        console.log('=========================\n');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('[MIGRATION] ✗ Migration failed:', error);
        throw error;
    }
}

migrate()
    .then(() => {
        console.log('[MIGRATION] Database migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[MIGRATION] Fatal error:', error.message);
        process.exit(1);
    });
