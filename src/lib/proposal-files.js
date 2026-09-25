import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { sanitizeFileName } from './sanitize-file-name.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'proposals');

export const PROPOSAL_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;
export const PROPOSAL_DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'zip',
];

function getExtension(fileName) {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function validateProposalDocument(file) {
  if (!file || !file.size) {
    return { ok: false, error: 'Empty file' };
  }
  if (file.size > PROPOSAL_DOCUMENT_MAX_BYTES) {
    return { ok: false, error: `File exceeds ${PROPOSAL_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB limit` };
  }
  const ext = getExtension(file.name);
  if (!PROPOSAL_DOCUMENT_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `File type .${ext || '?'} is not allowed` };
  }
  return { ok: true, ext };
}

/**
 * Build a safe stored file name and public URL (no absolute server paths).
 */
export function buildProposalFileMeta(prefix, file) {
  const safeName = sanitizeFileName(file.name || 'document');
  const fileName = `${prefix}_${Date.now()}_${safeName}`;
  const url = `/uploads/proposals/${fileName}`;
  return {
    originalName: file.name,
    fileName,
    url,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * Resolve disk path from stored metadata (supports legacy absolute filePath).
 */
export function resolveProposalFilePath(fileInfo) {
  if (fileInfo?.filePath) return fileInfo.filePath;
  if (fileInfo?.url?.startsWith('/uploads/')) {
    return path.join(process.cwd(), fileInfo.url.replace(/^\//, ''));
  }
  if (fileInfo?.fileName) {
    return path.join(process.cwd(), 'uploads', 'proposals', fileInfo.fileName);
  }
  return null;
}

export async function saveProposalDocument(prefix, file) {
  const validation = validateProposalDocument(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  await mkdir(UPLOADS_DIR, { recursive: true });
  const meta = buildProposalFileMeta(prefix, file);
  const filePath = path.join(UPLOADS_DIR, meta.fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));
  return meta;
}

/** Check whether a user may read or modify a proposal. */
export function canAccessProposal(user, proposal) {
  if (!user || !proposal) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  if (user.accountType === 'INSTITUTION_ADMIN' || user.accountType === 'RESEARCH_ADMIN') {
    return true; // tenant scoping added when Proposal.institutionId lands (Phase 2)
  }
  if (user.accountType === 'RESEARCHER' && user.orcidId && proposal.principalInvestigatorOrcid) {
    return proposal.principalInvestigatorOrcid === user.orcidId;
  }
  return false;
}
