const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createInstitutionAdmin() {
  try {
    console.log('Creating Institution Admin account...');

    const email = 'admin@hospitiumris.org';
    const password = 'admin123';
    const givenName = 'Admin';
    const familyName = 'User';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User with this email already exists!');
      console.log('User ID:', existingUser.id);
      console.log('Account Type:', existingUser.accountType);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create institution admin user
    const user = await prisma.user.create({
      data: {
        email,
        givenName,
        familyName,
        passwordHash,
        accountType: 'INSTITUTION_ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log('✅ Institution Admin account created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', user.id);
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error creating institution admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createInstitutionAdmin();
