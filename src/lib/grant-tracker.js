import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const GRANT_TRACKING_STATUSES = [
  'NOT_APPLIED',
  'APPLIED',
  'AWARDED',
  'REJECTED',
  'CANCELLED',
];

export const TERMINAL_GRANT_STATUSES = ['AWARDED', 'REJECTED', 'CANCELLED'];

const FOLLOW_UP_ACCOUNT_TYPES = ['RESEARCHER', 'RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

export function toMoneyNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toIsoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function serializeFollowUpUser(user) {
  if (!user) return null;
  const name = [user.givenName, user.familyName].filter(Boolean).join(' ').trim();
  return {
    id: user.id,
    givenName: user.givenName,
    familyName: user.familyName,
    name: name || user.email,
    email: user.email,
    accountType: user.accountType,
  };
}

export function serializeGrantTrackerProposal(proposal) {
  const requestedAmount = toMoneyNumber(proposal.grantRequestedAmount);
  const budgetAmount = toMoneyNumber(proposal.totalBudgetAmount);

  return {
    id: proposal.id,
    title: proposal.title,
    principalInvestigator: proposal.principalInvestigator,
    principalInvestigatorOrcid: proposal.principalInvestigatorOrcid,
    fundingSource: proposal.fundingSource || null,
    fundingInstitution: proposal.fundingInstitution || null,
    totalBudgetAmount: budgetAmount,
    grantTrackingStatus: proposal.grantTrackingStatus || 'NOT_APPLIED',
    grantRequestedAmount: requestedAmount,
    grantAppliedOn: toIsoDate(proposal.grantAppliedOn),
    grantDecisionOn: toIsoDate(proposal.grantDecisionOn),
    grantFollowUpUserId: proposal.grantFollowUpUserId || null,
    grantFollowUpUser: serializeFollowUpUser(proposal.grantFollowUpUser),
    grantTrackingNotes: proposal.grantTrackingNotes || '',
    grantTrackingHistory: Array.isArray(proposal.grantTrackingHistory)
      ? proposal.grantTrackingHistory
      : [],
    approvedAt: toIsoDate(proposal.updatedAt),
    createdAt: toIsoDate(proposal.createdAt),
    updatedAt: toIsoDate(proposal.updatedAt),
  };
}

export function approvedProposalWhere(user) {
  const orClauses = [{ grantFollowUpUserId: user.id }];
  if (user.orcidId) {
    orClauses.push({ principalInvestigatorOrcid: user.orcidId });
  }

  return {
    status: 'APPROVED',
    OR: orClauses,
  };
}

export function userCanAccessProposal(user, proposal) {
  if (!user || !proposal) return false;
  if (proposal.grantFollowUpUserId && proposal.grantFollowUpUserId === user.id) return true;
  if (user.orcidId && proposal.principalInvestigatorOrcid === user.orcidId) return true;
  return false;
}

export function institutionIdForUser(user) {
  return user?.secondaryInstitutionId || user?.institution?.id || null;
}

export function colleaguesWhere(user) {
  const institutionId = institutionIdForUser(user);
  const base = {
    status: 'ACTIVE',
    accountType: { in: FOLLOW_UP_ACCOUNT_TYPES },
  };

  if (!institutionId) {
    return { ...base, id: user.id };
  }

  return {
    ...base,
    OR: [
      { secondaryInstitutionId: institutionId },
      { id: user.id },
    ],
  };
}

export function validateGrantTrackerUpdate(body = {}) {
  const status = body.grantTrackingStatus;
  if (status && !GRANT_TRACKING_STATUSES.includes(status)) {
    return { error: 'Invalid grant tracking status' };
  }

  const amountRaw = body.grantRequestedAmount;
  let amount = null;
  if (amountRaw !== undefined && amountRaw !== null && amountRaw !== '') {
    amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: 'Amount applied for must be a valid number' };
    }
  }

  const appliedOn = body.grantAppliedOn ? parseDateInput(body.grantAppliedOn) : null;
  if (body.grantAppliedOn && !appliedOn) {
    return { error: 'Applied-on date is invalid' };
  }

  const nextStatus = status || 'NOT_APPLIED';
  if (['APPLIED', 'AWARDED', 'REJECTED'].includes(nextStatus)) {
    if (amount == null) {
      return { error: 'Amount applied for is required once a grant has been applied' };
    }
    if (!appliedOn) {
      return { error: 'Applied-on date is required once a grant has been applied' };
    }
  }

  return {
    status: nextStatus,
    amount,
    appliedOn,
    followUpUserId: body.grantFollowUpUserId || null,
    notes: typeof body.grantTrackingNotes === 'string' ? body.grantTrackingNotes.trim() : '',
  };
}

function accessSql(user) {
  const clauses = [Prisma.sql`p."grantFollowUpUserId" = ${user.id}`];
  if (user.orcidId) {
    clauses.push(Prisma.sql`p."principalInvestigatorOrcid" = ${user.orcidId}`);
  }
  return Prisma.join(clauses, ' OR ');
}

function mapTrackerRow(row) {
  const followUpUser = row.follow_id
    ? serializeFollowUpUser({
        id: row.follow_id,
        givenName: row.follow_given,
        familyName: row.follow_family,
        email: row.follow_email,
        accountType: row.follow_account,
      })
    : null;

  return serializeGrantTrackerProposal({
    id: row.id,
    title: row.title,
    principalInvestigator: row.principalInvestigator,
    principalInvestigatorOrcid: row.principalInvestigatorOrcid,
    fundingSource: row.fundingSource,
    fundingInstitution: row.fundingInstitution,
    totalBudgetAmount: row.totalBudgetAmount,
    grantTrackingStatus: row.grantTrackingStatus || 'NOT_APPLIED',
    grantRequestedAmount: row.grantRequestedAmount,
    grantAppliedOn: row.grantAppliedOn,
    grantDecisionOn: row.grantDecisionOn,
    grantFollowUpUserId: row.grantFollowUpUserId,
    grantFollowUpUser: followUpUser,
    grantTrackingNotes: row.grantTrackingNotes,
    grantTrackingHistory: row.grantTrackingHistory,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export async function listGrantTrackerProposals(user) {
  const rows = await prisma.$queryRaw`
    SELECT
      p.id,
      p.title,
      p."principalInvestigator",
      p."principalInvestigatorOrcid",
      p."fundingSource",
      p."fundingInstitution",
      p."totalBudgetAmount",
      COALESCE(p."grantTrackingStatus", 'NOT_APPLIED') AS "grantTrackingStatus",
      p."grantRequestedAmount",
      p."grantAppliedOn",
      p."grantDecisionOn",
      p."grantFollowUpUserId",
      p."grantTrackingNotes",
      p."grantTrackingHistory",
      p."createdAt",
      p."updatedAt",
      u.id AS follow_id,
      u."givenName" AS follow_given,
      u."familyName" AS follow_family,
      u.email AS follow_email,
      u."accountType" AS follow_account
    FROM proposals p
    LEFT JOIN users u ON u.id = p."grantFollowUpUserId"
    WHERE p.status = 'APPROVED'
      AND (${accessSql(user)})
    ORDER BY p."updatedAt" DESC
  `;
  return rows.map(mapTrackerRow);
}

export async function findGrantTrackerProposal(id, user) {
  const rows = await prisma.$queryRaw`
    SELECT
      p.id,
      p.title,
      p."principalInvestigator",
      p."principalInvestigatorOrcid",
      p."fundingSource",
      p."fundingInstitution",
      p."totalBudgetAmount",
      COALESCE(p."grantTrackingStatus", 'NOT_APPLIED') AS "grantTrackingStatus",
      p."grantRequestedAmount",
      p."grantAppliedOn",
      p."grantDecisionOn",
      p."grantFollowUpUserId",
      p."grantTrackingNotes",
      p."grantTrackingHistory",
      p."createdAt",
      p."updatedAt",
      u.id AS follow_id,
      u."givenName" AS follow_given,
      u."familyName" AS follow_family,
      u.email AS follow_email,
      u."accountType" AS follow_account
    FROM proposals p
    LEFT JOIN users u ON u.id = p."grantFollowUpUserId"
    WHERE p.id = ${id}
      AND p.status = 'APPROVED'
      AND (${accessSql(user)})
    LIMIT 1
  `;
  return rows[0] ? mapTrackerRow(rows[0]) : null;
}

export async function saveGrantTrackerProposal(id, parsed, { previousStatus, previousDecisionOn, historyEntry, user }) {
  const requestedAmount = parsed.status === 'NOT_APPLIED' ? null : parsed.amount;
  const appliedOn = parsed.status === 'NOT_APPLIED' ? null : parsed.appliedOn;
  let decisionOn = previousDecisionOn ? new Date(previousDecisionOn) : null;
  if (TERMINAL_GRANT_STATUSES.includes(parsed.status)) {
    if (previousStatus !== parsed.status || !decisionOn) {
      decisionOn = new Date();
    }
  } else {
    decisionOn = null;
  }

  const historyJson = JSON.stringify(historyEntry);

  await prisma.$executeRaw`
    UPDATE proposals
    SET
      "grantTrackingStatus" = ${parsed.status}::"GrantTrackingStatus",
      "grantRequestedAmount" = ${requestedAmount},
      "grantAppliedOn" = ${appliedOn},
      "grantDecisionOn" = ${decisionOn},
      "grantFollowUpUserId" = ${parsed.followUpUserId},
      "grantTrackingNotes" = ${parsed.notes || null},
      "grantTrackingHistory" = COALESCE("grantTrackingHistory", ARRAY[]::jsonb[])
        || ARRAY[${historyJson}::jsonb],
      "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  return findGrantTrackerProposal(id, user);
}
