import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  getOwnedInstitution,
  getInstitutionMemberIds,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';

import { institutionProposalWhere } from '@/lib/proposals/scope';

export const INSTITUTION_PORTAL_ROLES = ['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'];

export function resolveInstitutionScope(user) {
  if (!user) return null;
  return user.secondaryInstitution || user.institution || null;
}

export async function resolveUserInstitution(user) {
  const scoped = resolveInstitutionScope(user);
  if (scoped?.id) return scoped;
  return getOwnedInstitution(user);
}

export function withDateFilter(where, dateFilter) {
  if (!dateFilter?.createdAt) return where;
  return { AND: [where, dateFilter] };
}

/**
 * IDs of the proposals that belong to an institution (tenant isolation).
 *
 * Uses the institution recorded on the proposal at creation, and for older rows without
 * one, the people involved (creator, PI ORCID, follow-up, manuscript link) who are
 * members. The free-text departments field and review-pipeline membership are no longer
 * trusted: both let other institutions' proposals into this institution's portal.
 * See lib/proposals/scope.js (institutionProposalWhere).
 */
export async function getInstitutionProposalScope(institution, memberIds = null) {
  if (!institution?.id) return [];
  const ids = memberIds ?? (await getInstitutionMemberIds(institution));
  const memberOrcids = ids.length
    ? (await prisma.user.findMany({
        where: { id: { in: ids }, orcidId: { not: null } },
        select: { orcidId: true },
      })).map((entry) => entry.orcidId)
    : [];

  const rows = await prisma.proposal.findMany({
    where: institutionProposalWhere(institution.id, { memberIds: ids, memberOrcids }),
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function buildInstitutionProposalWhere(institution) {
  const proposalIds = await getInstitutionProposalScope(institution);
  if (proposalIds.length === 0) {
    return { id: { in: ['__none__'] } };
  }
  return { id: { in: proposalIds } };
}

export async function requireInstitutionPortalAccess() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!INSTITUTION_PORTAL_ROLES.includes(user.accountType)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  const institution = await resolveUserInstitution(user);
  if (!institution) {
    return {
      error: NextResponse.json(
        { error: 'No institution linked to this account' },
        { status: 403 }
      ),
    };
  }

  const { verifiedDomains, memberWhere } = await resolveInstitutionMemberScope(institution);
  const memberIds = await getInstitutionMemberIds(institution, { memberWhere, verifiedDomains });

  return { user, institution, memberIds, memberWhere, verifiedDomains };
}

export function emptyScopeWhere(field = 'id') {
  return { [field]: { equals: '__none__' } };
}

export async function getInstitutionProposalScopeWhere(institution, memberIds = null) {
  const proposalIds = await getInstitutionProposalScope(institution, memberIds);
  return proposalIds.length ? { id: { in: proposalIds } } : emptyScopeWhere();
}

export async function assertInstitutionMember(userId, institution) {
  const { memberWhere } = await resolveInstitutionMemberScope(institution);
  return prisma.user.findFirst({
    where: {
      AND: [{ id: userId }, memberWhere],
    },
    select: { id: true },
  });
}

export async function requireInstitutionPipeline(pipelineId) {
  const access = await requireInstitutionPortalAccess();
  if (access.error) return access;

  const pipeline = await prisma.proposalReviewPipeline.findFirst({
    where: { id: pipelineId, institutionId: access.institution.id },
  });

  if (!pipeline) {
    return {
      error: NextResponse.json({ error: 'Pipeline not found' }, { status: 404 }),
    };
  }

  return { ...access, pipeline };
}
