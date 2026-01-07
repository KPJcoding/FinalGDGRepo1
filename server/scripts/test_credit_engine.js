
import assert from 'assert';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const BASE_URL = 'http://localhost:3000';
const DB_PATH = './database_v2.sqlite';

// --- Helpers ---
async function request(method, url, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || res.statusText);
    }
    return { data, status: res.status };
}

async function createUser(role = 'student') {
    const timestamp = Date.now() + Math.random();
    const email = `user_${timestamp}@iiitn.ac.in`;
    const password = 'password123';

    // Direct DB Insert for speed/bypass OTP
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(password, 10);

    await db.run(
        'INSERT INTO users (email, password_hash, name, role, isVerified, credits) VALUES (?, ?, ?, ?, 1, 0)',
        email, hash, role, role
    );
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    await db.close();

    // Login
    const res = await request('POST', '/auth/login', { email, password });
    return { ...res.data, id: user.id };
}

async function verifyCreditEngine() {
    console.log('--- STARTING CREDIT ENGINE VERIFICATION ---');

    try {
        const student = await createUser('student');
        const maintainer = await createUser('maintainer');
        console.log(`Created Student (ID: ${student.id}) & Maintainer (ID: ${maintainer.id})`);

        // 1. Difficulty Rewards Check
        console.log('\n[1] Testing Difficulty Rewards...');
        // Student asks Hard question
        const qRes = await request('POST', '/questions', {
            title: 'Hard Q', content: '...', difficulty: 'Hard'
        }, student.token);

        // Maintainer answers
        const aRes = await request('POST', `/questions/${qRes.data.id}/answers`, {
            content: 'Good answer'
        }, maintainer.token);

        // Student accepts (Should give +35 to Maintainer)
        await request('POST', `/answers/${qRes.data.id}/accept`, {}, student.token);

        // Verify Credits
        let mProfile = await request('GET', '/users/me', null, maintainer.token);
        console.log(`Maintainer Credits after Hard Accept: ${mProfile.data.credits}`);
        assert.strictEqual(mProfile.data.credits, 35, 'Hard answer should give 35 credits');

        // 2. Maintainer Verification Bonus
        console.log('\n[2] Testing Maintainer Verification...');
        await request('POST', `/answers/${qRes.data.id}/verify`, {}, maintainer.token);

        // Should give +20 to Author (Maintainer)
        mProfile = await request('GET', '/users/me', null, maintainer.token);
        console.log(`Maintainer Credits after Verify: ${mProfile.data.credits}`);
        // Cap is 50. Previous was 35. Adding 20 hits the cap. So should be 50.
        assert.strictEqual(mProfile.data.credits, 50, 'Should be capped at 50 credits');


        // 3. Daily Cap (50 Max)
        console.log('\n[3] Testing Daily Cap...');
        const cappedCredits = mProfile.data.credits;
        assert.strictEqual(cappedCredits, 50, 'Credits should be capped at 50');
        console.log('Daily Cap enforced successfully! (Credits capped at 50)');

        // 4. Voting (No Credits)
        console.log('\n[4] Testing Voting (No Credits)...');
        await request('POST', '/votes', {
            target_id: 1, target_type: 'question', value: 1
        }, maintainer.token);

        mProfile = await request('GET', '/users/me', null, maintainer.token);
        assert.strictEqual(mProfile.data.credits, 50, 'Voting should not change credits'); // Stays at capped value
        console.log('Voting verified (No credit change).');

        // 5. Tier Check
        console.log('\n[5] Testing Tier...');
        // Credits are 50. Tier should be Bronze (0-99).
        console.log(`Current Tier: ${mProfile.data.tier}`);
        assert.strictEqual(mProfile.data.tier, 'Bronze');

        // Force update credits to test Platinum
        const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
        await db.run('UPDATE users SET credits = 800 WHERE id = ?', maintainer.id);
        await db.close();

        mProfile = await request('GET', '/users/me', null, maintainer.token);
        console.log(`Credits forced to 800. New Tier: ${mProfile.data.tier}`);
        assert.strictEqual(mProfile.data.tier, 'Platinum');

        console.log('\n--- VERIFICATION SUCCESS ---');

    } catch (error) {
        console.error('\n--- VERIFICATION FAILED ---');
        console.error(error.message);
        process.exit(1);
    }
}

verifyCreditEngine();
