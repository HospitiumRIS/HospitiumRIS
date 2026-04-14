/**
 * Create Global Admin Script
 * 
 * This script creates a global administrator account with system-wide access.
 * Global admins can manage system health, create institution admins, and configure the entire system.
 * 
 * Usage:
 * node scripts/create-global-admin.js --email admin@example.com --name "John Doe" --password securepass123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      params[key] = value;
      i++;
    }
  }
  
  return params;
}

async function createGlobalAdmin() {
  try {
    const args = parseArgs();
    
    // Validate required arguments
    if (!args.email || !args.name || !args.password) {
      console.error('❌ Missing required arguments!');
      console.log('\nUsage:');
      console.log('  node scripts/create-global-admin.js --email <email> --name <full-name> --password <password>');
      console.log('\nExample:');
      console.log('  node scripts/create-global-admin.js --email admin@example.com --name "John Doe" --password securepass123');
      process.exit(1);
    }
    
    const { email, name, password } = args;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format!');
      process.exit(1);
    }
    
    // Validate password length
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long!');
      process.exit(1);
    }
    
    // Parse name into given and family names
    const nameParts = name.trim().split(' ');
    const givenName = nameParts[0];
    const familyName = nameParts.slice(1).join(' ') || nameParts[0];
    
    console.log('🔧 Creating Global Admin account...\n');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists!`);
      console.log('User ID:', existingUser.id);
      console.log('Account Type:', existingUser.accountType);
      console.log('\nIf you want to update this user to GLOBAL_ADMIN, please do so manually in the database.');
      process.exit(1);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create global admin user
    const user = await prisma.user.create({
      data: {
        email,
        givenName,
        familyName,
        passwordHash,
        accountType: 'GLOBAL_ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });
    
    console.log('✅ Global Admin account created successfully!\n');
    console.log('📋 Global Admin Login Credentials:');
    console.log('==========================================');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${givenName} ${familyName}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`📊 Account Type: ${user.accountType}`);
    console.log('\n🔗 Access Points:');
    console.log('- Login: http://localhost:3000/login');
    console.log('- Global Admin Dashboard: http://localhost:3000/global-admin');
    console.log('\n📝 Global Admin Capabilities:');
    console.log('✓ Full system administration access');
    console.log('✓ Create and manage institution admin accounts');
    console.log('✓ System health monitoring and diagnostics');
    console.log('✓ Database management and backups');
    console.log('✓ Manage all account types');
    console.log('✓ View all system data and analytics');
    console.log('✓ System configuration and settings');
    console.log('\n⚠️  IMPORTANT: Store these credentials securely!');
    
  } catch (error) {
    console.error('❌ Error creating global admin:', error);
    
    if (error.code === 'P2002') {
      console.log('\n⚠️  A user with this email already exists in the database.');
    } else {
      console.log('\n🔧 Make sure your database is running and accessible.');
      console.log('Error details:', error.message);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createGlobalAdmin();
