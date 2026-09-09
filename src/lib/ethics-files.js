import { mkdir, writeFile, readFile, unlink, access, rm } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'ethics');

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export const ETHICS_CERTIFICATE_MAX_BYTES = 15 * 1024 * 1024;
export const ETHICS_CERTIFICATE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

export function sanitizeFileName(fileName = 'upload') {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getEthicsFilePath(applicationId, fileName) {
  return path.join(UPLOAD_DIR, applicationId, sanitizeFileName(fileName));
}

export function getEthicsMimeType(fileName) {
  const ext = path.extname(fileName || '').replace('.', '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export function getFileExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export async function saveEthicsFile(applicationId, file) {
  const dir = path.join(UPLOAD_DIR, applicationId);
  await mkdir(dir, { recursive: true });
  const storedName = `${Date.now()}_${sanitizeFileName(file.name || 'certificate')}`;
  const filePath = path.join(dir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);
  return { filePath, storedName, size: bytes.length };
}

export async function readEthicsFile(applicationId, fileName) {
  const filePath = getEthicsFilePath(applicationId, fileName);
  await access(filePath);
  const buffer = await readFile(filePath);
  return { buffer, filePath };
}

export async function deleteEthicsFile(applicationId, fileName) {
  try {
    await unlink(getEthicsFilePath(applicationId, fileName));
  } catch {
    // Missing file is fine on delete
  }
}

export async function deleteEthicsApplicationFiles(applicationId) {
  try {
    await rm(path.join(UPLOAD_DIR, applicationId), { recursive: true, force: true });
  } catch {
    // Missing directory is fine
  }
}

export function ethicsFileUrl(applicationId, storedName) {
  return `/api/ethics/applications/${applicationId}/file?name=${encodeURIComponent(storedName)}`;
}
