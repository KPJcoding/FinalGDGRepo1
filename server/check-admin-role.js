import { getDb } from './db.js';

(async () => {
    try {
        const db = await getDb();

        console.log('\n=== CHECKING ADMIN ROLE ===');
        const admin = await db.get('SELECT id, email, name, role FROM users WHERE email = ?', 'bt25csh068@iiitn.ac.in');

        if (!admin) {
            console.log('❌ User not found!');
        } else {
            console.log('✅ User found:');
            console.log(`   Email: ${admin.email}`);
            console.log(`   Name: ${admin.name}`);
            console.log(`   Role: ${admin.role || '(NOT SET)'}`);

            if (admin.role === 'ADMIN') {
                console.log('\n✅ Admin role is correctly set!');
            } else {
                console.log('\n❌ Admin role is NOT set. Setting it now...');
                await db.run('UPDATE users SET role = ? WHERE email = ?', 'ADMIN', 'bt25csh068@iiitn.ac.in');
                console.log('✅ Admin role has been set!');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }

    process.exit(0);
})();
