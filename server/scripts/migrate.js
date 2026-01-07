
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = './database_v2.sqlite';

async function migrate() {
    console.log('--- Starting Manual Migration ---');
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    try {
        const userColumns = await db.all("PRAGMA table_info(users)");

        if (!userColumns.some(col => col.name === 'credits')) {
            console.log("Adding 'credits' to users...");
            await db.run("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0");
        }

        if (!userColumns.some(col => col.name === 'role')) {
            console.log("Adding 'role' to users...");
            await db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
        }

        const answerColumns = await db.all("PRAGMA table_info(answers)");
        if (!answerColumns.some(col => col.name === 'is_maintainer_verified')) {
            console.log("Adding 'is_maintainer_verified' to answers...");
            await db.run("ALTER TABLE answers ADD COLUMN is_maintainer_verified INTEGER DEFAULT 0");
        }

        // Also ensure votes table exists (it was inside the large CREATE block in db.js, might be missed if table already existed)
        // db.js handles 'CREATE TABLE IF NOT EXISTS', but let's double check.
        await db.run(`
            CREATE TABLE IF NOT EXISTS votes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              target_id INTEGER NOT NULL,
              target_type TEXT NOT NULL,
              value INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.close();
    }
}

migrate();
