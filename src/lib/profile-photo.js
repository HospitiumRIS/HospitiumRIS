import prisma from './prisma.js';
import { uploadServerSide, softDeleteFile } from './storage/files-service.js';
import { parseStoredFileUrl } from './storage/parse-file-url.js';

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Upload a profile photo through the standard storage pipeline (R2 in production):
 * StoredFile row + magic-byte sniffing + size check, served at /api/files/:id.
 * Replaces (and soft-deletes) any previous photo.
 * @returns {Promise<string>} the new avatarUrl
 */
export async function saveProfilePhoto(user, file) {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    throw new Error('Photo must be a PNG, JPG, or WebP image');
  }
  if (!file.size || file.size > PROFILE_PHOTO_MAX_BYTES) {
    throw new Error('Photo must be 5 MB or smaller');
  }

  const stored = await uploadServerSide({
    user,
    module: 'PROFILE_PHOTO',
    entityType: 'User',
    entityId: user.id,
    file,
  });
  const avatarUrl = `/api/files/${stored.id}`;

  const previous = user.avatarUrl;
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
  if (previous && previous !== avatarUrl) {
    await deleteProfilePhotoFile(previous, user);
  }
  return avatarUrl;
}

export async function removeProfilePhoto(user) {
  if (user.avatarUrl) {
    await deleteProfilePhotoFile(user.avatarUrl, user);
  }
  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
}

export async function deleteProfilePhotoFile(avatarUrl, user) {
  const fileId = parseStoredFileUrl(avatarUrl);
  if (!fileId) return;
  try {
    await softDeleteFile({ user, fileId });
  } catch {
    // already deleted / missing
  }
}

/** Soft-delete every profile photo a user owns (used by anonymisation / permanent delete). */
export async function purgeProfilePhotos(tx, userId) {
  await tx.storedFile.updateMany({
    where: { ownerUserId: userId, module: 'PROFILE_PHOTO', status: { not: 'DELETED' } },
    data: { status: 'DELETED', deletedAt: new Date(), purgeAfter: new Date() },
  });
}
