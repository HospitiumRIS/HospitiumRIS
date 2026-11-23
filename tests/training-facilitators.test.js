import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  certificateFacilitators,
  facilitatedSessionIds,
  facilitatesSession,
  facilitatorsForSession,
  validateFacilitator,
} from '../src/lib/training-facilitators.js';

describe('validateFacilitator', () => {
  it('needs a staff member or a guest name', () => {
    assert.equal(validateFacilitator({}).ok, false);
    assert.equal(validateFacilitator({ userId: 'u1' }).ok, true);
    assert.equal(validateFacilitator({ name: 'Dr Guest', email: 'bad' }).ok, false);
    const guest = validateFacilitator({ name: ' Dr Guest ', email: 'g@x.org', role: 'GUEST' });
    assert.equal(guest.data.name, 'Dr Guest');
    assert.equal(guest.data.showOnCertificate, true);
  });
  it('rejects unknown roles and sessions of other trainings', () => {
    assert.equal(validateFacilitator({ userId: 'u1', role: 'BOSS' }).ok, false);
    assert.equal(validateFacilitator({ userId: 'u1', sessionId: 's9' }, { sessionIds: ['s1'] }).ok, false);
    assert.equal(validateFacilitator({ userId: 'u1', sessionId: 's1' }, { sessionIds: ['s1'] }).ok, true);
  });
  it('an internal facilitator keeps no external name', () => {
    assert.equal(validateFacilitator({ userId: 'u1', name: 'X' }).data.name, null);
  });
});

describe('facilitator access (#104)', () => {
  const facilitators = [
    { userId: 'anna', sessionId: 's1', role: 'LEAD' },
    { userId: 'ben', sessionId: null, role: 'CO_FACILITATOR' },
    { userId: null, name: 'Guest', sessionId: 's2', role: 'GUEST' },
  ];
  const sessions = [{ id: 's1' }, { id: 's2' }, { id: 's3' }];
  it('reaches only assigned sessions', () => {
    assert.equal(facilitatesSession(facilitators, 'anna', 's1'), true);
    assert.equal(facilitatesSession(facilitators, 'anna', 's2'), false);
    assert.deepEqual(facilitatedSessionIds(facilitators, 'anna', sessions), ['s1']);
  });
  it('a whole-training facilitator covers every session of that training only', () => {
    assert.deepEqual(facilitatedSessionIds(facilitators, 'ben', sessions), ['s1', 's2', 's3']);
    // Facilitators of another training are a different list: nobody here.
    assert.equal(facilitatesSession([], 'ben', 's1'), false);
  });
  it('strangers and missing users get nothing', () => {
    assert.equal(facilitatesSession(facilitators, 'eve', 's1'), false);
    assert.equal(facilitatesSession(facilitators, null, 's2'), false);
    assert.deepEqual(facilitatedSessionIds(facilitators, 'eve', sessions), []);
  });
});

describe('display and certificates', () => {
  const list = [
    { role: 'GUEST', name: 'Zed Guest', sessionId: 's2' },
    { role: 'CO_FACILITATOR', user: { givenName: 'Ben', familyName: 'Otieno' }, sessionId: null },
    { role: 'LEAD', user: { givenName: 'Anna', familyName: 'Mwangi' }, sessionId: 's1' },
    { role: 'LEAD', user: { givenName: 'Anna', familyName: 'Mwangi' }, sessionId: 's2' },
    { role: 'GUEST', name: 'Hidden', showOnCertificate: false },
  ];
  it('session details: whole-training plus own, lead first', () => {
    assert.deepEqual(facilitatorsForSession(list, 's1').map((f) => f.role), ['LEAD', 'CO_FACILITATOR', 'GUEST']);
  });
  it('certificate merge field: lead first, each once, respects the flag', () => {
    assert.equal(certificateFacilitators(list), 'Anna Mwangi, Ben Otieno, Zed Guest');
  });
});
