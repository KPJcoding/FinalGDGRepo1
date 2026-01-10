import { getDb } from './db.js';

async function checkQuestions() {
    const db = await getDb();
    console.log('\n=== ALL QUESTIONS ===');
    const allQuestions = await db.all('SELECT id, title, is_verified, difficulty, created_at FROM questions ORDER BY created_at DESC');
    console.table(allQuestions);

    console.log('\n=== VERIFIED QUESTIONS (What public sees) ===');
    const verifiedQuestions = await db.all('SELECT id, title, difficulty FROM questions WHERE is_verified = 1');
    console.table(verifiedQuestions);

    console.log('\n=== UNVERIFIED QUESTIONS (Should be in admin panel) ===');
    const unverifiedQuestions = await db.all('SELECT id, title, difficulty FROM questions WHERE is_verified = 0 OR is_verified IS NULL');
    console.table(unverifiedQuestions);
}

checkQuestions().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
