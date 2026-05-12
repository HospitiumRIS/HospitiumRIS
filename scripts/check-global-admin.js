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

// Function to seed account types if they don't exist
async function ensureAccountTypesExist() {
  try {
    const accountTypeCount = await prisma.accountType.count();
    
    if (accountTypeCount === 0) {
      console.log('📦 Account types not found. Seeding account types...');
      
      const accountTypes = [
        {
          name: 'RESEARCHER',
          displayName: 'Researcher',
          description: 'Individual researchers conducting studies and managing publications',
          permissions: JSON.stringify(['view_own_profile', 'edit_own_profile', 'create_manuscripts', 'manage_own_manuscripts', 'create_proposals', 'manage_own_proposals', 'view_publications', 'collaborate_on_manuscripts']),
          isSystem: true,
          isActive: true
        },
        {
          name: 'RESEARCH_ADMIN',
          displayName: 'Research Admin',
          description: 'Administrators managing research activities within an institution',
          permissions: JSON.stringify(['view_own_profile', 'edit_own_profile', 'view_institution_data', 'manage_institution_researchers', 'review_proposals', 'approve_proposals', 'view_all_manuscripts', 'generate_reports']),
          isSystem: true,
          isActive: true
        },
        {
          name: 'FOUNDATION_ADMIN',
          displayName: 'Foundation Admin',
          description: 'Foundation administrators managing grants and funding',
          permissions: JSON.stringify(['view_own_profile', 'edit_own_profile', 'manage_grants', 'review_proposals', 'approve_funding', 'view_all_proposals', 'generate_financial_reports']),
          isSystem: true,
          isActive: true
        },
        {
          name: 'OPERATIONS',
          displayName: 'Operations',
          description: 'Operations staff managing operational and administrative tasks',
          permissions: JSON.stringify(['view_own_profile', 'edit_own_profile', 'manage_operations', 'view_system_data', 'generate_operational_reports']),
          isSystem: true,
          isActive: true
        },
        {
          name: 'INSTITUTION_ADMIN',
          displayName: 'Institution Admin',
          description: 'Institution administrators managing users and operations within their institution',
          permissions: JSON.stringify(['manage_institution_users', 'manage_institution_account_types', 'view_institution_data', 'manage_institution_settings', 'view_institution_analytics', 'manage_institution_proposals', 'manage_institution_ethics', 'view_institution_logs']),
          isSystem: true,
          isActive: true
        },
        {
          name: 'GLOBAL_ADMIN',
          displayName: 'Global Admin',
          description: 'System-wide administrators with full access to manage system health and create institution admins',
          permissions: JSON.stringify(['full_system_access', 'manage_all_users', 'create_institution_admins', 'manage_account_types', 'manage_all_institutions', 'manage_all_foundations', 'view_all_data', 'system_configuration', 'database_management', 'system_health_monitoring']),
          isSystem: true,
          isActive: true
        }
      ];

      for (const accountType of accountTypes) {
        await prisma.accountType.upsert({
          where: { name: accountType.name },
          update: accountType,
          create: accountType
        });
      }
      
      console.log('✅ Account types seeded successfully!\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error seeding account types:', error.message);
    return false;
  }
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
    // First, ensure account types exist
    const accountTypesReady = await ensureAccountTypesExist();
    if (!accountTypesReady) {
      console.log('\n❌ Failed to seed account types.');
      console.log('   Application startup aborted.\n');
      process.exit(1);
    }
    
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
