import { getDb } from './db.js';

(async () => {
    const db = await getDb();
    const user = await db.get('SELECT id, email, name, role FROM users WHERE email = ?', 'bt25csh068@iiitn.ac.in');
    console.log('User in database:', user);
    process.exit(0);
})();
