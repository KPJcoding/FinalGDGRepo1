import { getDb } from './db.js';

async function setAdminRole() {
    const db = await getDb();

    // Set Ashish as admin
    await db.run("UPDATE users SET role = 'ADMIN' WHERE email = 'bt25ece125@iiitn.ac.in'");

    const user = await db.get("SELECT * FROM users WHERE email = 'bt25ece125@iiitn.ac.in'");
    console.log('\n✅ Admin role set for:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('\nNow log out and log back in to refresh the session.\n');
}

setAdminRole().then(() => process.exit(0)).catch(console.error);
