import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import prisma from '../prisma.js';
import { getStorageDriver, getPrivateBucket, getPublicBucket } from './index.js';
import { resolveTenantId } from '../tenant.js';
import { buildKey, resolveTenant } from './keys.js';
import { getModulePolicy, validateUploadRequest, isAllowedMimeType } from './policy.js';
import { sniffMimeType } from './sniff.js';
import { canReadStoredFile, canInitiateForTenant } from './access.js';
import { canAccessTrainingStoredFile } from '../training-access.js';

const PRESIGN_PUT_TTL = parseInt(process.env.STORAGE_PRESIGN_PUT_TTL || '600', 10);
const PRESIGN_GET_TTL = parseInt(process.env.STORAGE_PRESIGN_GET_TTL || '120', 10);
const LEGACY_FALLBACK = process.env.STORAGE_LEGACY_FALLBACK === 'true';

function bucketForVisibility(visibility) {
  return visibility === 'PUBLIC' ? getPublicBucket() : getPrivateBucket();
}

/**
 * Server-proxied upload for modules that post through the API (ethics, logos).
 */
export async function uploadServerSide({ user, module, entityType, entityId, file, entityTenantId }) {
  const fileName = file.name || 'upload';
  const sizeBytes = file.size || 0;
  const contentType = file.type || 'application/octet-stream';

  const initiated = await initiateUpload({
    user,
    module,
    entityType,
    entityId,
    fileName,
    sizeBytes,
    contentType,
    entityTenantId,
  });

  const row = await prisma.storedFile.findUnique({ where: { id: initiated.fileId } });
  const driver = getStorageDriver();
  const body = Buffer.from(await file.arrayBuffer());
  await driver.put(row.bucket, row.storageKey, body, { contentType });

  const completed = await completeUpload({ user, fileId: initiated.fileId });
  return completed;
}

export async function initiateUpload({ user, module, entityType, entityId, fileName, sizeBytes, contentType, entityTenantId }) {
  if (!user) throw new StorageError('Unauthorized', 401);

  const validation = validateUploadRequest({ module, fileName, sizeBytes });
  if (!validation.ok) throw new StorageError(validation.error, 400);

  if (!canInitiateForTenant(user, entityTenantId)) {
    throw new StorageError('Not found', 404);
  }

  const policy = getModulePolicy(module);
  const tenantSegment = entityTenantId || resolveTenant(user);
  const ext = validation.ext;
  const storageKey = buildKey({ tenantId: tenantSegment, module, entityId, ext });
  const bucket = bucketForVisibility(policy.visibility);

  const row = await prisma.storedFile.create({
    data: {
      tenantId: entityTenantId || resolveTenantId(user) || null,
      ownerUserId: user.id,
      module,
      entityType,
      entityId,
      bucket,
      storageKey,
      visibility: policy.visibility,
      originalName: fileName,
      mimeType: contentType || 'application/octet-stream',
      sizeBytes: BigInt(sizeBytes),
      status: 'PENDING',
    },
  });

  const driver = getStorageDriver();
  const presigned = await driver.presignPut(bucket, storageKey, {
    expiresIn: PRESIGN_PUT_TTL,
    contentType: contentType || 'application/octet-stream',
  });

  return {
    fileId: row.id,
    uploadUrl: presigned.url,
    method: presigned.method,
    headers: presigned.headers,
    expiresIn: PRESIGN_PUT_TTL,
  };
}

export async function completeUpload({ user, fileId, sha256 }) {
  if (!user) throw new StorageError('Unauthorized', 401);

  const row = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!row || row.status !== 'PENDING') throw new StorageError('Not found', 404);
  if (row.ownerUserId !== user.id && user.accountType !== 'GLOBAL_ADMIN') {
    throw new StorageError('Not found', 404);
  }

  const driver = getStorageDriver();
  let head;
  try {
    head = await driver.head(row.bucket, row.storageKey);
  } catch {
    throw new StorageError('Upload not found in storage', 400);
  }

  if (BigInt(head.size) !== row.sizeBytes) {
    await driver.delete(row.bucket, row.storageKey);
    await prisma.storedFile.update({
      where: { id: fileId },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
    throw new StorageError('Uploaded size does not match declared size', 400);
  }

  const sample = await driver.get(row.bucket, row.storageKey);
  const sniffed = await sniffMimeType(sample.subarray(0, Math.min(sample.length, 4100)));
  const mimeType = sniffed || row.mimeType;

  if (!isAllowedMimeType(row.module, mimeType)) {
    await driver.delete(row.bucket, row.storageKey);
    await prisma.storedFile.update({
      where: { id: fileId },
      data: { status: 'QUARANTINED', deletedAt: new Date() },
    });
    throw new StorageError('File type not allowed', 400);
  }

  const computedHash = sha256 || createHash('sha256').update(sample).digest('hex');

  const updated = await prisma.storedFile.update({
    where: { id: fileId },
    data: {
      status: 'AVAILABLE',
      mimeType,
      sha256: computedHash,
      sizeBytes: BigInt(head.size),
      availableAt: new Date(),
    },
  });

  return sanitizeFileResponse(updated);
}

export async function getDownloadRedirect({ user, fileId, download = false }) {
  if (!user) throw new StorageError('Unauthorized', 401);

  const row = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!row || row.status !== 'AVAILABLE') {
    if (LEGACY_FALLBACK && row?.legacyPath) {
      return readLegacyFile(row, download);
    }
    throw new StorageError('Not found', 404);
  }

  if (!canReadStoredFile(user, row)) {
    throw new StorageError('Not found', 404);
  }
  if (!(await canAccessTrainingStoredFile(user, row))) {
    throw new StorageError('Not found', 404);
  }

  const driver = getStorageDriver();
  const disposition = `${download ? 'attachment' : 'inline'}; filename="${String(row.originalName).replace(/"/g, '')}"`;
  const presigned = await driver.presignGet(row.bucket, row.storageKey, {
    expiresIn: PRESIGN_GET_TTL,
    contentType: row.mimeType,
    contentDisposition: disposition,
  });

  return { redirectUrl: presigned.url, ttl: PRESIGN_GET_TTL };
}

async function readLegacyFile(row, download) {
  const legacyPath = row.legacyPath;
  if (!legacyPath) throw new StorageError('Not found', 404);
  console.warn(`[storage] legacy fallback read: ${row.id} -> ${legacyPath}`);
  const buffer = await readFile(legacyPath);
  return {
    legacy: true,
    buffer,
    mimeType: row.mimeType,
    originalName: row.originalName,
    download,
  };
}

export async function softDeleteFile({ user, fileId }) {
  if (!user) throw new StorageError('Unauthorized', 401);
  const row = await prisma.storedFile.findUnique({ where: { id: fileId } });
  if (!row || row.status === 'DELETED') throw new StorageError('Not found', 404);
  if (row.ownerUserId !== user.id && user.accountType !== 'GLOBAL_ADMIN') {
    throw new StorageError('Not found', 404);
  }

  const purgeAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.storedFile.update({
    where: { id: fileId },
    data: { status: 'DELETED', deletedAt: new Date(), purgeAfter },
  });
  return { ok: true };
}

function sanitizeFileResponse(row) {
  return {
    id: row.id,
    module: row.module,
    entityType: row.entityType,
    entityId: row.entityId,
    originalName: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    status: row.status,
    visibility: row.visibility,
    createdAt: row.createdAt,
    availableAt: row.availableAt,
  };
}

export class StorageError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
