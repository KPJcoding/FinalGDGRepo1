import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbInstance = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  // Using a new filename to effectively "purge" and start fresh if the old one is locked
  dbInstance = await open({
    filename: './database_v2.sqlite',
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      batch TEXT,
      branch TEXT,
      isVerified INTEGER DEFAULT 0,
      credits INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otpHash TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      difficulty_tier TEXT NOT NULL DEFAULT 'Bronze',
      author_id INTEGER NOT NULL,
      views INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      question_upvotes INTEGER DEFAULT 0,
      question_downvotes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_accepted INTEGER DEFAULT 0,
      answer_upvotes INTEGER DEFAULT 0,
      answer_downvotes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      target_type TEXT NOT NULL, -- 'question' or 'answer'
      value INTEGER NOT NULL, -- 1 or -1
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, target_id, target_type)
    );

    CREATE TABLE IF NOT EXISTS question_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      tag_name TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_questions_author_id ON questions(author_id);
    CREATE INDEX IF NOT EXISTS idx_question_tags_question ON question_tags(question_id);
    CREATE INDEX IF NOT EXISTS idx_question_tags_tag ON question_tags(tag_name);
    CREATE INDEX IF NOT EXISTS idx_votes_user_target ON votes(user_id, target_id, target_type);
  `);

  // Migration: Check for columns
  try {
    const userColumns = await dbInstance.all("PRAGMA table_info(users)");
    if (!userColumns.some(col => col.name === 'credits')) {
      console.log("[DB] Migrating: Adding 'credits' column to 'users'");
      await dbInstance.exec("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0");
    }
    if (!userColumns.some(col => col.name === 'role')) {
      console.log("[DB] Migrating: Adding 'role' column to 'users'");
      await dbInstance.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
    }

    const answerColumns = await dbInstance.all("PRAGMA table_info(answers)");
    if (!answerColumns.some(col => col.name === 'is_maintainer_verified')) {
      console.log("[DB] Migrating: Adding 'is_maintainer_verified' column to 'answers'");
      await dbInstance.exec("ALTER TABLE answers ADD COLUMN is_maintainer_verified INTEGER DEFAULT 0");
    }
    if (!answerColumns.some(col => col.name === 'answer_upvotes')) {
      console.log("[DB] Migrating: Adding 'answer_upvotes' column to 'answers'");
      await dbInstance.exec("ALTER TABLE answers ADD COLUMN answer_upvotes INTEGER DEFAULT 0");
    }
    if (!answerColumns.some(col => col.name === 'answer_downvotes')) {
      console.log("[DB] Migrating: Adding 'answer_downvotes' column to 'answers'");
      await dbInstance.exec("ALTER TABLE answers ADD COLUMN answer_downvotes INTEGER DEFAULT 0");
    }

    const questionColumns = await dbInstance.all("PRAGMA table_info(questions)");
    if (!questionColumns.some(col => col.name === 'difficulty_tier')) {
      console.log("[DB] Migrating: Adding 'difficulty_tier' column to 'questions'");
      await dbInstance.exec("ALTER TABLE questions ADD COLUMN difficulty_tier TEXT NOT NULL DEFAULT 'Bronze'");
    }
    if (!questionColumns.some(col => col.name === 'views')) {
      console.log("[DB] Migrating: Adding 'views' column to 'questions'");
      await dbInstance.exec("ALTER TABLE questions ADD COLUMN views INTEGER DEFAULT 0");
    }
    if (!questionColumns.some(col => col.name === 'is_verified')) {
      console.log("[DB] Migrating: Adding 'is_verified' column to 'questions'");
      await dbInstance.exec("ALTER TABLE questions ADD COLUMN is_verified INTEGER DEFAULT 0");
    }
    if (!questionColumns.some(col => col.name === 'question_upvotes')) {
      console.log("[DB] Migrating: Adding 'question_upvotes' column to 'questions'");
      await dbInstance.exec("ALTER TABLE questions ADD COLUMN question_upvotes INTEGER DEFAULT 0");
    }
    if (!questionColumns.some(col => col.name === 'question_downvotes')) {
      console.log("[DB] Migrating: Adding 'question_downvotes' column to 'questions'");
      await dbInstance.exec("ALTER TABLE questions ADD COLUMN question_downvotes INTEGER DEFAULT 0");
    }

    const voteColumns = await dbInstance.all("PRAGMA table_info(votes)");
    if (!voteColumns.some(col => col.name === 'last_voted_at')) {
      console.log("[DB] Migrating: Adding 'last_voted_at' column to 'votes'");
      // SQLite doesn't support CURRENT_TIMESTAMP in ALTER TABLE ADD COLUMN
      await dbInstance.exec("ALTER TABLE votes ADD COLUMN last_voted_at DATETIME");
      // Update existing rows to use created_at value
      await dbInstance.exec("UPDATE votes SET last_voted_at = created_at WHERE last_voted_at IS NULL");
      await dbInstance.exec("UPDATE votes SET last_voted_at = created_at WHERE last_voted_at IS NULL");
    }

    // Reports/Issues Table
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open', -- open, in_review, resolved
        image_path TEXT,
        reporter_id INTEGER,
        reporter_name TEXT,
        reporter_email TEXT,
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      );
    `);
    console.log("[DB] Migrating difficulty values to difficulty_tier");
    await dbInstance.exec(`
      UPDATE questions 
      SET difficulty_tier = CASE 
        WHEN difficulty = 'Easy' THEN 'Bronze'
        WHEN difficulty = 'Medium' THEN 'Silver'
        WHEN difficulty = 'Hard' THEN 'Gold'
        ELSE 'Bronze'
      END
      WHERE difficulty_tier = 'Bronze' AND difficulty IN ('Easy', 'Medium', 'Hard')
    `);

  } catch (err) {
    console.warn("[DB] Migration check failed:", err.message);
  }

  return dbInstance;
}
