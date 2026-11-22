import { NextResponse } from 'next/server';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { withAdminAudit } from '@/lib/ops/audit';
import {
  getAllSettings,
  getSettingsMeta,
  saveSettingsSection,
  SettingsValidationError,
  SETTINGS_SECTIONS,
} from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireGlobalAdmin();
  if (error) return error;

  try {
    const data = await getAllSettings({ fresh: true });
    return NextResponse.json({ success: true, data, meta: getSettingsMeta() });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

async function handlePUT(request) {
  const { user, error } = await requireGlobalAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { category, settings } = body || {};

    if (!SETTINGS_SECTIONS.includes(category)) {
      return NextResponse.json({ success: false, error: 'Unknown settings section' }, { status: 400 });
    }

    const { values, changed } = await saveSettingsSection(category, settings, { userId: user.id });
    // Log only which fields changed, never values (email settings may be sensitive).
    console.log(`Platform settings "${category}" updated by ${user.id}: ${changed.join(', ') || 'no changes'}`);

    return NextResponse.json({
      success: true,
      message: changed.length ? 'Settings saved' : 'No changes to save',
      category,
      changed,
      data: values,
    });
  } catch (err) {
    if (err instanceof SettingsValidationError) {
      return NextResponse.json(
        { success: false, error: err.message, fieldErrors: err.fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error updating settings:', err);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}

export const PUT = withAdminAudit(handlePUT, {
  action: 'PLATFORM_SETTINGS_UPDATED',
  targetType: 'Settings',
  targetFromResponse: (json) => json?.category || null,
  summary: ({ json }) =>
    json?.changed?.length
      ? `Changed ${json.category} settings: ${json.changed.join(', ')}`
      : `Saved ${json?.category || 'platform'} settings (no changes)`,
});
