import { getDb } from './db.js';

(async () => {
    const db = await getDb();
    const users = await db.all('SELECT id, email, name, role FROM users');
    console.log('All Users:', JSON.stringify(users, null, 2));
    process.exit(0);
})();
