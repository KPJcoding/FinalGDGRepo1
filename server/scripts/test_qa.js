
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';
const DB_PATH = './database_v2.sqlite';

// Helpers for API calls using built-in fetch
async function post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`POST ${url} failed (${res.status}): ${txt}`);
    }
    return res.json();
}

async function get(url, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${url}`, { headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`GET ${url} failed (${res.status}): ${txt}`);
    }
    return res.json();
}

async function getOtpFromDb(email) {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });
    // The OTP is hashed in the DB, but we need the plaintext OTP to verify.
    // Wait, the system hashes the OTP before storing?
    // Let's check index.js: 
    // const otp = Math.floor(100000 + ...);
    // const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    // await db.run(..., otpHash, ...);
    // await sendOtpEmail(email, otp);

    // PROBLEM: We cannot retrieve the plaintext OTP from the DB because it is hashed.
    // We must intercept the email or modify the code to output the OTP, OR...
    // Since we are adding this script for verification, we can just "simulate" a verified user 
    // by manually inserting a user into the DB with known credentials, bypassing the OTP flow.

    await db.close();
    return null;
}

async function createVerifiedUser(email, name, password) {
    // Direct DB insertion to bypass OTP complexity for testing
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    // We need bcrypt to hash password, but we might not have it in this script context easily if not installed globally or in node_modules?
    // Actually, node_modules is there.

    // Simplified: Just use the API but we need the OTP. 
    // Hack: The server logs the OTP? No, it doesn't.
    // Hack 2: We can just use the existing "create account" API and then manually set `isVerified=1` in DB?
    // No, create account requires verifying OTP first.

    // Hack 3: Insert user directly using SQL.
    // We need to import bcrypt from node_modules.
    // Since we are running with `node`, and `node_modules` exists in `server/`, we can import it.

    // Assume bcrypt is available since it's in the project.
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(password, 10);

    try {
        await db.run(
            'INSERT INTO users (email, password_hash, name, isVerified, credits) VALUES (?, ?, ?, 1, 0)',
            email, hash, name
        );
    } catch (e) {
        // Ignore if exists, maybe update
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    await db.close();

    // Now login to get token
    const loginRes = await post('/auth/login', { email, password });
    return { token: loginRes.token, user: loginRes.user, id: user.id };
}

async function verifyQAFlow() {
    console.log('--- Starting QA Flow Verification ---');
    const timestamp = Date.now();
    const emailA = `userA_${timestamp}@iiitn.ac.in`;
    const emailB = `userB_${timestamp}@iiitn.ac.in`;
    const password = 'password123';

    try {
        console.log('[1] Creating User A (manually verified)...');
        const userA = await createVerifiedUser(emailA, 'User A', password);
        console.log(`User A created. ID: ${userA.id}, Credits: ${userA.user.credits || 0}`);

        console.log('[2] Creating User B (manually verified)...');
        const userB = await createVerifiedUser(emailB, 'User B', password);
        console.log(`User B created. ID: ${userB.id}`);

        // 3. User A asks a question
        console.log('[3] User A posting a question...');
        const qRes = await post('/questions', {
            title: 'Test Question',
            content: 'Testing content',
            difficulty: 'Medium'
        }, userA.token);
        console.log(`Question Created: ${qRes.id}`);

        // 4. User B answers
        console.log('[4] User B posting an answer...');
        await post(`/questions/${qRes.id}/answers`, {
            content: 'Test Answer'
        }, userB.token);
        console.log('Answer posted.');

        // 5. Get Answer ID
        const qDetails = await get(`/questions/${qRes.id}`, userA.token);
        const answerId = qDetails.answers[0].id;
        console.log(`Answer ID: ${answerId}`);

        // 6. User A accepts answer
        console.log('[6] User A accepting the answer...');
        await post(`/answers/${answerId}/accept`, {}, userA.token);
        console.log('Answer accepted.');

        // 7. Verify Credits
        const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
        const userB_Fresh = await db.get('SELECT credits FROM users WHERE id = ?', userB.id);
        console.log(`User B Credits: ${userB_Fresh.credits}`);

        assert.strictEqual(userB_Fresh.credits, 10, 'User B should have 10 credits');

        const tx = await db.get('SELECT * FROM credit_transactions WHERE user_id = ? AND type = ?', userB.id, 'EARN');
        assert(tx, 'Transaction record should exist');
        console.log('Transaction verified:', tx);

        await db.close();
        console.log('--- SUCCESS ---');

    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    }
}

verifyQAFlow();
