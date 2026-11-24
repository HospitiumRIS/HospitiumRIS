import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Smoke tests for every /api/institution route (#21):
 *  1. each exported handler calls an access guard (auto-review is the known gap, #9);
 *  2. the top-level keys of every `where`, `select` and `include` passed to
 *     `prisma.<model>.<method>(...)` exist on that model in schema.prisma, the class of
 *     mistake that broke the ethics register (`user`, `applicationNumber`) and caused the
 *     24 Nov outage (`User.department`).
 */

const ROOT = 'src/app/api/institution';
const KNOWN_UNGUARDED = /\/auto-review\//; // #9
const GUARDS = /require[A-Z][A-Za-z]+\(|getAuthenticatedUser\(/;

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : f === 'route.js' ? [p] : [];
});
const files = walk(ROOT);

// ---- schema: model -> field names --------------------------------------------------
const schema = readFileSync('prisma/schema.prisma', 'utf8');
const models = new Map();
for (const m of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
  const fields = m[2].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//') && !l.startsWith('@@')).map((l) => l.split(/\s+/)[0]);
  models.set(m[1].charAt(0).toLowerCase() + m[1].slice(1), new Set(fields));
}
const LOGICAL = new Set(['AND', 'OR', 'NOT', '_count', '_all']);

/** Text of the balanced `{...}` starting at index i. */
function block(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j += 1) {
    if (src[j] === '{') depth += 1;
    else if (src[j] === '}') { depth -= 1; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}
/** Top-level keys of an object literal (skips spreads and computed keys). */
function topKeys(obj) {
  const keys = [];
  let depth = 0;
  let token = '';
  for (let j = 1; j < obj.length - 1; j += 1) {
    const c = obj[j];
    if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) depth -= 1;
    if (depth === 0 && c === ':') {
      const k = token.trim().split(/[\s,]+/).pop();
      if (/^[A-Za-z_]\w*$/.test(k)) keys.push(k);
      token = '';
    } else if (depth === 0 && c === ',') token = '';
    else if (depth === 0) token += c;
  }
  return keys;
}
/** For each prisma call: { model, clause, keys } for its top-level where/select/include objects. */
function prismaClauses(src) {
  const out = [];
  for (const m of src.matchAll(/prisma\.(\w+)\.(findMany|findFirst|findUnique|count|update|updateMany|deleteMany|aggregate|groupBy)\(\s*\{/g)) {
    const args = block(src, m.index + m[0].length - 1);
    if (!args) continue;
    for (const clause of ['where', 'select', 'include']) {
      for (const c of args.matchAll(new RegExp(`(?:^|[\\s,{])${clause}:\\s*\\{`, 'g'))) {
        // only clauses at the top level of the call's argument object
        const before = args.slice(0, c.index + 1);
        const depth = (before.match(/\{/g) || []).length - (before.match(/\}/g) || []).length;
        if (depth !== 1) continue;
        const obj = block(args, c.index + c[0].length - 1);
        if (obj) out.push({ model: m[1], clause, keys: topKeys(obj) });
      }
    }
  }
  return out;
}

describe('every /api/institution route has an access guard', () => {
  for (const file of files) {
    it(file.replace(`${ROOT}/`, ''), { skip: KNOWN_UNGUARDED.test(file) ? 'auto-review: no guard yet (#9)' : false }, () => {
      const src = readFileSync(file, 'utf8');
      const handlers = (src.match(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g) || []).length;
      assert.ok(handlers > 0, 'no handlers');
      assert.match(src, GUARDS, 'no access guard');
    });
  }
});

describe('Prisma fields used by /api/institution routes exist in the schema', () => {
  for (const file of files) {
    const clauses = prismaClauses(readFileSync(file, 'utf8'));
    if (!clauses.length) continue;
    it(file.replace(`${ROOT}/`, ''), () => {
      const problems = [];
      for (const { model, clause, keys } of clauses) {
        const fields = models.get(model);
        if (!fields) { problems.push(`unknown model prisma.${model}`); continue; }
        for (const k of keys) if (!fields.has(k) && !LOGICAL.has(k)) problems.push(`${model}.${clause}.${k}`);
      }
      assert.deepEqual(problems, []);
    });
  }
});

describe('the checker itself', () => {
  it('flags the original ethics query', () => {
    const bad = "prisma.ethicsApplication.findMany({ where: { user: memberWhere }, include: { user: { select: { id: true } } } })";
    const c = prismaClauses(bad);
    assert.deepEqual(c.map((x) => `${x.clause}:${x.keys.join(',')}`), ['where:user', 'include:user']);
    assert.equal(models.get('ethicsApplication').has('user'), false);
  });
  it('flags User.department', () => {
    const c = prismaClauses('prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, department: true } })');
    assert.deepEqual(c.find((x) => x.clause === 'select').keys, ['id', 'department']);
    assert.equal(models.get('user').has('department'), false);
  });
});
