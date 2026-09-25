import { mkdir, writeFile, readFile, unlink, access, rm } from 'fs/promises';
import path from 'path';
import { sanitizeFileName } from './sanitize-file-name.js';
import { uploadServerSide } from './storage/files-service.js';
import { readStoredFileBytes } from './storage/read.js';
import { resolveTenantId } from './tenant.js';

export { sanitizeFileName };

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'ethics');

const MIME_BY_EXT = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const ETHICS_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;
export const ETHICS_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
export const ETHICS_CERTIFICATE_MAX_BYTES = 15 * 1024 * 1024;
export const ETHICS_CERTIFICATE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];

function getExtension(fileName) {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function useEthicsStorage() {
  return process.env.STORAGE_CUTOVER_ETHICS === 'true' || process.env.STORAGE_DRIVER === 'r2';
}

export function validateEthicsDocument(file) {
  if (!file || !file.size) return { ok: false, error: 'Empty file' };
  if (file.size > ETHICS_DOCUMENT_MAX_BYTES) {
    return { ok: false, error: `File exceeds ${ETHICS_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB limit` };
  }
  const ext = getExtension(file.name);
  if (!ETHICS_DOCUMENT_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `File type .${ext || '?'} is not allowed` };
  }
  return { ok: true, ext };
}

export function validateEthicsCertificate(file) {
  if (!file || !file.size) return { ok: false, error: 'Empty file' };
  if (file.size > ETHICS_CERTIFICATE_MAX_BYTES) {
    return { ok: false, error: `File exceeds ${ETHICS_CERTIFICATE_MAX_BYTES / (1024 * 1024)} MB limit` };
  }
  const ext = getExtension(file.name);
  if (!ETHICS_CERTIFICATE_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `File type .${ext || '?'} is not allowed` };
  }
  return { ok: true, ext };
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

/**
 * @param {string} applicationId
 * @param {File} file
 * @param {{ user?: object, module?: string, entityTenantId?: string }} [options]
 */
export async function saveEthicsFile(applicationId, file, options = {}) {
  const storedName = `${Date.now()}_${sanitizeFileName(file.name || 'certificate')}`;

  if (useEthicsStorage() && options.user) {
    const stored = await uploadServerSide({
      user: options.user,
      module: options.module || 'ETHICS_DOCUMENT',
      entityType: 'EthicsApplication',
      entityId: applicationId,
      file,
      entityTenantId: options.entityTenantId || resolveTenantId(options.user),
    });
    return {
      storedName,
      size: stored.sizeBytes,
      fileId: stored.id,
    };
  }

  const dir = path.join(UPLOAD_DIR, applicationId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, storedName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);
  return { filePath, storedName, size: bytes.length };
}

export async function readEthicsFile(applicationId, fileName, { user, fileId } = {}) {
  if (fileId && user) {
    const result = await readStoredFileBytes(user, fileId);
    if (result) {
      return { buffer: result.buffer, filePath: null, mimeType: result.mimeType };
    }
  }

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

export function ethicsFileUrl(applicationId, storedName, fileId) {
  if (fileId) return `/api/files/${fileId}`;
  return `/api/ethics/applications/${applicationId}/file?name=${encodeURIComponent(storedName)}`;
}
