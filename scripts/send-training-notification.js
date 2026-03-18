const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendNotification() {
  try {
    console.log('\n=== SENDING TRAINING NOTIFICATION ===\n');
    
    // Get the training
    const training = await prisma.training.findFirst({
      where: {
        status: 'PUBLISHED'
      }
    });
    
    if (!training) {
      console.log('No published trainings found');
      return;
    }
    
    // Get the researcher
    const researcher = await prisma.user.findUnique({
      where: {
        email: 'steveggaita@gmail.com'
      }
    });
    
    if (!researcher) {
      console.log('Researcher not found');
      return;
    }
    
    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: researcher.id,
        type: 'COLLABORATION_INVITATION',
        title: 'New Training Available',
        message: `A new training "${training.title}" has been published. Register now!`,
        data: {
          trainingId: training.id,
          trainingTitle: training.title,
          startDate: training.startDate,
          endDate: training.endDate,
        },
      },
    });
    
    console.log('✅ Notification sent successfully!');
    console.log(`  To: ${researcher.email}`);
    console.log(`  Training: ${training.title}`);
    console.log(`  Notification ID: ${notification.id}\n`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendNotification();
