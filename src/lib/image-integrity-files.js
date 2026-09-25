import { mkdir, writeFile, readFile, unlink, access } from 'fs/promises';
import path from 'path';
import { sanitizeFileName } from './sanitize-file-name.js';
import { uploadServerSide, softDeleteFile } from './storage/files-service.js';
import { readStoredFileBytes } from './storage/read.js';
import { resolveTenantId } from './tenant.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'image-integrity');

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  pdf: 'application/pdf',
  zip: 'application/zip',
};

export { sanitizeFileName };

export function useImageIntegrityStorage() {
  return process.env.STORAGE_CUTOVER_IMAGE_INTEGRITY === 'true' || process.env.STORAGE_DRIVER === 'r2';
}

export function getStoredFilePath(caseId, fileName) {
  return path.join(UPLOAD_DIR, caseId, sanitizeFileName(fileName));
}

export function getMimeType(fileFormat, fileName) {
  const ext = (fileFormat || path.extname(fileName || '').replace('.', '') || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

/**
 * @param {string} caseId
 * @param {File} file
 * @param {{ user?: object, entityTenantId?: string }} [options]
 */
export async function saveIntegrityFile(caseId, file, options = {}) {
  const storedName = sanitizeFileName(file.name || 'upload');

  if (useImageIntegrityStorage() && options.user) {
    const stored = await uploadServerSide({
      user: options.user,
      module: 'IMAGE_INTEGRITY',
      entityType: 'ImageIntegrityCase',
      entityId: caseId,
      file,
      entityTenantId: options.entityTenantId || resolveTenantId(options.user),
    });
    return { storedName, size: stored.sizeBytes, fileId: stored.id };
  }

  const dir = path.join(UPLOAD_DIR, caseId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);
  return { filePath, storedName, size: bytes.length };
}

export async function readIntegrityFile(caseId, fileName, { user, fileId } = {}) {
  if (fileId && user) {
    const result = await readStoredFileBytes(user, fileId);
    if (result) {
      return { buffer: result.buffer, filePath: null, mimeType: result.mimeType };
    }
  }

  const filePath = getStoredFilePath(caseId, fileName);
  await access(filePath);
  const buffer = await readFile(filePath);
  return { buffer, filePath };
}

export async function deleteIntegrityFile(caseId, fileName, { user, fileId } = {}) {
  if (fileId && user) {
    try {
      await softDeleteFile({ user, fileId });
    } catch {
      // Missing or already deleted
    }
    return;
  }

  try {
    await unlink(getStoredFilePath(caseId, fileName));
  } catch {
    // Missing file is fine on delete
  }
}

export function previewUrlForCase(caseId, storedFileId) {
  if (storedFileId) return `/api/files/${storedFileId}`;
  return `/api/researcher/image-integrity/${caseId}/file`;
}
