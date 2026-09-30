import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireInstitutionAdmin,
  getOwnedInstitution,
  resolveInstitutionMemberScope,
} from '@/lib/institution-admin';
import {
  INSTITUTION_MODULES,
  normalizeEnabledModules,
} from '@/lib/institution-modules';

const DEFAULT_PREFERENCES = {
  emailMemberSignup: true,
  emailSecurityAlerts: true,
  emailWeeklyDigest: false,
  notifyPendingApprovals: true,
};

function normalizePreferences(value) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }
  return {
    emailMemberSignup: Boolean(value.emailMemberSignup ?? DEFAULT_PREFERENCES.emailMemberSignup),
    emailSecurityAlerts: Boolean(value.emailSecurityAlerts ?? DEFAULT_PREFERENCES.emailSecurityAlerts),
    emailWeeklyDigest: Boolean(value.emailWeeklyDigest ?? DEFAULT_PREFERENCES.emailWeeklyDigest),
    notifyPendingApprovals: Boolean(value.notifyPendingApprovals ?? DEFAULT_PREFERENCES.notifyPendingApprovals),
  };
}

async function loadPreferences(userId, institutionId) {
  const record = await prisma.userSettings.findUnique({
    where: {
      userId_type: {
        userId,
        type: 'OTHER',
      },
    },
  });

  const stored = record?.settings?.institutionAdmin?.[institutionId];
  return normalizePreferences(stored);
}

async function savePreferences(userId, institutionId, preferences) {
  const existing = await prisma.userSettings.findUnique({
    where: {
      userId_type: {
        userId,
        type: 'OTHER',
      },
    },
  });

  const currentSettings =
    existing?.settings && typeof existing.settings === 'object' ? existing.settings : {};
  const institutionAdmin =
    currentSettings.institutionAdmin && typeof currentSettings.institutionAdmin === 'object'
      ? currentSettings.institutionAdmin
      : {};

  const nextSettings = {
    ...currentSettings,
    institutionAdmin: {
      ...institutionAdmin,
      [institutionId]: normalizePreferences(preferences),
    },
  };

  await prisma.userSettings.upsert({
    where: {
      userId_type: {
        userId,
        type: 'OTHER',
      },
    },
    create: {
      userId,
      type: 'OTHER',
      settings: nextSettings,
    },
    update: {
      settings: nextSettings,
    },
  });
}

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user, {
      include: {
        verifiedDomains: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const enabledModules = normalizeEnabledModules(institution.enabledModules);
    const { memberWhere } = await resolveInstitutionMemberScope(institution);
    const memberCount = await prisma.user.count({ where: memberWhere });
    const preferences = await loadPreferences(user.id, institution.id);

    const domains = institution.verifiedDomains || [];
    const domainSummary = {
      total: domains.length,
      verified: domains.filter((domain) => domain.status === 'VERIFIED').length,
      autoApprove: domains.filter((domain) => domain.autoApproveUsers).length,
      items: domains.slice(0, 5).map((domain) => ({
        id: domain.id,
        domain: domain.domain,
        status: domain.status,
        autoApproveUsers: domain.autoApproveUsers,
        allowedAccountTypes: domain.allowedAccountTypes,
      })),
    };

    return NextResponse.json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          type: institution.type,
          storageBucket: institution.storageBucket,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt,
        },
        enabledModules,
        modules: INSTITUTION_MODULES.map((mod) => ({
          ...mod,
          enabled: enabledModules.includes(mod.key),
        })),
        preferences,
        domainSummary,
        memberCount,
      },
    });
  } catch (err) {
    console.error('Error fetching institution settings:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings', error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ success: false, message: 'No institution found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = [];

    if (body.enabledModules !== undefined) {
      const enabledModules = normalizeEnabledModules(body.enabledModules);
      if (enabledModules.length === 0) {
        return NextResponse.json(
          { success: false, message: 'At least one module must remain enabled' },
          { status: 400 }
        );
      }

      await prisma.institution.update({
        where: { id: institution.id },
        data: { enabledModules },
      });
      updates.push('modules');
    }

    if (body.preferences !== undefined) {
      await savePreferences(user.id, institution.id, body.preferences);
      updates.push('preferences');
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No settings to update' }, { status: 400 });
    }

    const refreshed = await getOwnedInstitution(user, {
      include: { verifiedDomains: { orderBy: { createdAt: 'desc' } } },
    });

    const enabledModules = normalizeEnabledModules(refreshed.enabledModules);
    const preferences = await loadPreferences(user.id, institution.id);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: {
        enabledModules,
        modules: INSTITUTION_MODULES.map((mod) => ({
          ...mod,
          enabled: enabledModules.includes(mod.key),
        })),
        preferences,
        institution: {
          id: refreshed.id,
          name: refreshed.name,
          slug: refreshed.slug,
          updatedAt: refreshed.updatedAt,
        },
      },
    });
  } catch (err) {
    console.error('Error updating institution settings:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to update settings', error: err.message },
      { status: 500 }
    );
  }
}
