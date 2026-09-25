import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProposalDocument,
  buildProposalFileMeta,
  canAccessProposal,
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
