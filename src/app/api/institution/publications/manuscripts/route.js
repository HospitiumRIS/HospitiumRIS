import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess, emptyScopeWhere } from '@/lib/institution-scope';

export async function GET() {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;

    const { institution, memberIds } = access;

    const manuscripts = await prisma.manuscript.findMany({
      where: memberIds.length ? { createdBy: { in: memberIds } } : emptyScopeWhere(),
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: { id: true, givenName: true, familyName: true, email: true },
        },
        collaborators: {
          include: {
            user: { select: { id: true, givenName: true, familyName: true, email: true } },
          },
        },
      },
    });

    const result = manuscripts.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      field: m.field,
      status: m.status,
      wordCount: m.wordCount || 0,
      createdBy: m.creator
        ? `${m.creator.givenName} ${m.creator.familyName}`.trim() || m.creator.email
        : 'Unknown',
      collaboratorCount: m.collaborators?.length || 0,
      collaborators: (m.collaborators || []).map((c) => ({
        name: c.user ? `${c.user.givenName} ${c.user.familyName}`.trim() || c.user.email : 'Unknown',
        role: c.role,
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      lastSaved: m.lastSaved,
    }));

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      manuscripts: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching institution manuscripts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manuscripts', message: error.message },
      { status: 500 }
    );
  }
}
