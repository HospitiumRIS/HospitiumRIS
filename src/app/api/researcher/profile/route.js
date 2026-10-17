import { NextResponse } from 'next/server';
import { readResearcherIds } from '@/lib/researcher-ids';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-server';

/**
 * GET /api/researcher/profile
 * Fetch researcher profile data with ORCID information
 */
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user with research profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        researchProfile: true,
        institution: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Prepare profile data
    const profile = {
      id: userProfile.id,
      email: userProfile.email,
      givenName: userProfile.givenName,
      familyName: userProfile.familyName,
      orcidId: userProfile.orcidId,
      orcidGivenNames: userProfile.orcidGivenNames,
      orcidFamilyName: userProfile.orcidFamilyName,
      avatarUrl: userProfile.avatarUrl || null,
      primaryInstitution: userProfile.primaryInstitution,
      researchProfile: userProfile.researchProfile ? {
        id: userProfile.researchProfile.id,
        academicTitle: userProfile.researchProfile.academicTitle,
        department: userProfile.researchProfile.department,
        biography: userProfile.researchProfile.biography,
        researchInterests: userProfile.researchProfile.researchInterests,
        specialization: userProfile.researchProfile.specialization || [],
        keywords: userProfile.researchProfile.keywords || [],
        hIndex: userProfile.researchProfile.hIndex,
        citationCount: userProfile.researchProfile.citationCount,
        phone: userProfile.researchProfile.phone,
        website: userProfile.researchProfile.website,
        linkedin: userProfile.researchProfile.linkedin,
        twitter: userProfile.researchProfile.twitter,
        googleScholar: userProfile.researchProfile.googleScholar,
        researcherIds: readResearcherIds(userProfile.researchProfile),
      } : null,
    };

    // Fetch ORCID data if ORCID ID exists
    let orcidData = null;
    if (userProfile.orcidId) {
      try {
        const orcidResponse = await fetch(
          `https://pub.orcid.org/v3.0/${userProfile.orcidId}/record`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com)',
            },
          }
        );

        if (orcidResponse.ok) {
          const orcidRawData = await orcidResponse.json();
          
          // Extract biography
          const biography = orcidRawData.person?.biography?.content || null;
          
          // ORCID v3 nests affiliations as activities-summary.<type>['affiliation-group'][].summaries[].<type>-summary
          // (older responses used activities.<type>['<type>-summary']). Support both.
          const affiliations = (section, key) => {
            const container =
              orcidRawData['activities-summary']?.[section] || orcidRawData.activities?.[section] || {};
            const grouped = (container['affiliation-group'] || []).flatMap((g) =>
              (g.summaries || []).map((s) => s[key]).filter(Boolean)
            );
            return grouped.length ? grouped : container[key] || [];
          };
          const dateKey = (d) =>
            d ? `${d.year?.value || '0000'}-${String(d.month?.value || '00').padStart(2, '0')}` : '0000-00';
          const toItem = (a, titleField, fallbackTitle) => ({
            [titleField]: a['role-title'] || fallbackTitle,
            organization: a.organization?.name || 'Organization not specified',
            department: a['department-name'] || null,
            location: [a.organization?.address?.city, a.organization?.address?.country].filter(Boolean).join(', ') || null,
            startDate: a['start-date'] || null,
            endDate: a['end-date'] || null,
          });
          const byNewest = (a, b) =>
            (b.endDate ? dateKey(b.endDate) : '9999') .localeCompare(a.endDate ? dateKey(a.endDate) : '9999') ||
            dateKey(b.startDate).localeCompare(dateKey(a.startDate));

          orcidData = {
            biography,
            employments: affiliations('employments', 'employment-summary')
              .map((a) => toItem(a, 'role', 'Role not specified'))
              .sort(byNewest)
              .slice(0, 15),
            educations: affiliations('educations', 'education-summary')
              .map((a) => toItem(a, 'degree', 'Degree not specified'))
              .sort(byNewest)
              .slice(0, 15),
          };
        }
      } catch (orcidError) {
        console.error('Error fetching ORCID data:', orcidError);
        // Continue without ORCID data
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      orcidData,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/researcher/profile
 * Update researcher profile data
 */
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update user basic info
    const updateData = {
      givenName: body.givenName,
      familyName: body.familyName,
      primaryInstitution: body.primaryInstitution,
    };

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Check if research profile exists
    const existingResearchProfile = await prisma.researchProfile.findUnique({
      where: { userId: user.id },
    });

    // Prepare research profile data
    const researchProfileData = {
      academicTitle: body.researchProfile?.academicTitle || body.academicTitle || null,
      department: body.researchProfile?.department || body.department || null,
      biography: body.researchProfile?.biography || body.biography || null,
      researchInterests: body.researchProfile?.researchInterests || body.researchInterests || null,
      specialization: body.researchProfile?.specialization || body.specialization || [],
      keywords: body.researchProfile?.keywords || body.keywords || [],
      hIndex: body.researchProfile?.hIndex ? parseInt(body.researchProfile.hIndex) : (body.hIndex ? parseInt(body.hIndex) : null),
      citationCount: body.researchProfile?.citationCount ? parseInt(body.researchProfile.citationCount) : (body.citationCount ? parseInt(body.citationCount) : null),
      // New fields
      phone: body.researchProfile?.phone || null,
      website: body.researchProfile?.website || null,
      linkedin: body.researchProfile?.linkedin || null,
      twitter: body.researchProfile?.twitter || null,
      ...(body.researchProfile && 'googleScholar' in body.researchProfile
        ? { googleScholar: body.researchProfile.googleScholar || null }
        : {}),
    };

    if (existingResearchProfile) {
      // Update existing research profile
      await prisma.researchProfile.update({
        where: { userId: user.id },
        data: researchProfileData,
      });
    } else {
      // Create new research profile
      await prisma.researchProfile.create({
        data: {
          userId: user.id,
          ...researchProfileData,
        },
      });
    }

    // Fetch updated profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        researchProfile: true,
      },
    });

    const profile = {
      id: updatedUser.id,
      email: updatedUser.email,
      givenName: updatedUser.givenName,
      familyName: updatedUser.familyName,
      orcidId: updatedUser.orcidId,
      orcidGivenNames: updatedUser.orcidGivenNames,
      orcidFamilyName: updatedUser.orcidFamilyName,
      avatarUrl: updatedUser.avatarUrl || null,
      primaryInstitution: updatedUser.primaryInstitution,
      researchProfile: updatedUser.researchProfile ? {
        id: updatedUser.researchProfile.id,
        academicTitle: updatedUser.researchProfile.academicTitle,
        department: updatedUser.researchProfile.department,
        biography: updatedUser.researchProfile.biography,
        researchInterests: updatedUser.researchProfile.researchInterests,
        specialization: updatedUser.researchProfile.specialization || [],
        keywords: updatedUser.researchProfile.keywords || [],
        hIndex: updatedUser.researchProfile.hIndex,
        citationCount: updatedUser.researchProfile.citationCount,
        phone: updatedUser.researchProfile.phone,
        website: updatedUser.researchProfile.website,
        linkedin: updatedUser.researchProfile.linkedin,
        twitter: updatedUser.researchProfile.twitter,
        googleScholar: updatedUser.researchProfile.googleScholar,
        researcherIds: readResearcherIds(updatedUser.researchProfile),
      } : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

