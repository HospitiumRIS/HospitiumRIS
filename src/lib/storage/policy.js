/** @typedef {'ETHICS_DOCUMENT'|'ETHICS_CERTIFICATE'|'PROPOSAL_DOCUMENT'|'PROPOSAL_DELIVERABLE'|'PROPOSAL_MILESTONE'|'IMAGE_INTEGRITY'|'TRAINING_MATERIAL'|'TRAINING_CERTIFICATE'|'INSTITUTION_LOGO'} StoredFileModule */

/** @type {Record<string, { visibility: 'PRIVATE'|'PUBLIC', maxBytes: number, extensions: string[], maxFiles?: number }>} */
export const MODULE_POLICIES = {
  ETHICS_DOCUMENT: {
    visibility: 'PRIVATE',
    maxBytes: 25 * 1024 * 1024,
    extensions: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
  },
  ETHICS_CERTIFICATE: {
    visibility: 'PRIVATE',
    maxBytes: 15 * 1024 * 1024,
    extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
  },
  PROPOSAL_DOCUMENT: {
    visibility: 'PRIVATE',
    maxBytes: 25 * 1024 * 1024,
    extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'zip'],
  },
  PROPOSAL_DELIVERABLE: {
    visibility: 'PRIVATE',
    maxBytes: 25 * 1024 * 1024,
    extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'zip'],
  },
  PROPOSAL_MILESTONE: {
    visibility: 'PRIVATE',
    maxBytes: 25 * 1024 * 1024,
    extensions: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'zip'],
  },
  IMAGE_INTEGRITY: {
    visibility: 'PRIVATE',
    maxBytes: 25 * 1024 * 1024,
    extensions: ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'pdf', 'zip'],
    maxFiles: 25,
  },
  TRAINING_MATERIAL: {
    visibility: 'PRIVATE',
    maxBytes: 50 * 1024 * 1024,
    extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'],
  },
  TRAINING_CERTIFICATE: {
    visibility: 'PRIVATE',
    maxBytes: 5 * 1024 * 1024,
    extensions: ['pdf', 'png', 'jpg', 'jpeg'],
  },
  INSTITUTION_LOGO: {
    visibility: 'PUBLIC',
    maxBytes: 2 * 1024 * 1024,
    extensions: ['png', 'jpg', 'jpeg', 'webp'],
  },
};

export function getModulePolicy(module) {
  const policy = MODULE_POLICIES[module];
  if (!policy) throw new Error(`Unknown storage module: ${module}`);
  return policy;
}

export function validateUploadRequest({ module, fileName, sizeBytes }) {
  const policy = getModulePolicy(module);
  if (sizeBytes <= 0) return { ok: false, error: 'Empty file' };
  if (sizeBytes > policy.maxBytes) {
    return { ok: false, error: `File exceeds ${policy.maxBytes / (1024 * 1024)} MB limit` };
  }
  const parts = String(fileName || '').split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
  if (!policy.extensions.includes(ext)) {
    return { ok: false, error: `File type .${ext || '?'} is not allowed for ${module}` };
  }
  return { ok: true, ext, policy };
}

/** Reject dangerous MIME types after magic-byte sniff. */
export function isAllowedMimeType(module, mimeType) {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  const blocked = ['text/html', 'image/svg+xml', 'application/javascript', 'text/javascript'];
  if (blocked.some((b) => lower.startsWith(b))) return false;

  const policy = getModulePolicy(module);
  const allowedPrefixes = {
    pdf: ['application/pdf'],
    png: ['image/png'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    webp: ['image/webp'],
    gif: ['image/gif'],
    doc: ['application/msword'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    zip: ['application/zip', 'application/x-zip-compressed'],
  };

  for (const ext of policy.extensions) {
    const prefixes = allowedPrefixes[ext];
    if (prefixes?.some((p) => lower.startsWith(p))) return true;
  }

  // Allow generic octet-stream only for text/office modules where sniffing is weak
  if (lower === 'application/octet-stream' && ['txt', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'].some((e) => policy.extensions.includes(e))) {
    return true;
  }

  return false;
}
