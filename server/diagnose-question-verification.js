import { getDb } from './db.js';

console.log('\n🔍 QUESTION VERIFICATION DIAGNOSTIC\n');

async function diagnose() {
    const db = await getDb();

    // 1. Check schema
    console.log('1. Checking database schema...');
    const schema = await db.all("PRAGMA table_info(questions)");
    const hasVerified = schema.some(col => col.name === 'is_verified');
    console.log(`   is_verified column exists: ${hasVerified ? '✅' : '❌'}`);

    if (!hasVerified) {
        console.log('\n❌ CRITICAL: is_verified column missing!');
        console.log('   Run: node migrations/add-question-verification.js');
        process.exit(1);
    }

    // 2. Count questions by status
    console.log('\n2. Question counts:');
    const total = await db.get('SELECT COUNT(*) as count FROM questions');
    const verified = await db.get('SELECT COUNT(*) as count FROM questions WHERE is_verified = 1');
    const unverified = await db.get('SELECT COUNT(*) as count FROM questions WHERE is_verified = 0 OR is_verified IS NULL');

    console.log(`   Total questions: ${total.count}`);
    console.log(`   ✅ Verified (public): ${verified.count}`);
    console.log(`   ⏳ Unverified (pending admin): ${unverified.count}`);

    // 3. Show unverified questions
    if (unverified.count > 0) {
        console.log('\n3. Pending questions (should appear in admin panel):');
        const pending = await db.all('SELECT id, title, is_verified, created_at FROM questions WHERE is_verified = 0 OR is_verified IS NULL');
        pending.forEach(q => {
            console.log(`   - [ID ${q.id}] "${q.title}" (is_verified: ${q.is_verified})`);
        });
    } else {
        console.log('\n3. No pending questions found.');
    }

    // 4. Test public query
    console.log('\n4. Testing public query (GET /questions):');
    const publicQuestions = await db.all(`
        SELECT q.id, q.title, q.is_verified
        FROM questions q
        WHERE q.is_verified = 1
        ORDER BY q.created_at DESC
    `);
    console.log(`   Public API will return: ${publicQuestions.length} questions`);

    // 5. Test admin query
    console.log('\n5. Testing admin query (GET /admin/questions/pending):');
    const adminQuestions = await db.all(`
        SELECT q.id, q.title, q.is_verified
        FROM questions q
        WHERE q.is_verified = 0 OR q.is_verified IS NULL
    `);
    console.log(`   Admin panel will show: ${adminQuestions.length} pending questions`);

    console.log('\n✅ DIAGNOSTIC COMPLETE\n');

    // 6. Recommendations
    if (unverified.count === 0 && total.count > 0) {
        console.log('⚠️  WARNING: All questions are verified!');
        console.log('   This means existing questions were grandfathered as verified.');
        console.log('   New questions WILL require admin verification.');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. RESTART the backend server: Ctrl+C, then node index.js');
    console.log('2. Try submitting a NEW question as a user');
    console.log('3. Check it appears in Admin Dashboard > Pending Questions');
    console.log('4. Verify it does NOT appear on Explore page');
    console.log('5. Admin verifies the question');
    console.log('6. Check it NOW appears on Explore page\n');
}

diagnose()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
