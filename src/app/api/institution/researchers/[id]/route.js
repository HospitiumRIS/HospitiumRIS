import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess, assertInstitutionMember } from '@/lib/institution-scope';
import { computeResearcherOutputs } from '@/lib/researcher-output';
import { buildResearcherWorks, fetchOrcidRecord } from '@/lib/researcher-works';
import { readResearcherIds } from '@/lib/researcher-ids';

/**
 * GET /api/institution/researchers/[id]
 * Full researcher profile for the institution portal:
 *  - profile (personal phone number withheld), ORCID biography / employment / education
 *  - works: ORCID + Hospitium-published manuscripts with OpenAlex citation metrics
 *  - platform output: publications (lead/co-author), manuscripts (lead/collaborator),
 *    proposals (PI/co-investigator), with items
 * Only researchers who belong to the caller's institution can be viewed.
 */
export async function GET(request, { params }) {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution } = access;
    const { id } = await params;

    const member = await assertInstitutionMember(id, institution);
    if (!member) {
      return NextResponse.json({ success: false, error: 'Researcher not found in your institution' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { researchProfile: true },
    });
    if (!user) return NextResponse.json({ success: false, error: 'Researcher not found' }, { status: 404 });

    const rp = user.researchProfile;
    const profile = {
      id: user.id,
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      orcidId: user.orcidId,
      avatarUrl: user.avatarUrl || null,
      primaryInstitution: user.primaryInstitution || institution.name,
      accountType: user.accountType,
      status: user.status,
      createdAt: user.createdAt,
      researchProfile: rp ? {
        academicTitle: rp.academicTitle,
        department: rp.department,
        biography: rp.biography,
        researchInterests: rp.researchInterests,
        specialization: rp.specialization || [],
        keywords: rp.keywords || [],
        hIndex: rp.hIndex,
        citationCount: rp.citationCount,
        website: rp.website,
        linkedin: rp.linkedin,
        twitter: rp.twitter,
        googleScholar: rp.googleScholar,
        researcherIds: readResearcherIds(rp),
      } : null,
    };

    const [orcidData, works, outputs] = await Promise.all([
      fetchOrcidRecord(user.orcidId),
      buildResearcherWorks(user).catch((err) => {
        console.error('Error building works for institution profile:', err);
        return { works: [], counts: null, hasOrcid: Boolean(user.orcidId), orcidError: 'Could not load works right now.', metrics: null, metricsError: null, metricsSource: 'OpenAlex' };
      }),
      computeResearcherOutputs([{ id: user.id, orcidId: user.orcidId, email: user.email }], { withItems: true }),
    ]);

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      profile,
      orcidData,
      works,
      output: outputs.get(user.id),
    });
  } catch (error) {
    console.error('Error fetching institution researcher profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to load researcher profile' }, { status: 500 });
  }
}
