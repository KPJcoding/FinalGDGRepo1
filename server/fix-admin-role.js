import { getDb } from './db.js';

async function checkAdminUser() {
    const db = await getDb();

    console.log('\n=== CHECKING ADMIN USER ===\n');

    // Find user with admin email
    const adminUser = await db.get("SELECT * FROM users WHERE email = 'bt25csh068@iiitn.ac.in'");

    if (!adminUser) {
        console.log('❌ Admin email not found in database!');
        console.log('   User needs to sign up with bt25csh068@iiitn.ac.in');
    } else {
        console.log('✅ Admin user found:');
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role || 'NOT SET'}`);

        if (adminUser.role !== 'ADMIN') {
            console.log('\n⚠️  WARNING: Role is not ADMIN!');
            console.log('   Updating role to ADMIN...');
            await db.run("UPDATE users SET role = 'ADMIN' WHERE email = 'bt25csh068@iiitn.ac.in'");
            console.log('   ✅ Role updated to ADMIN');
        }
    }

    // Show all users with their roles
    console.log('\n=== ALL USERS ===');
    const users = await db.all('SELECT id, name, email, role FROM users');
    users.forEach(u => {
        console.log(`  [${u.id}] ${u.name} (${u.email}) - ${u.role || 'USER'}`);
    });

    console.log('\n=========================\n');
}

checkAdminUser()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
