import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSessionAdmin } from '@/lib/training-sessions-server';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/training-scope';
import { storeUploadedCertificate } from '@/lib/training-certificates-server';
import {
  ALLOWED_EXTENSIONS,
  BULK_LIMITS,
  baseName,
  extensionOf,
  planBulkUpload,
  sniffMatchesExtension,
} from '@/lib/certificate-bulk-match';

const MAX_BATCH_BYTES = 40 * 1024 * 1024; // under the 50 MB proxy limit

async function participantsOf(trainingId) {
  const registrations = await prisma.trainingRegistration.findMany({
    where: { trainingId, status: { in: ACTIVE_REGISTRATION_STATUSES } },
    select: {
      id: true,
      status: true,
      user: { select: { email: true, givenName: true, familyName: true } },
      certificate: { select: { certificateUrl: true } },
    },
  });
  return registrations.map((r) => ({
    registrationId: r.id,
    email: r.user?.email,
    givenName: r.user?.givenName,
    familyName: r.user?.familyName,
    status: r.status,
    hasCertificate: Boolean(r.certificate?.certificateUrl),
  }));
}

/**
 * POST /api/training/[id]/certificates/bulk-upload   (training admin only, #100)
 *
 * Preview (JSON): { action: 'preview', files: [{ name, size }], mappingCsv? }
 *   Matches file names to participants (email, full name, or a "file,email" mapping
 *   CSV). Nothing is uploaded; ZIPs are unpacked in the browser.
 *
 * Commit (multipart): files[] + assignments = JSON { "<file name>": "<registrationId>" }
 *   Stores each file as that participant's certificate (numbered, notified). Send in
 *   batches under 40 MB. Each file is checked again: type, size, content, completed
 *   registration of this training.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requireSessionAdmin(request, id);
    if (access.error) return access.error;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (body?.action !== 'preview') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      const files = Array.isArray(body.files)
        ? body.files.map((f) => ({ name: String(f?.name || ''), size: Number(f?.size) || 0 }))
        : [];
      const plan = planBulkUpload(files, await participantsOf(id), {
        mappingCsv: typeof body.mappingCsv === 'string' ? body.mappingCsv.slice(0, 200000) : '',
      });
      if (!plan.ok) return NextResponse.json({ error: plan.error }, { status: 400 });
      return NextResponse.json({ success: true, ...plan });
    }

    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'Send the files as form data' }, { status: 400 });
    let assignments;
    try {
      assignments = JSON.parse(String(form.get('assignments') || '{}'));
    } catch {
      return NextResponse.json({ error: 'assignments must be JSON' }, { status: 400 });
    }
    const files = form.getAll('files').filter((f) => f && typeof f !== 'string');
    if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 });
    if (files.length > BULK_LIMITS.maxFiles) return NextResponse.json({ error: 'Too many files in one batch' }, { status: 400 });
    const total = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (total > MAX_BATCH_BYTES) return NextResponse.json({ error: 'Batch too large; send under 40 MB at a time' }, { status: 400 });

    const registrations = await prisma.trainingRegistration.findMany({
      where: { trainingId: id, id: { in: Object.values(assignments).filter((v) => typeof v === 'string') } },
      include: { training: true },
    });
    const byId = new Map(registrations.map((r) => [r.id, r]));

    const results = [];
    const seen = new Set();
    for (const file of files) {
      const name = baseName(file.name);
      const registrationId = assignments[name];
      const fail = (reason) => results.push({ name, ok: false, reason });
      const registration = registrationId ? byId.get(registrationId) : null;
      if (!registration) { fail('Not assigned to a participant of this training'); continue; }
      if (seen.has(registrationId)) { fail('Another file in this batch is for the same participant'); continue; }
      if (registration.status !== 'COMPLETED') { fail('Participant has not completed the training'); continue; }
      if (!ALLOWED_EXTENSIONS.includes(extensionOf(name))) { fail('Only PDF, PNG or JPEG'); continue; }
      if (!file.size || file.size > BULK_LIMITS.maxFileBytes) { fail('Empty or larger than 5 MB'); continue; }
      const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!sniffMatchesExtension(head, name)) { fail('Content does not match the file type'); continue; }

      try {
        // Store under the clean base name, never a path from a ZIP.
        const clean = new File([await file.arrayBuffer()], name, { type: file.type || 'application/octet-stream' });
        const certificate = await storeUploadedCertificate(registration, clean, access.user, { bulk: true });
        seen.add(registrationId);
        results.push({ name, ok: true, registrationId, certificateNumber: certificate.certificateNumber });
      } catch (error) {
        console.error('Bulk certificate upload failed for', name, error);
        fail('Could not store the file');
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok),
      results,
    });
  } catch (error) {
    console.error('Error in bulk certificate upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
