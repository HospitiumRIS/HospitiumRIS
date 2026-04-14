/**
 * Startup Check for Global Admin Account
 * 
 * This script runs before the application starts and checks if a GLOBAL_ADMIN
 * account exists. If not, it prompts the user to create one interactively.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to check if global admin exists
async function checkGlobalAdminExists() {
  try {
    const globalAdmin = await prisma.user.findFirst({
      where: { accountType: 'GLOBAL_ADMIN' }
    });
    return globalAdmin !== null;
  } catch (error) {
    console.error('Error checking for global admin:', error);
    return false;
  }
}

// Function to create global admin interactively
async function createGlobalAdminInteractive() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║          🔐 GLOBAL ADMIN ACCOUNT SETUP REQUIRED 🔐            ║');
  console.log('║                                                                ║');
  console.log('║  No Global Admin account found in the database.               ║');
  console.log('║  Please create one to manage the system.                      ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let name, email, password, confirmPassword;

  // Get name
  while (true) {
    name = await question('Enter full name (e.g., John Doe): ');
    if (name.trim().length >= 2) {
      break;
    }
    console.log('❌ Name must be at least 2 characters long.\n');
  }

  // Get email
  while (true) {
    email = await question('Enter email address: ');
    if (isValidEmail(email)) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (existingUser) {
        console.log('❌ This email is already registered. Please use a different email.\n');
        continue;
      }
      break;
    }
    console.log('❌ Invalid email format. Please try again.\n');
  }

  // Get password
  while (true) {
    password = await question('Enter password (min 8 characters): ');
    if (password.length >= 8) {
      break;
    }
    console.log('❌ Password must be at least 8 characters long.\n');
  }

  // Confirm password
  while (true) {
    confirmPassword = await question('Confirm password: ');
    if (password === confirmPassword) {
      break;
    }
    console.log('❌ Passwords do not match. Please try again.\n');
  }

  // Parse name into given and family names
  const nameParts = name.trim().split(' ');
  const givenName = nameParts[0];
  const familyName = nameParts.slice(1).join(' ') || nameParts[0];

  console.log('\n⏳ Creating Global Admin account...\n');

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create global admin user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        givenName,
        familyName,
        passwordHash,
        accountType: 'GLOBAL_ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║          ✅ GLOBAL ADMIN ACCOUNT CREATED SUCCESSFULLY!        ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('📋 Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name:         ${givenName} ${familyName}`);
    console.log(`📧 Email:        ${email}`);
    console.log(`🆔 User ID:      ${user.id}`);
    console.log(`📊 Account Type: ${user.accountType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔗 Access Points:');
    console.log('   • Login:              http://localhost:3000/login');
    console.log('   • Global Admin Panel: http://localhost:3000/global-admin\n');
    console.log('⚠️  IMPORTANT: Store these credentials securely!\n');

    return true;
  } catch (error) {
    console.error('\n❌ Error creating global admin account:', error.message);
    console.error('\n💡 Please ensure:');
    console.error('   • Database is running and accessible');
    console.error('   • DATABASE_URL is correctly configured in .env');
    console.error('   • Prisma migrations have been run\n');
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('🔍 Checking for Global Admin account...');
    
    const exists = await checkGlobalAdminExists();
    
    if (exists) {
      console.log('✅ Global Admin account found. Proceeding with startup...\n');
      return true;
    }
    
    console.log('⚠️  No Global Admin account found.');
    
    const created = await createGlobalAdminInteractive();
    
    if (!created) {
      console.log('\n❌ Failed to create Global Admin account.');
      console.log('   Application startup aborted.\n');
      process.exit(1);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Startup check failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   • Ensure PostgreSQL is running');
    console.error('   • Check DATABASE_URL in .env file');
    console.error('   • Run: npx prisma migrate deploy');
    console.error('   • Run: node prisma/seed-account-types.js\n');
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the check
main();
