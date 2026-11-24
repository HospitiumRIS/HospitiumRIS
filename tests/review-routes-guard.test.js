import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression guard for #6 (audit G-1): every handler in these routes must check the
// session before touching data, and none may take the acting user from the request.
const ROUTES = {
  'src/app/api/proposals/[id]/review/route.js': 'proposalReviewContext',
  'src/app/api/proposals/[id]/review-stage/route.js': 'proposalReviewContext',
  'src/app/api/proposals/[id]/review-status/route.js': 'proposalReviewContext',
  'src/app/api/proposals/[id]/submit/route.js': 'proposalReviewContext',
  'src/app/api/proposals/[id]/link-ethics/route.js': 'proposalReviewContext',
  'src/app/api/proposals/[id]/link-ethics/[ethicsId]/route.js': 'proposalReviewContext',
  'src/app/api/ethics/applications/route.js': 'sessionUser',
  'src/app/api/ethics/applications/[id]/review/route.js': 'sessionUser',
  'src/app/api/ethics/applications/[id]/submit/route.js': 'sessionUser',
  'src/app/api/grants/applications/route.js': 'sessionUser',
  'src/app/api/grants/applications/[id]/route.js': 'ownApplication(request',
  'src/app/api/grants/applications/[id]/communications/route.js': 'ownApplication(request',
  'src/app/api/manuscripts/[manuscriptId]/citations/route.js': 'manuscriptMember',
  'src/app/api/manuscripts/[manuscriptId]/citations/[citationId]/route.js': 'manuscriptMember',
  'src/app/api/publications/citations/route.js': 'sessionUser',
};

const handlers = (src) => (src.match(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g) || []).length;

describe('review and approval routes are guarded (#6)', () => {
  for (const [file, guard] of Object.entries(ROUTES)) {
    it(file, () => {
      const src = readFileSync(file, 'utf8');
      const calls = src.split(guard).length - 1 - (src.includes(`async function ${guard.replace('(request', '')}`) ? 1 : 0);
      assert.ok(calls >= handlers(src), `${handlers(src)} handlers but ${calls} guard call(s)`);
      assert.doesNotMatch(src, /new PrismaClient\(/, 'uses its own PrismaClient');
      assert.doesNotMatch(src, /dev-user/, 'hardcoded development user');
      assert.doesNotMatch(src, /reviewerId:\s*(data|body)\./, 'reviewer taken from the request');
      assert.doesNotMatch(src, /reviewerName:\s*(reviewer|data\.|body\.)/, 'reviewer name taken from the request');
      assert.doesNotMatch(src, /userId:\s*data\.userId/, 'owner taken from the request');
      assert.doesNotMatch(src, /const \{ id \} = params;/, 'params read without await');
    });
  }
});
