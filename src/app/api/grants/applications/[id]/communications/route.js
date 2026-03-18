import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get communications for a grant application
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where = { grantApplicationId: id };
    
    if (type) {
      where.type = type;
    }

    const communications = await prisma.grantCommunication.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      communications
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

// POST - Log new communication
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const communication = await prisma.grantCommunication.create({
      data: {
        grantApplicationId: id,
        type: data.type,
        direction: data.direction,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        toEmail: data.toEmail,
        toName: data.toName,
        ccEmails: data.ccEmails || [],
        subject: data.subject,
        body: data.body,
        htmlBody: data.htmlBody,
        participantName: data.participantName,
        participantEmail: data.participantEmail,
        duration: data.duration,
        location: data.location,
        summary: data.summary,
        date: data.date || new Date(),
        attachments: data.attachments || [],
        followUpRequired: data.followUpRequired || false,
        followUpDate: data.followUpDate,
        followUpNotes: data.followUpNotes,
        emailMessageId: data.emailMessageId,
        emailInReplyTo: data.emailInReplyTo,
        emailReferences: data.emailReferences || []
      }
    });

    return NextResponse.json({
      success: true,
      communication
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create communication' },
      { status: 500 }
    );
  }
}
