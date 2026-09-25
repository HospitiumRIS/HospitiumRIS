import { fileTypeFromBuffer } from 'file-type';

/**
 * Detect MIME type from the first bytes of a file (magic-byte sniff).
 * @param {Buffer|Uint8Array} buffer - At least 4100 bytes recommended; smaller buffers may fail.
 * @returns {Promise<string|null>}
 */
export async function sniffMimeType(buffer) {
  if (!buffer || buffer.length === 0) return null;
  const slice = buffer.subarray(0, Math.min(buffer.length, 4100));
  const detected = await fileTypeFromBuffer(slice);
  return detected?.mime || null;
}
