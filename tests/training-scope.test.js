import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_TRAININGS_WHERE,
  canRegisterForTraining,
  canSeeMaterial,
  shapeTrainingForViewer,
  canViewTraining,
  isOwningTrainingAdmin,
  trainingAdminListWhere,
  trainingUserInstitutionId,
  trainingVisibilityWhere,
} from '../src/lib/training-scope.js';

// Two institutions, A and B, each with a researcher and a training admin.
const A = 'inst-a';
const B = 'inst-b';
const researcherA = { id: 'ra', accountType: 'RESEARCHER', secondaryInstitutionId: A };
const researcherB = { id: 'rb', accountType: 'RESEARCHER', secondaryInstitutionId: B };
const unlinked = { id: 'ru', accountType: 'RESEARCHER', secondaryInstitutionId: null };
const adminA = { id: 'aa', accountType: 'RESEARCH_ADMIN', secondaryInstitutionId: A };
const instAdminB = { id: 'ib', accountType: 'INSTITUTION_ADMIN', institution: { id: B } };
const globalAdmin = { id: 'ga', accountType: 'GLOBAL_ADMIN' };

const privateB = { id: 'tb', institutionId: B, status: 'PUBLISHED', openToOtherInstitutions: false };
const openB = { id: 'tob', institutionId: B, status: 'PUBLISHED', openToOtherInstitutions: true };
const draftOpenB = { id: 'tdb', institutionId: B, status: 'DRAFT', openToOtherInstitutions: true };
const publishedA = { id: 'ta', institutionId: A, status: 'PUBLISHED', openToOtherInstitutions: false };
const draftA = { id: 'tda', institutionId: A, status: 'DRAFT', openToOtherInstitutions: false };

describe('trainingUserInstitutionId', () => {
  it('prefers the verified link, then the owned institution', () => {
    assert.equal(trainingUserInstitutionId(researcherA), A);
    assert.equal(trainingUserInstitutionId(instAdminB), B);
    assert.equal(trainingUserInstitutionId(unlinked), null);
    assert.equal(trainingUserInstitutionId(null), null);
  });
});

describe('canViewTraining', () => {
  it("hides another institution's private training", () => {
    assert.equal(canViewTraining(researcherA, privateB), false);
    assert.equal(canViewTraining(adminA, privateB, { institutionId: A }), false);
  });

  it("shows another institution's published training that is open", () => {
    assert.equal(canViewTraining(researcherA, openB), true);
    assert.equal(canViewTraining(unlinked, openB), true);
  });

  it('never shows drafts across institutions, even when open', () => {
    assert.equal(canViewTraining(researcherA, draftOpenB), false);
  });

  it('shows own published trainings; drafts only to own admins', () => {
    assert.equal(canViewTraining(researcherA, publishedA), true);
    assert.equal(canViewTraining(researcherA, draftA), false);
    assert.equal(canViewTraining(adminA, draftA, { institutionId: A }), true);
  });

  it('lets B see its own private training', () => {
    assert.equal(canViewTraining(researcherB, privateB), true);
    assert.equal(canViewTraining(instAdminB, privateB, { institutionId: B }), true);
  });

  it('global admin sees everything; anonymous sees nothing', () => {
    assert.equal(canViewTraining(globalAdmin, draftA), true);
    assert.equal(canViewTraining(null, publishedA), false);
  });
});

describe('canRegisterForTraining', () => {
  it('requires a visible, published training', () => {
    assert.equal(canRegisterForTraining(researcherA, privateB), false);
    assert.equal(canRegisterForTraining(researcherA, openB), true);
    assert.equal(canRegisterForTraining(researcherA, publishedA), true);
    assert.equal(canRegisterForTraining(adminA, draftA, { institutionId: A }), false);
  });
});

describe('trainingVisibilityWhere', () => {
  it('researcher: own published OR shared catalogue', () => {
    assert.deepEqual(trainingVisibilityWhere(researcherA), {
      OR: [
        { institutionId: A, status: 'PUBLISHED' },
        { status: 'PUBLISHED', openToOtherInstitutions: true },
      ],
    });
  });

  it('admin: all own statuses OR shared catalogue', () => {
    assert.deepEqual(trainingVisibilityWhere(adminA, { institutionId: A }), {
      OR: [
        { institutionId: A },
        { status: 'PUBLISHED', openToOtherInstitutions: true },
      ],
    });
  });

  it('unlinked user: shared catalogue only; anonymous: nothing; global: everything', () => {
    assert.deepEqual(trainingVisibilityWhere(unlinked), { status: 'PUBLISHED', openToOtherInstitutions: true });
    assert.deepEqual(trainingVisibilityWhere(null), NO_TRAININGS_WHERE);
    assert.deepEqual(trainingVisibilityWhere(globalAdmin), {});
  });
});

describe('trainingAdminListWhere', () => {
  it("limits admins to their own institution, never another's", () => {
    assert.deepEqual(trainingAdminListWhere(adminA, { institutionId: A }), { institutionId: A });
    assert.deepEqual(trainingAdminListWhere(instAdminB, { institutionId: B }), { institutionId: B });
  });

  it('fails closed without an institution or for non-admins', () => {
    assert.deepEqual(trainingAdminListWhere(adminA, {}), NO_TRAININGS_WHERE);
    assert.deepEqual(trainingAdminListWhere(researcherA, { institutionId: A }), NO_TRAININGS_WHERE);
    assert.deepEqual(trainingAdminListWhere(globalAdmin), {});
  });
});

describe('isOwningTrainingAdmin', () => {
  it("only the owning institution's admins manage a training", () => {
    assert.equal(isOwningTrainingAdmin(adminA, publishedA, { institutionId: A }), true);
    assert.equal(isOwningTrainingAdmin(adminA, openB, { institutionId: A }), false);
    assert.equal(isOwningTrainingAdmin(researcherB, privateB, { institutionId: B }), false);
  });
});

describe('registrants keep access', () => {
  const completedB = { id: 'tcb', institutionId: B, status: 'COMPLETED', openToOtherInstitutions: false };
  const completedA = { id: 'tca', institutionId: A, status: 'COMPLETED', openToOtherInstitutions: false };

  it('a registrant can still view a completed or no-longer-shared training', () => {
    assert.equal(canViewTraining(researcherA, completedA), false);
    assert.equal(canViewTraining(researcherA, completedA, { hasRegistration: true }), true);
    assert.equal(canViewTraining(researcherA, completedB, { hasRegistration: true }), true);
  });

  it('a registration never unlocks drafts or new registrations', () => {
    assert.equal(canViewTraining(researcherA, draftA, { hasRegistration: true }), false);
    assert.equal(canRegisterForTraining(researcherA, privateB, { hasRegistration: true }), false);
  });
});

describe('canSeeMaterial (#89)', () => {
  const pub = { accessLevel: 'PUBLIC' };
  const reg = { accessLevel: 'REGISTERED_ONLY' };

  it('public materials are visible to any viewer of the training', () => {
    assert.equal(canSeeMaterial(pub, { isAdmin: false, registration: null }), true);
  });

  it('registered-only needs an active registration', () => {
    assert.equal(canSeeMaterial(reg, { isAdmin: false, registration: null }), false);
    assert.equal(canSeeMaterial(reg, { isAdmin: false, registration: { status: 'CANCELLED' } }), false);
    assert.equal(canSeeMaterial(reg, { isAdmin: false, registration: { status: 'REGISTERED' } }), true);
    assert.equal(canSeeMaterial(reg, { isAdmin: false, registration: { status: 'COMPLETED' } }), true);
  });

  it('owning admins see everything', () => {
    assert.equal(canSeeMaterial(reg, { isAdmin: true, registration: null }), true);
  });
});

describe('shapeTrainingForViewer (#89)', () => {
  const training = {
    id: 't', institutionId: A, status: 'PUBLISHED', maxParticipants: 10,
    materials: [{ id: 'm1', accessLevel: 'PUBLIC' }, { id: 'm2', accessLevel: 'REGISTERED_ONLY' }],
    registrations: [
      { id: 'r1', userId: 'ra', status: 'REGISTERED', user: { email: 'ra@a.ac.ke' } },
      { id: 'r2', userId: 'other', status: 'COMPLETED', user: { email: 'other@a.ac.ke' } },
      { id: 'r3', userId: 'gone', status: 'CANCELLED', user: { email: 'gone@a.ac.ke' } },
    ],
    _count: { registrations: 3, modules: 0, materials: 2 },
  };

  it("a researcher never receives other participants' data", () => {
    const shaped = shapeTrainingForViewer(training, researcherA, { isAdmin: false });
    assert.equal(shaped.registrations, undefined);
    assert.equal(JSON.stringify(shaped).includes('other@a.ac.ke'), false);
    assert.equal(shaped.userRegistration.id, 'r1');
    assert.equal(shaped.isRegistered, true);
    assert.equal(shaped.registrationCount, 2);
    assert.equal(shaped.remainingSlots, 8);
    assert.equal(shaped._count.registrations, 2);
    assert.deepEqual(shaped.materials.map((m) => m.id), ['m1', 'm2']);
  });

  it('a non-registrant sees public materials only', () => {
    const shaped = shapeTrainingForViewer(training, researcherB, { isAdmin: false });
    assert.equal(shaped.userRegistration, null);
    assert.equal(shaped.isRegistered, false);
    assert.deepEqual(shaped.materials.map((m) => m.id), ['m1']);
  });

  it('a cancelled registrant is not registered and loses registered-only materials', () => {
    const shaped = shapeTrainingForViewer(training, { id: 'gone', accountType: 'RESEARCHER', secondaryInstitutionId: A }, { isAdmin: false });
    assert.equal(shaped.isRegistered, false);
    assert.deepEqual(shaped.materials.map((m) => m.id), ['m1']);
  });

  it('the owning admin gets the roster and all materials', () => {
    const shaped = shapeTrainingForViewer(training, adminA, { isAdmin: true });
    assert.equal(shaped.registrations.length, 3);
    assert.equal(shaped.materials.length, 2);
  });
});
