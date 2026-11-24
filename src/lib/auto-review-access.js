import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess } from '@/lib/institution-scope';

/**
 * Access for the auto-review configuration routes (#9). Every route needs institution
 * portal access; workflows belong to one institution and stages, parameters and stage
 * reviewers are reached only through a workflow of the caller's institution. Anything
 * else is answered with 404 so other institutions' configuration is not revealed.
 */

const notFound = (what = 'Not found') => NextResponse.json({ success: false, error: what }, { status: 404 });

/** Portal access, or `{ error }` (401/403 from the shared guard). */
export async function autoReviewAccess() {
  const access = await requireInstitutionPortalAccess();
  if (access.error) return { error: access.error };
  return { ...access, workflowWhere: { institutionId: access.institution.id } };
}

/** The caller's workflow, or `{ error }`. */
export async function ownWorkflow(ctx, id, select = { id: true, type: true }) {
  const row = id ? await prisma.autoReviewWorkflow.findFirst({ where: { id, ...ctx.workflowWhere }, select }) : null;
  return row ? { workflow: row } : { error: notFound('Workflow not found') };
}

/** A stage of one of the caller's workflows, or `{ error }`. */
export async function ownStage(ctx, id) {
  const row = id ? await prisma.autoReviewStage.findFirst({ where: { id, workflow: ctx.workflowWhere }, select: { id: true, workflowId: true } }) : null;
  return row ? { stage: row } : { error: notFound('Stage not found') };
}

/** A validation parameter of one of the caller's stages, or `{ error }`. */
export async function ownParameter(ctx, id) {
  const row = id ? await prisma.validationParameter.findFirst({ where: { id, stage: { workflow: ctx.workflowWhere } }, select: { id: true } }) : null;
  return row ? { parameter: row } : { error: notFound('Parameter not found') };
}

/** Is the user a member of the caller's institution (for stage reviewer assignment)? */
export async function isMember(ctx, userId) {
  if (!userId) return false;
  const found = await prisma.user.findFirst({ where: { AND: [{ id: userId }, ctx.memberWhere] }, select: { id: true } });
  return Boolean(found);
}

/** Reviewer roles are shared by all institutions: only a global admin changes them. */
export function canManageReviewerRoles(user) {
  return user?.accountType === 'GLOBAL_ADMIN';
}
