import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
} from '@/lib/institution-admin';
import {
  BACKUP_DIR,
  sanitizeFilename,
  readBackupMetadata,
} from '../route';

export async function GET(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filename = sanitizeFilename(searchParams.get('file') || '');
    if (!filename) {
      return NextResponse.json({ success: false, message: 'Invalid backup file' }, { status: 400 });
    }

    if (!filename.startsWith(`institution-${institution.id}-backup-`)) {
      return NextResponse.json({ success: false, message: 'Backup not found' }, { status: 404 });
    }

    const filepath = path.join(BACKUP_DIR, filename);
    const metadata = await readBackupMetadata(filepath);
    if (metadata?.institutionId && metadata.institutionId !== institution.id) {
      return NextResponse.json({ success: false, message: 'Backup not found' }, { status: 404 });
    }

    const content = await fs.readFile(filepath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return NextResponse.json({ success: false, message: 'Backup not found' }, { status: 404 });
    }
    console.error('Backup download failed:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to download backup', error: err.message },
      { status: 500 }
    );
  }
}
