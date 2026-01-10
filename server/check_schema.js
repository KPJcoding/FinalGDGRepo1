import { getDb } from './db.js';

(async () => {
    const db = await getDb();
    const question = await db.get('SELECT * FROM questions LIMIT 1');
    console.log('QUESTION_DATA:', JSON.stringify(question));
})();
