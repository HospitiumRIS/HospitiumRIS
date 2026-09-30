import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  fetchInstitutionScopedData,
} from '@/lib/institution-admin';

function convertToCSV(data) {
  let csv = '';

  for (const [tableName, records] of Object.entries(data)) {
    if (Array.isArray(records) && records.length > 0) {
      csv += `\n# ${tableName.toUpperCase()}\n`;
      const headers = Object.keys(records[0]);
      csv += `${headers.join(',')}\n`;

      records.forEach((record) => {
        const values = headers.map((header) => {
          const value = record[header];
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        });
        csv += `${values.join(',')}\n`;
      });
    }
  }

  return csv;
}

function getRecordCount(data) {
  return Object.values(data).reduce(
    (total, records) => total + (Array.isArray(records) ? records.length : 0),
    0
  );
}

export async function POST(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { format = 'json', scope = 'all' } = await request.json();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const exportData = await fetchInstitutionScopedData(institution, scope);
    const filename = `institution-${institution.slug}-${scope}-export-${timestamp}.${format}`;
    const filepath = path.join(exportDir, filename);

    const payload = {
      metadata: {
        institutionId: institution.id,
        institutionName: institution.name,
        scope,
        format,
        exportedBy: user.id,
        timestamp: new Date().toISOString(),
      },
      ...exportData,
    };

    const fileContent =
      format === 'csv' ? convertToCSV(exportData) : JSON.stringify(payload, null, 2);

    await fs.writeFile(filepath, fileContent, 'utf8');

    const stats = await fs.stat(filepath);
    const sizeInKB = (stats.size / 1024).toFixed(2);

    return NextResponse.json({
      success: true,
      message: 'Institution data export completed successfully',
      export: {
        filename,
        format,
        scope,
        size: `${sizeInKB} KB`,
        recordCount: getRecordCount(exportData),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Data export failed:', err);
    return NextResponse.json(
      { success: false, message: 'Data export failed', error: err.message },
      { status: 500 }
    );
  }
}
