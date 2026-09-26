import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProposalDocument,
  buildProposalFileMeta,
  canAccessProposal,
  useProposalStorage,
  proposalDocumentDisplayUrl,
} from '../src/lib/proposal-files.js';

describe('validateProposalDocument', () => {
  it('rejects path traversal names but validates extension from basename', () => {
    const result = validateProposalDocument({ name: '../../evil.exe', size: 100 });
    assert.equal(result.ok, false);
  });

  it('accepts allowed types', () => {
    const result = validateProposalDocument({ name: 'report.pdf', size: 1024 });
    assert.equal(result.ok, true);
  });

  it('rejects oversize files', () => {
    const result = validateProposalDocument({ name: 'big.pdf', size: 30 * 1024 * 1024 });
    assert.equal(result.ok, false);
  });
});

describe('buildProposalFileMeta', () => {
  it('does not include absolute filePath', () => {
    const meta = buildProposalFileMeta('ethics', { name: '../../x.pdf', size: 1, type: 'application/pdf' });
    assert.ok(!meta.filePath);
    assert.ok(meta.url.startsWith('/uploads/proposals/'));
    assert.ok(!meta.fileName.includes('..'));
  });
});

describe('useProposalStorage', () => {
  const orig = { ...process.env };

  afterEach(() => {
    process.env = { ...orig };
  });

  it('enables when R2 driver set', () => {
    process.env.STORAGE_DRIVER = 'r2';
    assert.equal(useProposalStorage(), true);
  });
});

describe('proposalDocumentDisplayUrl', () => {
  it('prefers stored url', () => {
    assert.equal(proposalDocumentDisplayUrl({ url: '/api/files/abc' }), '/api/files/abc');
  });

  it('falls back to fileId', () => {
    assert.equal(proposalDocumentDisplayUrl({ fileId: 'abc' }), '/api/files/abc');
  });
});

describe('canAccessProposal', () => {
  const proposal = { principalInvestigatorOrcid: '0000-0001-2345-6789' };

  it('allows matching researcher', () => {
    assert.equal(
      canAccessProposal({ accountType: 'RESEARCHER', orcidId: '0000-0001-2345-6789' }, proposal),
      true
    );
  });

  it('denies other researchers', () => {
    assert.equal(
      canAccessProposal({ accountType: 'RESEARCHER', orcidId: '0000-0000-0000-0001' }, proposal),
      false
    );
  });
});
