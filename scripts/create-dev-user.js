const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDevUser() {
    try {
        const existingUser = await prisma.user.findFirst();
        
        if (existingUser) {
            console.log('✓ User already exists:', existingUser.email);
            console.log('  User ID:', existingUser.id);
            return;
        }

        console.log('No users found. Creating development user...');

        const hashedPassword = await bcrypt.hash('password123', 10);

        const user = await prisma.user.create({
            data: {
                email: 'dev@hospitiumris.com',
                givenName: 'Dev',
                familyName: 'User',
                passwordHash: hashedPassword,
                accountType: 'RESEARCHER',
                status: 'ACTIVE',
                emailVerified: true,
            },
        });

        console.log('✓ Development user created successfully!');
        console.log('  Email:', user.email);
        console.log('  Password: password123');
        console.log('  User ID:', user.id);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createDevUser();
