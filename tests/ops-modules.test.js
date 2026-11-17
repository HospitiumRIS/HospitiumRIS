import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModule, normalizeRoute, actionFromMethod, OPS_MODULES } from '../src/lib/ops/modules.js';

describe('resolveModule', () => {
  it('maps researcher and institution pages to modules', () => {
    assert.equal(resolveModule('/researcher/publications/manage'), 'publications');
    assert.equal(resolveModule('/institution/proposals/review'), 'projects');
    assert.equal(resolveModule('/researcher/ethics/applications'), 'ethics');
    assert.equal(resolveModule('/institution/clinical-trials/registry'), 'clinical_trials');
    assert.equal(resolveModule('/researcher/image-integrity/collections'), 'image_integrity');
    assert.equal(resolveModule('/institution/training/abc'), 'training');
    assert.equal(resolveModule('/institution/analytics/funding'), 'analytics');
    assert.equal(resolveModule('/institution/users/roles'), 'administration');
    assert.equal(resolveModule('/institution-admin/settings'), 'institution_admin');
    assert.equal(resolveModule('/researcher'), 'dashboard');
  });

  it('maps API paths to modules', () => {
    assert.equal(resolveModule('/api/manuscripts/abc/versions'), 'publications');
    assert.equal(resolveModule('/api/proposals/123'), 'projects');
    assert.equal(resolveModule('/api/ethics/applications'), 'ethics');
    assert.equal(resolveModule('/api/grants/applications'), 'grants');
    assert.equal(resolveModule('/api/ai/summarize'), 'ai_assistant');
  });

  it('never tracks auth, telemetry, global admin or public pages', () => {
    for (const path of ['/api/auth/login', '/api/telemetry/usage', '/api/global-admin/audit', '/global-admin/operations', '/login', '/about', '/', 'not-a-path', null]) {
      assert.equal(resolveModule(path), null, String(path));
    }
  });

  it('ignores query strings', () => {
    assert.equal(resolveModule('/researcher/publications?email=a@b.c'), 'publications');
  });

  it('only returns known module keys', () => {
    const keys = new Set(OPS_MODULES.map((m) => m.key));
    for (const path of ['/researcher/x', '/api/whatever', '/foundation/donations', '/api/network']) {
      assert.ok(keys.has(resolveModule(path)), path);
    }
  });
});

describe('normalizeRoute', () => {
  it('replaces record identifiers with :id', () => {
    assert.equal(normalizeRoute('/researcher/projects/clx1abc2def3ghi4jkl5mno6'), '/researcher/projects/:id');
    assert.equal(normalizeRoute('/api/proposals/42/reviews'), '/api/proposals/:id/reviews');
    assert.equal(normalizeRoute('/x/550e8400-e29b-41d4-a716-446655440000'), '/x/:id');
    assert.equal(normalizeRoute('/api/researcher/profile/0000-0002-1825-0097'), '/api/researcher/profile/:id');
    assert.equal(normalizeRoute('/api/users/someone%40example.org'), '/api/users/:id');
  });

  it('keeps readable route words', () => {
    assert.equal(normalizeRoute('/api/institution/proposal-review-pipeline'), '/api/institution/proposal-review-pipeline');
    assert.equal(normalizeRoute('/researcher/training/certificates'), '/researcher/training/certificates');
  });

  it('drops query strings and fragments', () => {
    assert.equal(normalizeRoute('/researcher/publications?q=secret#top'), '/researcher/publications');
  });
});

describe('actionFromMethod', () => {
  it('maps HTTP methods to actions', () => {
    assert.equal(actionFromMethod('POST'), 'CREATE');
    assert.equal(actionFromMethod('put'), 'UPDATE');
    assert.equal(actionFromMethod('PATCH'), 'UPDATE');
    assert.equal(actionFromMethod('DELETE'), 'DELETE');
    assert.equal(actionFromMethod('GET'), null);
  });
});
