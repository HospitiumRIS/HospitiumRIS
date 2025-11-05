import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test ORCID API connectivity with a simple search
    const testQuery = 'given-names:John AND family-name:Smith';
    const orcidSearchUrl = `https://pub.orcid.org/v3.0/search/?q=${encodeURIComponent(testQuery)}&rows=1`;
    
    const response = await fetch(orcidSearchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HospitiumRis/1.0 (https://hospitiumris.com; mailto:support@hospitiumris.com)'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `ORCID API returned ${response.status}: ${response.statusText}`,
        message: 'ORCID API is not accessible'
      });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'ORCID API is accessible',
      sampleResultCount: data.result?.length || 0,
      orcidApiStatus: 'Connected'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to connect to ORCID API'
    });
  }
}
