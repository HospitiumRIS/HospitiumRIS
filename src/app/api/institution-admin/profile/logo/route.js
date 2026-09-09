import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireInstitutionAdmin, getOwnedInstitution } from '@/lib/institution-admin';
import {
  saveInstitutionLogo,
  deleteInstitutionLogoFile,
  readInstitutionLogoFile,
} from '@/lib/institution-logo';

export async function GET() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution?.logo) {
      return NextResponse.json({ error: 'No logo uploaded' }, { status: 404 });
    }

    const file = await readInstitutionLogoFile(institution.logo);
    if (!file) {
      return NextResponse.json({ error: 'Logo file not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error reading institution logo:', err);
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ error: 'No institution found for this admin' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('logo');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Logo file is required' }, { status: 400 });
    }

    let logo;
    try {
      logo = await saveInstitutionLogo(institution.id, file);
    } catch (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    if (institution.logo && institution.logo !== logo) {
      await deleteInstitutionLogoFile(institution.logo);
    }

    const updated = await prisma.institution.update({
      where: { id: institution.id },
      data: { logo },
    });

    return NextResponse.json({
      success: true,
      message: 'Logo updated',
      logo: updated.logo,
    });
  } catch (err) {
    console.error('Error uploading institution logo:', err);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { user, error } = await requireInstitutionAdmin();
    if (error) return error;

    const institution = await getOwnedInstitution(user);
    if (!institution) {
      return NextResponse.json({ error: 'No institution found for this admin' }, { status: 404 });
    }

    await deleteInstitutionLogoFile(institution.logo);
    await prisma.institution.update({
      where: { id: institution.id },
      data: { logo: null },
    });

    return NextResponse.json({ success: true, message: 'Logo removed' });
  } catch (err) {
    console.error('Error removing institution logo:', err);
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
  }
}
