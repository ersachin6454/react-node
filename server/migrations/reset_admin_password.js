const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function resetAdminPassword() {
    try {
        console.log('🔐 Admin Password Reset');
        console.log('=====================================\n');

        // List all admin users
        const [admins] = await pool.execute(
            'SELECT id, name, email FROM users WHERE role = "admin"'
        );

        if (admins.length === 0) {
            console.log('❌ No admin users found!');
            console.log('💡 Run setup_admin.js first to create an admin user.');
            process.exit(1);
        }

        console.log('📋 Existing admin users:');
        admins.forEach((admin, index) => {
            console.log(`   ${index + 1}. ${admin.email} (${admin.name})`);
        });
        console.log('');

        // Get admin email to reset
        const email = await askQuestion('Enter admin email to reset password: ');

        if (!email) {
            console.log('❌ Email is required!');
            process.exit(1);
        }

        // Check if admin exists
        const [existingAdmin] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND role = "admin"',
            [email]
        );

        if (existingAdmin.length === 0) {
            console.log('❌ Admin with this email does not exist!');
            process.exit(1);
        }

        const admin = existingAdmin[0];
        console.log(`\n👤 Found admin: ${admin.name} (${admin.email})\n`);

        // Get new password
        const password = await askQuestion('Enter new password (min 6 characters): ');

        if (!password) {
            console.log('❌ Password is required!');
            process.exit(1);
        }

        if (password.length < 6) {
            console.log('❌ Password must be at least 6 characters long!');
            process.exit(1);
        }

        // Confirm password
        const confirmPassword = await askQuestion('Confirm new password: ');

        if (password !== confirmPassword) {
            console.log('❌ Passwords do not match!');
            process.exit(1);
        }

        // Hash password
        console.log('\n🔒 Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update admin password
        console.log('🔄 Updating admin password...');
        await pool.execute(
            'UPDATE users SET password = ?, confirm_password = ? WHERE id = ?',
            [hashedPassword, hashedPassword, admin.id]
        );

        console.log('\n✅ Admin password reset successfully!');
        console.log('=====================================');
        console.log(`Admin ID: ${admin.id}`);
        console.log(`Name: ${admin.name}`);
        console.log(`Email: ${admin.email}`);
        console.log('\n🔐 You can now login with the new password!');

    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    } finally {
        rl.close();
        process.exit();
    }
}

resetAdminPassword();

