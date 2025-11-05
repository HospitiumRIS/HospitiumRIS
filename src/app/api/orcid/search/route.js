import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const givenNames = searchParams.get('givenNames');
    const familyName = searchParams.get('familyName');

    if (!givenNames && !familyName) {
      return NextResponse.json(
        { error: 'At least one name parameter is required' },
        { status: 400 }
      );
    }

    // Build ORCID search query
    let query = '';
    if (givenNames) {
      query += `given-names:${givenNames}`;
    }
    if (familyName) {
      if (query) query += ' AND ';
      query += `family-name:${familyName}`;
    }

    // ORCID Public API search endpoint
    const orcidSearchUrl = `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(query)}&rows=15`;
    
    console.log('ORCID Search URL:', orcidSearchUrl);

    const response = await fetch(orcidSearchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com; mailto:support@hospitiumris.com)'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.error('ORCID API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to search ORCID database' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('ORCID Response:', JSON.stringify(data, null, 2));

    // Transform ORCID data to our format
    const researchers = await Promise.all(
      data.result?.map(async (item) => {
        const orcidId = item['orcid-identifier']?.path;
        if (!orcidId) return null;

        try {
          // Fetch detailed profile for each researcher
          const profileResponse = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/record`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com; mailto:support@hospitiumris.com)'
            },
            timeout: 8000 // 8 second timeout for individual profiles
          });

          if (!profileResponse.ok) {
            console.error(`Failed to fetch profile for ${orcidId}:`, profileResponse.status);
            // Return basic info from search results as fallback
            return {
              orcidId: orcidId,
              givenNames: '',
              familyName: '',
              creditName: item['credit-name']?.value || 'Unknown Researcher',
              affiliations: [],
              employmentSummary: 'Researcher',
              profileUrl: `https://orcid.org/${orcidId}`
            };
          }

          const profile = await profileResponse.json();
          
          // Extract personal details
          const person = profile.person;
          const name = person?.name;
          const givenNames = name?.['given-names']?.value || '';
          const familyName = name?.['family-name']?.value || '';
          const creditName = name?.['credit-name']?.value || `${givenNames} ${familyName}`.trim();

          // Extract employment/affiliations
          const employments = profile.activities?.employments?.['employment-summary'] || [];
          const educations = profile.activities?.educations?.['education-summary'] || [];
          
          const affiliations = [];
          const roles = [];

          // Process employments
          employments.forEach(emp => {
            if (emp.organization?.name) {
              affiliations.push(emp.organization.name);
            }
            if (emp['role-title']) {
              roles.push(emp['role-title']);
            }
          });

          // Process educations if no employments
          if (affiliations.length === 0) {
            educations.forEach(edu => {
              if (edu.organization?.name) {
                affiliations.push(edu.organization.name);
              }
            });
          }

          return {
            orcidId: orcidId,
            givenNames: givenNames,
            familyName: familyName,
            creditName: creditName || `${givenNames} ${familyName}`.trim(),
            affiliations: [...new Set(affiliations)].slice(0, 3), // Remove duplicates, limit to 3
            employmentSummary: roles[0] || 'Researcher',
            profileUrl: `https://orcid.org/${orcidId}`
          };
        } catch (error) {
          console.error(`Error fetching profile for ${orcidId}:`, error);
          return null;
        }
      }) || []
    );

    // Filter out null results and limit to 10
    const validResearchers = researchers.filter(r => r !== null).slice(0, 10);

    return NextResponse.json({
      success: true,
      count: validResearchers.length,
      researchers: validResearchers
    });

  } catch (error) {
    console.error('ORCID Search Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during ORCID search' },
      { status: 500 }
    );
  }
}