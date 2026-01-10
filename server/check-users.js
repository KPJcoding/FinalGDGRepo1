import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open database
const dbPath = path.join(__dirname, '..', 'database_v2.sqlite');
const db = new Database(dbPath);

console.log('=== USERS TABLE ===');
const users = db.prepare('SELECT id, email, name, batch, branch, credits FROM users ORDER BY id').all();
console.table(users);

console.log('\n=== RECENT ANSWERS ===');
const answers = db.prepare(`
  SELECT a.id, a.content, a.author_id, u.name as author_name, a.created_at
  FROM answers a
  LEFT JOIN users u ON a.author_id = u.id
  ORDER BY a.created_at DESC
  LIMIT 10
`).all();
console.table(answers);

db.close();
console.log('\nDatabase query complete!');
