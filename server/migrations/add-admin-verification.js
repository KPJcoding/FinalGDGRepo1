import { getDb } from '../db.js';

console.log('[MIGRATION] Starting admin and verification features migration...');

async function columnExists(db, tableName, columnName) {
    const result = await db.get(`PRAGMA table_info(${tableName})`);
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    return columns.some(col => col.name === columnName);
}

async function migrate() {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        // 1. Add role column to users table if it doesn't exist
        console.log('[MIGRATION] Checking role column in users table...');
        const roleExists = await columnExists(db, 'users', 'role');
        if (!roleExists) {
            console.log('[MIGRATION] Adding role column...');
            await db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'`);
            console.log('[MIGRATION] ✓ Role column added');
        } else {
            console.log('[MIGRATION] Role column already exists, skipping');
        }

        // 2. Assign admin role to the specified email
        console.log('[MIGRATION] Assigning admin role to bt25csh068@iiitn.ac.in...');
        const result = await db.run(`
      UPDATE users SET role = 'ADMIN' WHERE email = 'bt25csh068@iiitn.ac.in'
    `);
        console.log(`[MIGRATION] ✓ Updated ${result.changes} user(s) to ADMIN role`);

        // 3. Add verification columns to answers table
        const isVerifiedExists = await columnExists(db, 'answers', 'is_verified');
        if (!isVerifiedExists) {
            console.log('[MIGRATION] Adding is_verified column to answers...');
            await db.exec(`ALTER TABLE answers ADD COLUMN is_verified INTEGER DEFAULT 0`);
            console.log('[MIGRATION] ✓ is_verified column added');
        } else {
            console.log('[MIGRATION] is_verified column already exists');
        }

        const verifiedByExists = await columnExists(db, 'answers', 'verified_by');
        if (!verifiedByExists) {
            console.log('[MIGRATION] Adding verified_by column to answers...');
            await db.exec(`ALTER TABLE answers ADD COLUMN verified_by INTEGER`);
            console.log('[MIGRATION] ✓ verified_by column added');
        } else {
            console.log('[MIGRATION] verified_by column already exists');
        }

        const verifiedAtExists = await columnExists(db, 'answers', 'verified_at');
        if (!verifiedAtExists) {
            console.log('[MIGRATION] Adding verified_at column to answers...');
            await db.exec(`ALTER TABLE answers ADD COLUMN verified_at TEXT`);
            console.log('[MIGRATION] ✓ verified_at column added');
        } else {
            console.log('[MIGRATION] verified_at column already exists');
        }

        // 4. Add credit_value column to questions table
        const creditValueExists = await columnExists(db, 'questions', 'credit_value');
        if (!creditValueExists) {
            console.log('[MIGRATION] Adding credit_value to questions...');
            await db.exec(`ALTER TABLE questions ADD COLUMN credit_value INTEGER DEFAULT 15`);
            console.log('[MIGRATION] ✓ credit_value column added');
        } else {
            console.log('[MIGRATION] credit_value column already exists');
        }

        // 5. Update credit values based on difficulty (use difficulty_tier if it exists)
        console.log('[MIGRATION] Setting credit values based on difficulty...');
        const diffColExists = await columnExists(db, 'questions', 'difficulty');
        const diffTierColExists = await columnExists(db, 'questions', 'difficulty_tier');

        const diffColumn = diffTierColExists ? 'difficulty_tier' : (diffColExists ? 'difficulty' : null);

        if (diffColumn) {
            const creditMap = {
                'Bronze': 15,
                'Silver': 30,
                'Gold': 50,
                'Platinum': 75,
                'Easy': 15,
                'Medium': 30,
                'Hard': 50
            };

            for (const [difficulty, credits] of Object.entries(creditMap)) {
                await db.run(`UPDATE questions SET credit_value = ? WHERE ${diffColumn} = ?`, credits, difficulty);
            }
            console.log('[MIGRATION] ✓ Credit values updated');
        } else {
            console.log('[MIGRATION] No difficulty column found, using default credit values');
        }

        // 6. Mark existing answers as verified (for backward compatibility)
        console.log('[MIGRATION] Checking existing answers...');
        const unverifiedCount = await db.get('SELECT COUNT(*) as count FROM answers WHERE is_verified = 0');
        if (unverifiedCount.count > 0) {
            console.log(`[MIGRATION] Marking ${unverifiedCount.count} existing answers as verified...`);
            await db.run(`UPDATE answers SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL`);
            console.log('[MIGRATION] ✓ Existing answers marked as verified');
        } else {
            console.log('[MIGRATION] No unverified answers found');
        }

        await db.exec('COMMIT');

        console.log('\n=== MIGRATION SUMMARY ===');
        console.log('✓ Role-based access control enabled');
        console.log('✓ Answer verification system active');
        console.log('✓ Credit system configured');
        console.log('✓ Admin role assigned to bt25csh068@iiitn.ac.in');
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
