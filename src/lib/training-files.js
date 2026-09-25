import path from 'path';
import { mkdir, writeFile, readFile, access, unlink } from 'fs/promises';
import { sanitizeFileName } from './sanitize-file-name.js';
import { uploadServerSide, softDeleteFile } from './storage/files-service.js';
import { readStoredFileBytes } from './storage/read.js';
import { parseStoredFileUrl } from './storage/parse-file-url.js';

export const TRAINING_MATERIAL_MAX_BYTES = 50 * 1024 * 1024;
export const TRAINING_MATERIAL_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];

export const TRAINING_CERTIFICATE_MAX_BYTES = 5 * 1024 * 1024;
export const TRAINING_CERTIFICATE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

const MATERIALS_DIR = path.join(process.cwd(), 'uploads', 'training', 'materials');
const CERTIFICATES_DIR = path.join(process.cwd(), 'uploads', 'training', 'certificates');

function getExtension(fileName) {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function validateFile(file, maxBytes, allowedExtensions, label) {
  if (!file || !file.size) return { ok: false, error: `Empty ${label}` };
  if (file.size > maxBytes) {
    return { ok: false, error: `${label} exceeds ${maxBytes / (1024 * 1024)} MB limit` };
  }
  const ext = getExtension(file.name);
  if (!allowedExtensions.includes(ext)) {
    return { ok: false, error: `${label} type .${ext || '?'} is not allowed` };
  }
  return { ok: true, ext };
}

export function useTrainingStorage() {
  return process.env.STORAGE_CUTOVER_TRAINING === 'true' || process.env.STORAGE_DRIVER === 'r2';
}

export function validateTrainingMaterial(file) {
  return validateFile(file, TRAINING_MATERIAL_MAX_BYTES, TRAINING_MATERIAL_EXTENSIONS, 'File');
}

export function validateTrainingCertificate(file) {
  return validateFile(file, TRAINING_CERTIFICATE_MAX_BYTES, TRAINING_CERTIFICATE_EXTENSIONS, 'Certificate');
}

export function buildTrainingMaterialFileName(file) {
  const safe = sanitizeFileName(file.name || 'material');
  return `${Date.now()}_${safe}`;
}

export function buildTrainingCertificateFileName(userId, file) {
  const safe = sanitizeFileName(file.name || 'certificate');
  return `cert_${userId}_${Date.now()}_${safe}`;
}

export function trainingFileUrl(fileId) {
  return `/api/files/${fileId}`;
}

export function parseTrainingFileUrl(url) {
  const fileId = parseStoredFileUrl(url);
  if (fileId) return { fileId };
  const materialMatch = url?.match(/^\/uploads\/training\/materials\/([^/]+)$/);
  if (materialMatch) return { legacyPath: path.join(MATERIALS_DIR, materialMatch[1]) };
  const certMatch = url?.match(/^\/uploads\/training\/certificates\/([^/]+)$/);
  if (certMatch) return { legacyPath: path.join(CERTIFICATES_DIR, certMatch[1]) };
  return null;
}

export async function saveTrainingMaterial(materialId, file, options = {}) {
  if (useTrainingStorage() && options.user) {
    const stored = await uploadServerSide({
      user: options.user,
      module: 'TRAINING_MATERIAL',
      entityType: 'TrainingMaterial',
      entityId: materialId,
      file,
      entityTenantId: options.entityTenantId,
    });
    return { fileUrl: trainingFileUrl(stored.id), fileId: stored.id };
  }

  await mkdir(MATERIALS_DIR, { recursive: true });
  const fileName = buildTrainingMaterialFileName(file);
  const filePath = path.join(MATERIALS_DIR, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return { fileUrl: `/uploads/training/materials/${fileName}`, fileName };
}

export async function saveTrainingCertificate(certificateId, file, options = {}) {
  if (useTrainingStorage() && options.user) {
    const stored = await uploadServerSide({
      user: options.user,
      module: 'TRAINING_CERTIFICATE',
      entityType: 'TrainingCertificate',
      entityId: certificateId,
      file,
      entityTenantId: options.entityTenantId,
    });
    return { fileUrl: trainingFileUrl(stored.id), fileId: stored.id };
  }

  await mkdir(CERTIFICATES_DIR, { recursive: true });
  const fileName = buildTrainingCertificateFileName(options.registrationUserId || 'user', file);
  const filePath = path.join(CERTIFICATES_DIR, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return { fileUrl: `/uploads/training/certificates/${fileName}`, fileName };
}

export async function readTrainingFile(fileUrl, user) {
  const parsed = parseTrainingFileUrl(fileUrl);
  if (!parsed) return null;

  if (parsed.fileId && user) {
    const result = await readStoredFileBytes(user, parsed.fileId);
    if (!result) return null;
    return { buffer: result.buffer, contentType: result.mimeType };
  }

  if (parsed.legacyPath) {
    await access(parsed.legacyPath);
    const buffer = await readFile(parsed.legacyPath);
    const ext = path.extname(parsed.legacyPath).replace('.', '').toLowerCase();
    const contentType =
      ext === 'pdf' ? 'application/pdf'
      : ext === 'png' ? 'image/png'
      : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : 'application/octet-stream';
    return { buffer, contentType };
  }

  return null;
}

export async function deleteTrainingFile(fileUrl, user) {
  const parsed = parseTrainingFileUrl(fileUrl);
  if (!parsed) return;

  if (parsed.fileId && user) {
    try {
      await softDeleteFile({ user, fileId: parsed.fileId });
    } catch {
      // already deleted
    }
    return;
  }

  if (parsed.legacyPath) {
    try {
      await unlink(parsed.legacyPath);
    } catch {
      // missing file is fine
    }
  }
}
