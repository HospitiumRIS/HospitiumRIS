// Seed script to create a test manuscript for development
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestManuscript() {
  try {
    const manuscriptId = 'cmg859f11000cvl64qzya9yuw';
    
    // First, create a test user if it doesn't exist
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@hospitium.org' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          accountType: 'RESEARCHER',
          status: 'ACTIVE',
          givenName: 'Test',
          familyName: 'User',
          email: 'test@hospitium.org',
          passwordHash: 'test-hash', // In real app, this would be properly hashed
          emailVerified: true
        }
      });
      console.log('Created test user:', testUser.email);
    }
    
    // Check if manuscript already exists
    const existingManuscript = await prisma.manuscript.findUnique({
      where: { id: manuscriptId }
    });
    
    if (existingManuscript) {
      console.log('Manuscript already exists with ID:', manuscriptId);
      return;
    }
    
    // Create the test manuscript
    const manuscript = await prisma.manuscript.create({
      data: {
        id: manuscriptId,
        title: 'Research Collaboration in Digital Health Technologies',
        type: 'Research Article',
        field: 'Digital Health',
        description: 'A comprehensive study on digital health collaboration',
        status: 'DRAFT',
        content: `
          <h1>Research Collaboration in Digital Health Technologies</h1>
          
          <h2>Abstract</h2>
          <p>This study examines the current state of research collaboration in digital health technologies, focusing on the challenges and opportunities for interdisciplinary cooperation.</p>
          
          <h2>Introduction</h2>
          <p>Digital health technologies are rapidly evolving, requiring unprecedented levels of collaboration between researchers, clinicians, and technologists. This manuscript explores the mechanisms that facilitate effective collaboration in this domain.</p>
          
          <h2>Methods</h2>
          <p>We conducted a comprehensive review of collaboration patterns in digital health research over the past five years.</p>
          
          <h2>Results</h2>
          <p>Our analysis reveals several key factors that contribute to successful research collaboration in digital health.</p>
          
          <h2>Discussion</h2>
          <p>The findings suggest that structured collaboration frameworks significantly improve research outcomes in digital health projects.</p>
          
          <h2>Conclusion</h2>
          <p>Enhanced collaboration mechanisms are essential for advancing digital health research and improving patient outcomes.</p>
          
          <h2>References</h2>
          <p>References will be generated using the bibliography tool.</p>
        `,
        wordCount: 145,
        createdBy: testUser.id,
        lastSaved: new Date()
      }
    });
    
    // Add the creator as an owner collaborator
    await prisma.manuscriptCollaborator.create({
      data: {
        manuscriptId: manuscript.id,
        userId: testUser.id,
        role: 'OWNER',
        invitedBy: testUser.id,
        canEdit: true,
        canInvite: true,
        canDelete: true
      }
    });
    
    console.log('Created test manuscript with ID:', manuscript.id);
    console.log('Title:', manuscript.title);
    console.log('Word count:', manuscript.wordCount);
    console.log('You can now access it at: http://localhost:3002/researcher/publications/collaborate/edit/' + manuscript.id);
    
  } catch (error) {
    console.error('Error seeding test manuscript:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestManuscript();
