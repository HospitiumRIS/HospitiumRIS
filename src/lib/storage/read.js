import { readFile } from 'fs/promises';
import prisma from '../prisma.js';
import { getStorageDriver } from './index.js';
import { canReadStoredFile } from './access.js';

const LEGACY_FALLBACK = process.env.STORAGE_LEGACY_FALLBACK === 'true';

/**
 * Read file bytes by StoredFile id with auth check.
 */
export async function readStoredFileBytes(user, fileId) {
  const row = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!row || row.status === 'DELETED') return null;
  if (row.status !== 'AVAILABLE' && row.status !== 'QUARANTINED') return null;
  if (!canReadStoredFile(user, row)) return null;

  const driver = getStorageDriver();
  try {
    return {
      buffer: await driver.get(row.bucket, row.storageKey),
      mimeType: row.mimeType,
      originalName: row.originalName,
      fileId: row.id,
    };
  } catch {
    if (LEGACY_FALLBACK && row.legacyPath) {
      const buffer = await readFile(row.legacyPath);
      return { buffer, mimeType: row.mimeType, originalName: row.originalName, fileId: row.id };
    }
    return null;
  }
}
