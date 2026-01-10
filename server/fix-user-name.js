import { getDb } from './db.js';

// Script to update a user's name in the database
// Usage: Update the USER_EMAIL and NEW_NAME constants below

const USER_EMAIL = 'amogh@iiitn.ac.in'; // Change this to your email
const NEW_NAME = 'Amogh Koushik';

(async () => {
    try {
        const db = await getDb();

        // Find the user
        const user = await db.get('SELECT id, email, name FROM users WHERE email = ?', USER_EMAIL);

        if (!user) {
            console.error(`❌ No user found with email: ${USER_EMAIL}`);
            console.log('\nPlease update the USER_EMAIL constant in this script.');
            return;
        }

        console.log('\n=== CURRENT USER INFO ===');
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Current Name: ${user.name}`);

        if (user.name === NEW_NAME) {
            console.log('\n✓ Name is already correct!');
            return;
        }

        // Update the name
        await db.run('UPDATE users SET name = ? WHERE id = ?', NEW_NAME, user.id);

        console.log(`\n✅ Successfully updated name from "${user.name}" to "${NEW_NAME}"!`);
        console.log('\nNext steps:');
        console.log('1. Clear your browser localStorage (or just log out and log back in)');
        console.log('2. Sign in again');
        console.log('3. Your new answers will now show the correct name!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
