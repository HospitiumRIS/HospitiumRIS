const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orcidId = '0009-0009-4810-6393';
  
  const user = await prisma.user.findFirst({
    where: { orcidId: orcidId },
    select: { 
      id: true, 
      email: true, 
      orcidId: true, 
      givenName: true, 
      familyName: true,
      status: true,
      emailVerified: true
    }
  });
  
  console.log('User details:');
  console.log(JSON.stringify(user, null, 2));
  
  let needsUpdate = false;
  const updateData = {};
  
  if (user.status !== 'ACTIVE') {
    console.log('\n⚠️  User status is:', user.status);
    updateData.status = 'ACTIVE';
    needsUpdate = true;
  }
  
  if (!user.emailVerified) {
    console.log('\n⚠️  Email not verified');
    updateData.emailVerified = true;
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    console.log('\nUpdating user...');
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
    console.log('✅ User updated successfully');
  } else {
    console.log('\n✅ User is properly configured');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
