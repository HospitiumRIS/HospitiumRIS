import { mkdir, writeFile, unlink, readFile, access } from 'fs/promises';
import path from 'path';
import { uploadServerSide, softDeleteFile } from './storage/files-service.js';
import { readStoredFileBytes } from './storage/read.js';
import { parseStoredFileUrl } from './storage/parse-file-url.js';

export const INSTITUTION_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const INSTITUTION_LOGO_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function useLogoStorage() {
  return process.env.STORAGE_CUTOVER_LOGO === 'true' || process.env.STORAGE_DRIVER === 'r2';
}

export function institutionLogoDir(institutionId) {
  return path.join(process.cwd(), 'uploads', 'institutions', institutionId);
}

export function institutionLogoPath(institutionId, fileName) {
  return path.join(institutionLogoDir(institutionId), fileName);
}

export function institutionLogoPublicPath(institutionId, fileName) {
  return `/uploads/institutions/${institutionId}/${fileName}`;
}

export function parseStoredLogo(logo) {
  if (!logo || typeof logo !== 'string') return null;
  const fileId = parseStoredFileUrl(logo);
  if (fileId) return { fileId };
  const match = logo.match(/^\/uploads\/institutions\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { institutionId: match[1], fileName: match[2] };
}

/**
 * @param {string} institutionId
 * @param {File} file
 * @param {{ user?: object }} [options]
 */
export async function saveInstitutionLogo(institutionId, file, options = {}) {
  const ext = INSTITUTION_LOGO_TYPES[file.type];
  if (!ext) {
    throw new Error('Logo must be a PNG, JPG, or WebP image');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > INSTITUTION_LOGO_MAX_BYTES) {
    throw new Error('Logo must be 2 MB or smaller');
  }

  if (useLogoStorage() && options.user) {
    const stored = await uploadServerSide({
      user: options.user,
      module: 'INSTITUTION_LOGO',
      entityType: 'Institution',
      entityId: institutionId,
      file,
      entityTenantId: institutionId,
    });
    return `/api/files/${stored.id}`;
  }

  const dir = institutionLogoDir(institutionId);
  await mkdir(dir, { recursive: true });
  const fileName = `logo.${ext}`;
  await writeFile(path.join(dir, fileName), bytes);
  return institutionLogoPublicPath(institutionId, fileName);
}

export async function deleteInstitutionLogoFile(logo, user) {
  const parsed = parseStoredLogo(logo);
  if (!parsed) return;

  if (parsed.fileId && user) {
    try {
      await softDeleteFile({ user, fileId: parsed.fileId });
    } catch {
      // Missing or already deleted
    }
    return;
  }

  if (!parsed.institutionId || !parsed.fileName) return;
  try {
    await unlink(institutionLogoPath(parsed.institutionId, parsed.fileName));
  } catch {
    // Missing file is fine
  }
}

export async function readInstitutionLogoFile(logo, user) {
  const parsed = parseStoredLogo(logo);
  if (!parsed) return null;

  if (parsed.fileId && user) {
    const result = await readStoredFileBytes(user, parsed.fileId);
    if (!result) return null;
    return { buffer: result.buffer, contentType: result.mimeType };
  }

  if (!parsed.institutionId || !parsed.fileName) return null;
  const filePath = institutionLogoPath(parsed.institutionId, parsed.fileName);
  await access(filePath);
  const buffer = await readFile(filePath);
  const ext = path.extname(parsed.fileName).replace('.', '').toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return { buffer, contentType };
}
