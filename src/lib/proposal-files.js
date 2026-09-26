import path from 'path';
import { mkdir, writeFile, readFile, access, unlink } from 'fs/promises';
import { sanitizeFileName } from './sanitize-file-name.js';
import { uploadServerSide, softDeleteFile } from './storage/files-service.js';
import { readStoredFileBytes } from './storage/read.js';
import { parseStoredFileUrl } from './storage/parse-file-url.js';
import { resolveTenantId } from './tenant.js';
import prisma from './prisma.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'proposals');
const DELIVERABLES_DIR = path.join(UPLOADS_DIR, 'deliverables');
const MILESTONES_DIR = path.join(UPLOADS_DIR, 'milestones');

export const PROPOSAL_DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;
export const PROPOSAL_DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'zip',
];

const PREFIX_TO_MODULE = {
  ethics: 'PROPOSAL_DOCUMENT',
  dmp: 'PROPOSAL_DOCUMENT',
  other: 'PROPOSAL_DOCUMENT',
  budget: 'PROPOSAL_DOCUMENT',
  deliverable: 'PROPOSAL_DELIVERABLE',
  milestone: 'PROPOSAL_MILESTONE',
};

function getExtension(fileName) {
  const parts = String(fileName).split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function useProposalStorage() {
  return process.env.STORAGE_CUTOVER_PROPOSALS === 'true' || process.env.STORAGE_DRIVER === 'r2';
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

function legacyDirForPrefix(prefix) {
  if (prefix === 'deliverable') return DELIVERABLES_DIR;
  if (prefix === 'milestone') return MILESTONES_DIR;
  return UPLOADS_DIR;
}

function legacyUrlForPrefix(prefix, fileName) {
  if (prefix === 'deliverable') return `/uploads/proposals/deliverables/${fileName}`;
  if (prefix === 'milestone') return `/uploads/proposals/milestones/${fileName}`;
  return `/uploads/proposals/${fileName}`;
}

export function buildProposalFileMeta(prefix, file) {
  const safeName = sanitizeFileName(file.name || 'document');
  const fileName = `${prefix}_${Date.now()}_${safeName}`;
  return {
    originalName: file.name,
    fileName,
    url: legacyUrlForPrefix(prefix, fileName),
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

export function proposalDocumentDisplayUrl(doc) {
  if (!doc) return null;
  if (doc.url) return doc.url;
  if (doc.fileId) return `/api/files/${doc.fileId}`;
  if (doc.fileName) return `/uploads/proposals/${doc.fileName}`;
  return null;
}

export function parseProposalFileReference(docOrUrl) {
  const url = typeof docOrUrl === 'string' ? docOrUrl : docOrUrl?.url;
  const fileId = docOrUrl?.fileId || parseStoredFileUrl(url);
  if (fileId) return { fileId };

  const fileName = docOrUrl?.fileName;
  if (fileName) {
    if (url?.includes('/deliverables/')) {
      return { legacyPath: path.join(DELIVERABLES_DIR, fileName) };
    }
    if (url?.includes('/milestones/')) {
      return { legacyPath: path.join(MILESTONES_DIR, fileName) };
    }
    return { legacyPath: path.join(UPLOADS_DIR, fileName) };
  }

  if (url?.startsWith('/uploads/proposals/deliverables/')) {
    return { legacyPath: path.join(process.cwd(), url.replace(/^\//, '')) };
  }
  if (url?.startsWith('/uploads/proposals/milestones/')) {
    return { legacyPath: path.join(process.cwd(), url.replace(/^\//, '')) };
  }
  if (url?.startsWith('/uploads/proposals/')) {
    return { legacyPath: path.join(process.cwd(), url.replace(/^\//, '')) };
  }

  return null;
}

/** @deprecated use parseProposalFileReference */
export function resolveProposalFilePath(fileInfo) {
  const parsed = parseProposalFileReference(fileInfo);
  return parsed?.legacyPath || null;
}

export async function resolveProposalTenantId(proposal) {
  if (!proposal?.principalInvestigatorOrcid) return resolveTenantId(null);
  const pi = await prisma.user.findFirst({
    where: { orcidId: proposal.principalInvestigatorOrcid },
    select: {
      secondaryInstitutionId: true,
      institution: { select: { id: true } },
    },
  });
  return resolveTenantId(pi);
}

/**
 * @param {string} prefix - ethics | dmp | other | deliverable | milestone
 */
export async function saveProposalDocument(prefix, file, options = {}) {
  const validation = validateProposalDocument(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const meta = buildProposalFileMeta(prefix, file);
  const module = PREFIX_TO_MODULE[prefix] || 'PROPOSAL_DOCUMENT';

  if (useProposalStorage() && options.user && options.proposalId) {
    const stored = await uploadServerSide({
      user: options.user,
      module,
      entityType: 'Proposal',
      entityId: options.proposalId,
      file,
      entityTenantId: options.entityTenantId ?? (await resolveProposalTenantId({ principalInvestigatorOrcid: options.user.orcidId })),
    });
    return {
      ...meta,
      url: `/api/files/${stored.id}`,
      fileId: stored.id,
      size: stored.sizeBytes,
    };
  }

  const dir = legacyDirForPrefix(prefix);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, meta.fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return meta;
}

export async function readProposalDocument(fileInfo, user) {
  const parsed = parseProposalFileReference(fileInfo);
  if (!parsed) return null;

  if (parsed.fileId && user) {
    const result = await readStoredFileBytes(user, parsed.fileId);
    if (!result) return null;
    return { buffer: result.buffer, mimeType: result.mimeType };
  }

  if (parsed.legacyPath) {
    await access(parsed.legacyPath);
    const buffer = await readFile(parsed.legacyPath);
    return {
      buffer,
      mimeType: fileInfo?.mimeType || 'application/octet-stream',
    };
  }

  return null;
}

export async function deleteProposalDocument(fileInfo, user) {
  const parsed = parseProposalFileReference(fileInfo);
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

/** Check whether a user may read or modify a proposal. */
export function canAccessProposal(user, proposal) {
  if (!user || !proposal) return false;
  if (user.accountType === 'GLOBAL_ADMIN') return true;
  if (user.accountType === 'INSTITUTION_ADMIN' || user.accountType === 'RESEARCH_ADMIN') {
    return true;
  }
  if (user.accountType === 'RESEARCHER' && user.orcidId && proposal.principalInvestigatorOrcid) {
    return proposal.principalInvestigatorOrcid === user.orcidId;
  }
  return false;
}
