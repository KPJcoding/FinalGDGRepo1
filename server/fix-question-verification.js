import { getDb } from './db.js';

async function fixQuestionVerification() {
    const db = await getDb();

    // Get current state
    const questions = await db.all('SELECT id, title, is_verified FROM questions');

    console.log('\n=== CURRENT STATE ===');
    for (const q of questions) {
        console.log(`ID ${q.id}: "${q.title}" - is_verified: ${q.is_verified}`);
    }

    // Update ALL questions to be verified (since they're already live)
    console.log('\n=== UPDATING ALL TO VERIFIED ===');
    await db.run('UPDATE questions SET is_verified = 1 WHERE is_verified != 1 OR is_verified IS NULL');

    const updated = await db.all('SELECT id, title, is_verified FROM questions');
    console.log('\n=== AFTER UPDATE ===');
    for (const q of updated) {
        console.log(`ID ${q.id}: "${q.title}" - is_verified: ${q.is_verified}`);
    }

    console.log('\n✅ All existing questions are now marked as verified');
    console.log('💡 New questions will default to is_verified = 0');
}

fixQuestionVerification().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
