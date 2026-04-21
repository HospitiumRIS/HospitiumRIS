import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const manuscripts = await prisma.manuscript.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true }
        },
        collaborators: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        }
      }
    });

    const result = manuscripts.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      field: m.field,
      status: m.status,
      wordCount: m.wordCount || 0,
      createdBy: m.creator?.fullName || m.creator?.email || 'Unknown',
      collaboratorCount: m.collaborators?.length || 0,
      collaborators: (m.collaborators || []).map(c => ({
        name: c.user?.fullName || c.user?.email || 'Unknown',
        role: c.role
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      lastSaved: m.lastSaved
    }));

    return NextResponse.json({ success: true, manuscripts: result, count: result.length });
  } catch (error) {
    console.error('Error fetching institution manuscripts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manuscripts', message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
