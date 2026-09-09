import { mkdir, writeFile, readFile, unlink, access } from 'fs/promises';
import path from 'path';

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

function sanitizeFileName(fileName = 'upload') {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getStoredFilePath(caseId, fileName) {
  return path.join(UPLOAD_DIR, caseId, sanitizeFileName(fileName));
}

export function getMimeType(fileFormat, fileName) {
  const ext = (fileFormat || path.extname(fileName || '').replace('.', '') || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export async function saveIntegrityFile(caseId, file) {
  const dir = path.join(UPLOAD_DIR, caseId);
  await mkdir(dir, { recursive: true });
  const storedName = sanitizeFileName(file.name || 'upload');
  const filePath = path.join(dir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);
  return { filePath, storedName, size: bytes.length };
}

export async function readIntegrityFile(caseId, fileName) {
  const filePath = getStoredFilePath(caseId, fileName);
  await access(filePath);
  const buffer = await readFile(filePath);
  return { buffer, filePath };
}

export async function deleteIntegrityFile(caseId, fileName) {
  try {
    await unlink(getStoredFilePath(caseId, fileName));
  } catch {
    // Missing file is fine on delete
  }
}

export function previewUrlForCase(caseId) {
  return `/api/researcher/image-integrity/${caseId}/file`;
}
