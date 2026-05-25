import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function GET(request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hospitium_session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user exists and is active
    const currentUser = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });

    if (!currentUser || currentUser.status !== 'ACTIVE' || !currentUser.emailVerified) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Only allow foundation admins to access this endpoint
    if (currentUser.accountType !== 'FOUNDATION_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read the Excel file
    const filePath = path.join(process.cwd(), 'public', 'africa_kenya_medical_research_grants.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Excel file not found' 
      }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    // Transform the data to match our schema using actual Excel column headers
    const opportunities = rawData.map((row, index) => ({
      id: row['ID'] || `excel-${index + 1}`,
      title: row['Grant Title'] || `Grant ${index + 1}`,
      grantor: row['Funding Organization'] || 'Unknown',
      amount: parseFloat(row['Award Amount (USD)'] || 0),
      minAmount: 0, // Not in Excel
      maxAmount: parseFloat(row['Award Amount (USD)'] || 0),
      deadline: row['Application Deadline'] || null,
      applicationOpenDate: row['Application Open Date'] || null,
      awardAnnouncement: row['Award Announcement'] || null,
      projectStartDate: row['Project Start Date'] || null,
      projectEndDate: row['Project End Date'] || null,
      duration: row['Duration (Months)'] || null,
      category: row['Grant Category'] || 'General',
      eligibility: row['Eligibility Criteria'] || 'Not specified',
      targetGroups: row['Target Applicant Groups'] || '',
      country: extractCountry(row['Geographic Scope']) || 'Kenya',
      region: row['Geographic Scope'] || 'Africa',
      focusArea: row['Research Focus Area'] || 'Medical Research',
      description: row['Purpose / Description'] || '',
      website: row['Application URL / Contact'] || '',
      contactEmail: '', // Not in Excel
      contactPhone: '', // Not in Excel
      applicationProcess: '', // Not in Excel
      requirements: row['Eligibility Criteria'] || '',
      notes: row['Notes'] || '',
      status: determineStatus(row['Application Deadline'], row['Status']),
      excelStatus: row['Status'] || '',
      source: 'Excel Import',
      importedAt: new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: opportunities,
      total: opportunities.length,
      sheetName,
      columns: Object.keys(rawData[0] || {})
    });

  } catch (error) {
    console.error('Error reading Excel file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read Excel file', details: error.message },
      { status: 500 }
    );
  }
}

function extractCountry(geographicScope) {
  if (!geographicScope) return 'Kenya';
  
  const scope = geographicScope.toLowerCase();
  
  // Check for specific countries
  if (scope.includes('kenya')) return 'Kenya';
  if (scope.includes('uganda')) return 'Uganda';
  if (scope.includes('tanzania')) return 'Tanzania';
  if (scope.includes('rwanda')) return 'Rwanda';
  if (scope.includes('ethiopia')) return 'Ethiopia';
  if (scope.includes('south africa')) return 'South Africa';
  
  // Check for regions
  if (scope.includes('africa') || scope.includes('east africa') || scope.includes('sub-saharan')) {
    return 'Africa (Multi-country)';
  }
  
  if (scope.includes('global') || scope.includes('international')) {
    return 'Global';
  }
  
  return geographicScope;
}

function determineStatus(deadline, excelStatus) {
  // First check the Excel status field
  if (excelStatus) {
    const status = excelStatus.toLowerCase();
    if (status === 'open') return 'open';
    if (status === 'closed') return 'closed';
    if (status === 'pending') return 'pending';
  }
  
  // If no Excel status or it's unclear, check deadline
  if (!deadline) return 'unknown';
  
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      return 'closed';
    } else if (deadlineDate.getTime() === today.getTime()) {
      return 'closing-today';
    } else {
      return 'open';
    }
  } catch (error) {
    return 'unknown';
  }
}
