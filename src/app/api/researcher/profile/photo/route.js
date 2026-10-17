import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { saveProfilePhoto, removeProfilePhoto } from '@/lib/profile-photo';
import { StorageError } from '@/lib/storage/files-service';

// POST /api/researcher/profile/photo   multipart field "photo" — add or replace
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Photo file is required' }, { status: 400 });
    }

    let avatarUrl;
    try {
      avatarUrl = await saveProfilePhoto(user, file);
    } catch (err) {
      if (err instanceof StorageError) {
        return NextResponse.json({ success: false, message: err.message }, { status: err.status });
      }
      if (err?.message?.startsWith('Photo must')) {
        return NextResponse.json({ success: false, message: err.message }, { status: 400 });
      }
      throw err;
    }

    return NextResponse.json({ success: true, message: 'Profile photo updated', avatarUrl });
  } catch (err) {
    console.error('Error uploading profile photo:', err);
    return NextResponse.json({ success: false, message: 'Failed to upload photo' }, { status: 500 });
  }
}

// DELETE /api/researcher/profile/photo — remove
export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await removeProfilePhoto(user);
    return NextResponse.json({ success: true, message: 'Profile photo removed' });
  } catch (err) {
    console.error('Error removing profile photo:', err);
    return NextResponse.json({ success: false, message: 'Failed to remove photo' }, { status: 500 });
  }
}
