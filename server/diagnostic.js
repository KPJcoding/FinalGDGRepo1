import { getDb } from './db.js';

// Query users and answers to diagnose the issue
(async () => {
    try {
        const db = await getDb();

        console.log('\n=== ALL USERS ===');
        const users = await db.all('SELECT id, email, name, batch, branch, credits FROM users ORDER BY id');
        console.table(users);

        console.log('\n=== RECENT ANSWERS WITH AUTHOR INFO ===');
        const answers = await db.all(`
      SELECT 
        a.id, 
        SUBSTR(a.content, 1, 50) as content_preview,
        a.author_id, 
        u.name as author_name,
        u.email as author_email,
        a.created_at
      FROM answers a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 15
    `);
        console.table(answers);

        console.log('\n✓ Diagnostic query complete!');
        console.log('\nIf you see your answers attributed to the wrong user, we will fix it.');

    } catch (error) {
        console.error('Error:', error);
    }
})();
