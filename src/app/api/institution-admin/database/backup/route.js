import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  fetchInstitutionScopedData,
} from '@/lib/institution-admin';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

function backupPrefix(institutionId) {
  return `institution-${institutionId}-backup-`;
}

function sanitizeFilename(filename) {
  const base = path.basename(filename);
  if (!base.startsWith('institution-') || !base.endsWith('.json')) {
    return null;
  }
  if (base.includes('..') || base.includes('/') || base.includes('\\')) {
    return null;
  }
  return base;
}

async function readBackupMetadata(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    const data = JSON.parse(content);
    return data.metadata || {};
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const { backupType = 'full', description = '' } = await request.json();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${backupPrefix(institution.id)}${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const backupData = {
      metadata: {
        backupType,
        description,
        institutionId: institution.id,
        institutionName: institution.name,
        createdBy: user.id,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
      data: {},
    };

    if (backupType === 'full' || backupType === 'data') {
      backupData.data = await fetchInstitutionScopedData(institution, 'all');
    }

    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

    const stats = await fs.stat(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    const backupInfo = {
      id: filename,
      filename,
      type: backupType.charAt(0).toUpperCase() + backupType.slice(1),
      description,
      size: `${sizeInMB} MB`,
      status: 'Completed',
      date: stats.mtime.toISOString().replace('T', ' ').substring(0, 19),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Institution backup completed successfully',
      backup: backupInfo,
    });
  } catch (err) {
    console.error('Database backup failed:', err);
    return NextResponse.json(
      { success: false, message: 'Database backup failed', error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    try {
      const files = await fs.readdir(BACKUP_DIR);
      const prefix = backupPrefix(institution.id);

      const backups = (
        await Promise.all(
          files
            .filter((file) => file.startsWith(prefix) && file.endsWith('.json'))
            .map(async (file) => {
              const filepath = path.join(BACKUP_DIR, file);
              const stats = await fs.stat(filepath);
              const metadata = await readBackupMetadata(filepath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              const backupType = metadata?.backupType || 'full';

              if (metadata?.institutionId && metadata.institutionId !== institution.id) {
                return null;
              }

              return {
                id: file,
                filename: file,
                size: `${sizeInMB} MB`,
                type: backupType.charAt(0).toUpperCase() + backupType.slice(1),
                status: 'Completed',
                date: stats.mtime.toISOString().replace('T', ' ').substring(0, 19),
                description: metadata?.description || '',
              };
            })
        )
      ).filter(Boolean);

      backups.sort((a, b) => new Date(b.date) - new Date(a.date));

      return NextResponse.json({ success: true, backups });
    } catch (err) {
      if (err.code === 'ENOENT') {
        return NextResponse.json({ success: true, backups: [] });
      }
      throw err;
    }
  } catch (err) {
    console.error('Failed to fetch backup history:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch backup history', error: err.message },
      { status: 500 }
    );
  }
}

export { sanitizeFilename, readBackupMetadata, BACKUP_DIR };
