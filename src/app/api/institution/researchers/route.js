import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess } from '@/lib/institution-scope';
import { computeResearcherOutputs } from '@/lib/researcher-output';

/**
 * GET /api/institution/researchers
 * Researcher directory for the logged-in user's institution: profile summary plus
 * platform research output, counting lead work and collaborative work
 * (co-authorship, manuscript collaboration, proposal co-investigation).
 */
export async function GET() {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution, memberWhere, verifiedDomains } = access;

    const researchers = await prisma.user.findMany({
      where: { AND: [memberWhere, { accountType: 'RESEARCHER' }] },
      select: {
        id: true,
        email: true,
        givenName: true,
        familyName: true,
        orcidId: true,
        avatarUrl: true,
        status: true,
        primaryInstitution: true,
        createdAt: true,
        researchProfile: {
          select: {
            academicTitle: true,
            department: true,
            specialization: true,
            keywords: true,
            researchInterests: true,
            hIndex: true,
            citationCount: true,
          },
        },
      },
      orderBy: [{ familyName: 'asc' }, { givenName: 'asc' }],
    });

    const outputs = await computeResearcherOutputs(researchers);

    const rows = researchers.map((r) => {
      const out = outputs.get(r.id);
      const rp = r.researchProfile || {};
      return {
        id: r.id,
        email: r.email,
        givenName: r.givenName,
        familyName: r.familyName,
        fullName: `${r.givenName || ''} ${r.familyName || ''}`.trim() || r.email,
        displayName: [rp.academicTitle, r.givenName, r.familyName].filter(Boolean).join(' ') || r.email,
        orcidId: r.orcidId,
        avatarUrl: r.avatarUrl || null,
        status: r.status,
        primaryInstitution: r.primaryInstitution || institution.name,
        department: rp.department || null,
        academicTitle: rp.academicTitle || null,
        expertise: [...new Set([...(rp.keywords || []), ...(rp.specialization || [])])].slice(0, 12),
        researchInterests: rp.researchInterests || null,
        hIndex: rp.hIndex || 0,
        citations: rp.citationCount || 0,
        createdAt: r.createdAt,
        output: out,
        // legacy shape used elsewhere
        researchProfile: r.researchProfile ? { ...r.researchProfile } : null,
        stats: {
          totalManuscripts: out.manuscripts.total,
          activeManuscripts: out.manuscripts.total - out.manuscripts.published,
          totalPublications: out.publications.total,
          totalProposals: out.proposals.total,
          totalCitations: rp.citationCount || 0,
          hIndex: rp.hIndex || 0,
        },
      };
    });

    const departments = [...new Set(rows.map((r) => r.department).filter(Boolean))].sort();
    const expertise = Object.entries(rows.flatMap((r) => r.expertise).reduce((acc, k) => {
      const key = k.trim();
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([label, count]) => ({ label, count }));

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name, verifiedDomains },
      count: rows.length,
      departments,
      expertise,
      summary: {
        researchers: rows.length,
        withOrcid: rows.filter((r) => r.orcidId).length,
        publications: rows.reduce((s, r) => s + r.output.publications.total, 0),
        manuscripts: rows.reduce((s, r) => s + r.output.manuscripts.total, 0),
        proposals: rows.reduce((s, r) => s + r.output.proposals.total, 0),
        collaborative: rows.reduce((s, r) => s + r.output.totals.collaborative, 0),
      },
      researchers: rows,
    });
  } catch (error) {
    console.error('Error fetching researchers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
