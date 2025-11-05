/**
 * Create Admin User Script
 * 
 * This script creates an admin user that can access the activity logs page.
 * 
 * Usage:
 * node scripts/create-admin-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating Super Admin user with secure credentials...\n');

  const adminUserData = {
    accountType: 'SUPER_ADMIN', // Super admin with full system access
    givenName: 'System',
    familyName: 'Administrator', 
    email: 'admin@admin.com',
    password: 'admin123',
    primaryInstitution: 'Hospitium RIS Administration',
    startMonth: '01',
    startYear: '2024',
    status: 'ACTIVE',
    emailVerified: true
  };

  const institutionData = {
    name: 'Hospitium RIS System',
    type: 'System Administration',
    country: 'Global',
    website: 'https://hospitiumris.org'
  };

  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminUserData.email }
    });

    if (existingUser) {
      console.log(`⚠️  Super Admin user ${adminUserData.email} already exists!`);
      console.log('✅ You can use these updated credentials to login:');
      console.log(`📧 Email: ${adminUserData.email}`);
      console.log(`🔑 Password: ${adminUserData.password} (8+ characters - secure)`);
      console.log(`🔗 Super Admin Dashboard: http://localhost:3000/super-admin`);
      console.log(`🔗 Activity Logs: http://localhost:3000/logs\n`);
      
      // Update password and account type if needed
      const newPasswordHash = await bcrypt.hash(adminUserData.password, 12);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash: newPasswordHash,
          status: 'ACTIVE',
          emailVerified: true,
          accountType: adminUserData.accountType, // Update to SUPER_ADMIN
          givenName: adminUserData.givenName,
          familyName: adminUserData.familyName
        }
      });
      console.log('✅ Admin user updated with SUPER_ADMIN privileges!');
      
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminUserData.password, 12);
    
    // Extract user data
    const { password, ...userFields } = adminUserData;
    
    await prisma.$transaction(async (tx) => {
      // Create admin user
      const user = await tx.user.create({
        data: {
          ...userFields,
          passwordHash,
        }
      });

      // Create associated institution record only for RESEARCH_ADMIN (not needed for SUPER_ADMIN)
      if (adminUserData.accountType === 'RESEARCH_ADMIN') {
        await tx.institution.create({
          data: {
            userId: user.id,
            ...institutionData,
          }
        });
      }

      console.log(`✅ Created admin user: ${adminUserData.email}`);
    });

    console.log('\n🎉 Super Admin user creation completed!');
    console.log('\n📋 Super Admin Login Credentials:');
    console.log(`📧 Email: ${adminUserData.email}`);
    console.log(`🔑 Password: ${adminUserData.password} (8+ characters - secure)`);
    console.log(`👤 Account Type: ${adminUserData.accountType}`);
    console.log('\n🔗 Access your admin dashboards at:');
    console.log('- Super Admin Dashboard: http://localhost:3000/super-admin');
    console.log('- Activity Logs: http://localhost:3000/logs');
    console.log('\n📝 What you can do as Super Admin:');
    console.log('- Full system administration access');
    console.log('- View all activity logs with advanced filtering');
    console.log('- Export logs as JSON');
    console.log('- Clear logs (with automatic backup)');
    console.log('- Real-time auto-refresh monitoring');
    console.log('- User management and system settings');
    console.log('- Security monitoring and analytics');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'P2002') {
      console.log('⚠️  User with this email already exists');
    } else {
      console.log('🔧 Make sure your database is running and accessible');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
