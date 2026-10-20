import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { readResearcherIds } from '@/lib/researcher-ids';
import {
  activeMemberWhere,
  resolveDirectoryInstitution,
  toDirectoryResearcher,
} from '@/lib/institution-directory';

const RECENT_PUBLICATIONS = 5;

/**
 * GET /api/researcher/institution-directory/[userId]
 * Research-profile summary for one researcher at the caller's own institution.
 * Researchers at other institutions are not exposed (404).
 */
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { userId } = await params;
    const institution = resolveDirectoryInstitution(user);
    if (!institution || !userId) {
      return NextResponse.json({ success: false, error: 'Researcher not found' }, { status: 404 });
    }

    const member = await prisma.user.findFirst({
      where: { id: userId, ...activeMemberWhere(institution.id) },
      select: {
        id: true,
        givenName: true,
        familyName: true,
        email: true,
        orcidId: true,
        avatarUrl: true,
        createdAt: true,
        researchProfile: {
          select: {
            academicTitle: true,
            department: true,
            specialization: true,
            keywords: true,
            researchInterests: true,
            biography: true,
            hIndex: true,
            citationCount: true,
            website: true,
            linkedin: true,
            googleScholar: true,
            researcherIds: true,
          },
        },
        _count: { select: { publications: true } },
      },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: 'Researcher not found' }, { status: 404 });
    }

    const authored = await prisma.publicationAuthor.findMany({
      where: { userId: member.id },
      select: {
        isCorresponding: true,
        publication: {
          select: { id: true, title: true, journal: true, year: true, doi: true, type: true },
        },
      },
      orderBy: [{ publication: { year: { sort: 'desc', nulls: 'last' } } }, { createdAt: 'desc' }],
      take: RECENT_PUBLICATIONS,
    });

    const profile = member.researchProfile || {};
    return NextResponse.json({
      success: true,
      researcher: toDirectoryResearcher(member, institution.name),
      profile: {
        memberSince: member.createdAt,
        academicTitle: profile.academicTitle || '',
        department: profile.department?.trim() || '',
        specialization: profile.specialization || [],
        keywords: profile.keywords || [],
        researchInterests: profile.researchInterests || '',
        biography: profile.biography || '',
        hIndex: profile.hIndex ?? null,
        citationCount: profile.citationCount ?? null,
        publicationCount: member._count.publications,
        website: profile.website || '',
        linkedin: profile.linkedin || '',
        researcherIds: readResearcherIds(profile),
        recentPublications: authored.map(({ publication, isCorresponding }) => ({
          ...publication,
          isCorresponding,
        })),
      },
    });
  } catch (error) {
    console.error('Institution directory profile error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load researcher profile' }, { status: 500 });
  }
}
