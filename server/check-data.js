import { getDb } from './db.js';

async function checkData() {
    const db = await getDb();

    console.log('\n=== DATABASE STATUS ===\n');

    // Count total questions
    const totalQuestions = await db.get('SELECT COUNT(*) as count FROM questions');
    console.log(`Total questions in DB: ${totalQuestions.count}`);

    // Count verified questions
    const verifiedQuestions = await db.get('SELECT COUNT(*) as count FROM questions WHERE is_verified = 1');
    console.log(`Verified questions: ${verifiedQuestions.count}`);

    // Count unverified questions  
    const unverifiedQuestions = await db.get('SELECT COUNT(*) as count FROM questions WHERE is_verified = 0');
    console.log(`Unverified questions: ${unverifiedQuestions.count}`);

    // Show sample questions
    console.log('\n=== SAMPLE VERIFIED QUESTIONS ===');
    const sampleQuestions = await db.all('SELECT id, title, is_verified FROM questions WHERE is_verified = 1 LIMIT 5');
    sampleQuestions.forEach(q => {
        console.log(`  [${q.id}] ${q.title} (verified: ${q.is_verified})`);
    });

    // Count answers
    const totalAnswers = await db.get('SELECT COUNT(*) as count FROM answers');
    console.log(`\nTotal answers in DB: ${totalAnswers.count}`);

    const verifiedAnswers = await db.get('SELECT COUNT(*) as count FROM answers WHERE is_verified = 1');
    console.log(`Verified answers: ${verifiedAnswers.count}`);

    console.log('\n======================\n');
}

checkData()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
