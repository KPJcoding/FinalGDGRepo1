import { getDb } from './db.js';

async function checkAndCreateAdmin() {
    const db = await getDb();

    console.log('\n=== ADMIN ACCOUNT STATUS ===\n');

    // Check if admin exists
    const adminUser = await db.get("SELECT * FROM users WHERE email = 'bt25csh068@iiitn.ac.in'");

    if (!adminUser) {
        console.log('❌ Admin account does not exist!');
        console.log('\n📝 TO CREATE ADMIN ACCOUNT:');
        console.log('1. Go to the website');
        console.log('2. Sign up with email: bt25csh068@iiitn.ac.in');
        console.log('3. Complete OTP verification');
        console.log('4. Then run this script again to set admin role\n');
    } else {
        console.log('✅ Admin account exists:');
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role || 'USER'}`);

        if (adminUser.role !== 'ADMIN') {
            console.log('\n⚙️  Setting role to ADMIN...');
            await db.run("UPDATE users SET role = 'ADMIN' WHERE email = 'bt25csh068@iiitn.ac.in'");
            console.log('   ✅ Role updated to ADMIN');
        }

        console.log('\n📋 TO USE ADMIN FEATURES:');
        console.log('1. Log out of current account');
        console.log('2. Log in with: bt25csh068@iiitn.ac.in');
        console.log('3. Refresh page (Ctrl+Shift+R)');
        console.log('4. Delete buttons will appear on all answers\n');
    }

    console.log('===========================\n');
}

checkAndCreateAdmin().then(() => process.exit(0)).catch(console.error);
