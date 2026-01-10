import { getDb } from './db.js';

async function removeAdminRole() {
    const db = await getDb();

    // Remove admin role from bt25ece125@iiitn.ac.in
    await db.run("UPDATE users SET role = 'USER' WHERE email = 'bt25ece125@iiitn.ac.in'");

    const user = await db.get("SELECT * FROM users WHERE email = 'bt25ece125@iiitn.ac.in'");
    console.log('\n✅ Admin role removed from:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'USER'}`);
    console.log('\nThis account is now a regular user.\n');
}

removeAdminRole().then(() => process.exit(0)).catch(console.error);
