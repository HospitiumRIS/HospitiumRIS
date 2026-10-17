import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

/**
 * Researcher onboarding state.
 * GET  -> { showTour, showChecklist, completeness: { percent, items[] } }
 * POST { action: 'complete-tour' | 'dismiss-checklist' | 'restore-checklist' }
 */

function buildChecklist(user) {
  const rp = user.researchProfile || {};
  const ids = Array.isArray(rp.researcherIds) ? rp.researcherIds : [];
  const items = [
    { key: 'photo', label: 'Add a profile photo', done: Boolean(user.avatarUrl), tab: 'overview' },
    { key: 'orcid', label: 'Connect your ORCID iD', done: Boolean(user.orcidId), tab: 'ids' },
    { key: 'title', label: 'Add your academic title and department', done: Boolean(rp.academicTitle && rp.department), tab: 'overview', edit: true },
    { key: 'bio', label: 'Write a short biography or current focus', done: Boolean(rp.biography || rp.researchInterests), tab: 'overview', edit: true },
    { key: 'expertise', label: 'List at least 3 areas of expertise', done: (rp.keywords || []).length >= 3, tab: 'overview' },
    { key: 'ids', label: 'Link another researcher profile (e.g. Google Scholar)', done: ids.length > 0 || Boolean(rp.googleScholar), tab: 'ids' },
  ];
  const doneCount = items.filter((i) => i.done).length;
  return { percent: Math.round((doneCount / items.length) * 100), doneCount, total: items.length, items };
}

async function loadUser(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      avatarUrl: true,
      orcidId: true,
      onboardingCompletedAt: true,
      profileChecklistDismissedAt: true,
      researchProfile: {
        select: {
          academicTitle: true,
          department: true,
          biography: true,
          researchInterests: true,
          keywords: true,
          researcherIds: true,
          googleScholar: true,
        },
      },
    },
  });
}

export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = await loadUser(sessionUser.id);
    const completeness = buildChecklist(user);
    return NextResponse.json({
      success: true,
      showTour: !user.onboardingCompletedAt,
      showChecklist: completeness.percent < 100 && !user.profileChecklistDismissedAt,
      checklistDismissed: Boolean(user.profileChecklistDismissedAt),
      completeness,
    });
  } catch (err) {
    console.error('Error loading onboarding state:', err);
    return NextResponse.json({ success: false, message: 'Failed to load onboarding state' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { action } = await request.json().catch(() => ({}));
    const data =
      action === 'complete-tour'
        ? { onboardingCompletedAt: new Date() }
        : action === 'dismiss-checklist'
          ? { profileChecklistDismissedAt: new Date() }
          : action === 'restore-checklist'
            ? { profileChecklistDismissedAt: null }
            : null;
    if (!data) return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });

    await prisma.user.update({ where: { id: sessionUser.id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating onboarding state:', err);
    return NextResponse.json({ success: false, message: 'Failed to update onboarding state' }, { status: 500 });
  }
}
