import prisma from '@/lib/prisma';
import { auditTraining } from '@/lib/training-audit';
import { notifyTraining } from '@/lib/training-notify';
import { saveTrainingCertificate, deleteTrainingFile } from '@/lib/training-files';
import { certificateFacilitatorNames } from '@/lib/training-facilitators';
import { buildCertificateValues, formatCertificateNumber, normalizeCertificatePrefix } from '@/lib/certificate-template';
import { buildCertificatePdf } from '@/lib/certificate-pdf';
import { templateForTraining } from '@/lib/certificate-templates-server';
import {
  canIssueFor,
  certificateExpiry,
  generateVerificationCode,
  verifyUrl,
} from '@/lib/certificate-issuance';

export function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Next certificate number for an institution, prefix and year (decision D1). One
 * statement, so concurrent issues never get the same number.
 */
export async function allocateCertificateNumber(institutionId, prefix, year, db = prisma) {
  const p = normalizeCertificatePrefix(prefix);
  const rows = await db.$queryRaw`
    INSERT INTO "training_certificate_sequences" ("id", "institutionId", "prefix", "year", "lastNumber")
    VALUES (${`tcs_${generateVerificationCode()}`}, ${institutionId}, ${p}, ${year}, 1)
    ON CONFLICT ("institutionId", "prefix", "year")
    DO UPDATE SET "lastNumber" = "training_certificate_sequences"."lastNumber" + 1
    RETURNING "lastNumber"`;
  return formatCertificateNumber(p, year, Number(rows[0].lastNumber));
}

/** Give a certificate row a number and verification code if it has none (e.g. uploads). */
export async function ensureCertificateIdentity(certificate, training) {
  if (certificate.certificateNumber && certificate.verificationCode) return certificate;
  const year = new Date(certificate.issuedAt || Date.now()).getUTCFullYear();
  return prisma.trainingCertificate.update({
    where: { id: certificate.id },
    data: {
      certificateNumber: certificate.certificateNumber
        || await allocateCertificateNumber(training.institutionId, training.certificatePrefix, year),
      verificationCode: certificate.verificationCode || generateVerificationCode(),
    },
  });
}

async function storageOwner(actor, training) {
  if (actor) return actor;
  const creator = training.createdBy
    ? await prisma.user.findUnique({ where: { id: training.createdBy } })
    : null;
  return creator;
}

/**
 * Generate (or regenerate) the certificate PDF for a completed registration (#99).
 * - First issue: allocates the number and verification code.
 * - Reissue (existing certificate, also after a revoke): same number and code, new
 *   file, version + 1, status back to ISSUED.
 * @param {string} registrationId
 * @param {{ actor?: object|null, reissue?: boolean, notify?: boolean, reason?: string }} [options]
 * @returns {Promise<{ ok: true, certificate, created: boolean } | { ok: false, error: string, skipped?: boolean }>}
 */
export async function issueCertificate(registrationId, { actor = null, reissue = false, notify = true, reason = null } = {}) {
  const registration = await prisma.trainingRegistration.findUnique({
    where: { id: registrationId },
    include: {
      user: { select: { id: true, givenName: true, familyName: true, email: true } },
      training: true,
      certificate: true,
    },
  });
  const allowed = canIssueFor(registration);
  if (!allowed.ok) return allowed;

  const { training } = registration;
  const existing = registration.certificate;
  if (existing && existing.certificateUrl && existing.status === 'ISSUED' && !reissue) {
    return { ok: false, skipped: true, error: 'Already issued' };
  }

  const owner = await storageOwner(actor, training);
  const institution = await prisma.institution.findUnique({ where: { id: training.institutionId }, select: { id: true, name: true } });
  // {{facilitators}} merge field (#104).
  const facilitators = await prisma.trainingFacilitator.findMany({
    where: { trainingId: training.id },
    include: { user: { select: { givenName: true, familyName: true, email: true } } },
  });
  const template = await templateForTraining(training);
  const now = new Date();

  // Row first, so the stored file can be attached to it.
  let cert = existing || await prisma.trainingCertificate.create({
    data: {
      trainingId: training.id,
      userId: registration.userId,
      registrationId,
      certificateUrl: '',
      uploadedBy: owner?.id || registration.userId,
      source: 'GENERATED',
    },
  });
  cert = await ensureCertificateIdentity(cert, training);

  const values = buildCertificateValues({
    participant: registration.user,
    training,
    institution,
    completedAt: registration.completedAt || training.endDate,
    certificateNumber: cert.certificateNumber,
    facilitators: certificateFacilitatorNames(facilitators),
  });
  const link = verifyUrl(appBaseUrl(), cert.verificationCode);
  const pdf = await buildCertificatePdf({
    template: template || {},
    values,
    verifyUrl: link,
    accreditationLogoDataUrl: training.accreditationLogoDataUrl,
  });

  const fileName = `${cert.certificateNumber}.pdf`;
  const file = new File([pdf], fileName, { type: 'application/pdf' });
  const { fileUrl } = await saveTrainingCertificate(cert.id, file, {
    user: owner,
    entityTenantId: training.institutionId,
    registrationUserId: registration.userId,
  });
  if (existing?.certificateUrl && existing.certificateUrl !== fileUrl) {
    await deleteTrainingFile(existing.certificateUrl, owner).catch(() => {});
  }

  const updated = await prisma.trainingCertificate.update({
    where: { id: cert.id },
    data: {
      certificateUrl: fileUrl,
      source: 'GENERATED',
      status: 'ISSUED',
      version: existing ? (existing.version || 1) + 1 : 1,
      templateId: template?.id || null,
      snapshot: values,
      issuedAt: now,
      uploadedBy: owner?.id || cert.uploadedBy,
      expiresAt: certificateExpiry(now, training.certificateValidityMonths),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
    },
  });

  await auditTraining({
    trainingId: training.id,
    actorId: actor?.id || null,
    action: existing ? 'CERTIFICATE_REISSUED' : 'CERTIFICATE_ISSUED',
    entityType: 'TrainingCertificate',
    entityId: updated.id,
    before: existing ? { status: existing.status, version: existing.version } : null,
    after: { certificateNumber: updated.certificateNumber, version: updated.version, registrationId },
    reason,
  });

  if (notify) {
    await notifyTraining('CERTIFICATE_ISSUED', {
      userId: registration.userId,
      trainingId: training.id,
      dedupeKey: `certificate:${updated.id}:v${updated.version}`,
      extra: { certificate: { number: updated.certificateNumber, verifyUrl: link } },
    });
    await prisma.trainingCertificate.update({ where: { id: updated.id }, data: { emailedAt: new Date() } });
  }

  return { ok: true, certificate: updated, created: !existing };
}

/** Issue certificates for many registrations; never stops on one failure. */
export async function issueCertificates(registrationIds, options = {}) {
  const results = { issued: 0, skipped: 0, failed: [] };
  for (const id of registrationIds) {
    try {
      const r = await issueCertificate(id, options);
      if (r.ok) results.issued += 1;
      else if (r.skipped) results.skipped += 1;
      else results.failed.push({ registrationId: id, error: r.error });
    } catch (error) {
      console.error('Certificate issue failed:', id, error);
      results.failed.push({ registrationId: id, error: error.message || 'Failed' });
    }
  }
  return results;
}

/**
 * Called after registrations become COMPLETED: issues certificates straight away for
 * trainings set to AUTO (#99). Errors are logged, never thrown.
 */
export async function autoIssueCertificates(trainingId, registrationIds) {
  try {
    if (!registrationIds?.length) return null;
    const training = await prisma.training.findUnique({ where: { id: trainingId }, select: { certificateMode: true } });
    if (training?.certificateMode !== 'AUTO') return null;
    return await issueCertificates(registrationIds, { actor: null });
  } catch (error) {
    console.error('Automatic certificate issue failed:', error);
    return null;
  }
}

export async function revokeCertificate(certificateId, { actor, reason }) {
  const cert = await prisma.trainingCertificate.findUnique({ where: { id: certificateId } });
  if (!cert) return { ok: false, error: 'Certificate not found' };
  if (cert.status === 'REVOKED') return { ok: false, error: 'Already revoked' };
  const updated = await prisma.trainingCertificate.update({
    where: { id: certificateId },
    data: { status: 'REVOKED', revokedAt: new Date(), revokedBy: actor.id, revokedReason: reason },
  });
  await auditTraining({
    trainingId: cert.trainingId,
    actorId: actor.id,
    action: 'CERTIFICATE_REVOKED',
    entityType: 'TrainingCertificate',
    entityId: certificateId,
    before: { status: cert.status },
    after: { status: 'REVOKED', certificateNumber: cert.certificateNumber },
    reason,
  });
  await notifyTraining('CERTIFICATE_REVOKED', {
    userId: cert.userId,
    trainingId: cert.trainingId,
    dedupeKey: `certificate-revoked:${certificateId}:v${cert.version}`,
    extra: { reason, certificate: { number: cert.certificateNumber } },
  });
  return { ok: true, certificate: updated };
}

export async function resendCertificate(certificateId, { actor }) {
  const cert = await prisma.trainingCertificate.findUnique({ where: { id: certificateId } });
  if (!cert || !cert.certificateUrl) return { ok: false, error: 'Certificate not found' };
  if (cert.status !== 'ISSUED') return { ok: false, error: 'Only issued certificates can be resent' };
  await notifyTraining('CERTIFICATE_ISSUED', {
    userId: cert.userId,
    trainingId: cert.trainingId,
    extra: { certificate: { number: cert.certificateNumber, verifyUrl: verifyUrl(appBaseUrl(), cert.verificationCode) } },
  });
  const updated = await prisma.trainingCertificate.update({ where: { id: certificateId }, data: { emailedAt: new Date() } });
  await auditTraining({
    trainingId: cert.trainingId,
    actorId: actor.id,
    action: 'CERTIFICATE_RESENT',
    entityType: 'TrainingCertificate',
    entityId: certificateId,
  });
  return { ok: true, certificate: updated };
}

/**
 * Store a certificate file an admin uploaded for a completed registration (#99, #100):
 * new version, numbered, valid, participant notified. Shared by the single and bulk
 * upload routes. The caller has checked access and that the file is acceptable.
 * @param {object} registration  with .training
 * @param {File} file
 * @param {object} actor
 * @param {{ bulk?: boolean }} [options]
 */
export async function storeUploadedCertificate(registration, file, actor, { bulk = false } = {}) {
  const { training } = registration;
  const existing = await prisma.trainingCertificate.findUnique({ where: { registrationId: registration.id } });
  let certificate = existing || await prisma.trainingCertificate.create({
    data: {
      trainingId: training.id,
      userId: registration.userId,
      registrationId: registration.id,
      certificateUrl: '',
      uploadedBy: actor.id,
    },
  });

  const { fileUrl } = await saveTrainingCertificate(certificate.id, file, {
    user: actor,
    entityTenantId: training.institutionId,
    registrationUserId: registration.userId,
  });
  if (existing?.certificateUrl && existing.certificateUrl !== fileUrl) {
    await deleteTrainingFile(existing.certificateUrl, actor).catch(() => {});
  }

  const issuedAt = new Date();
  certificate = await prisma.trainingCertificate.update({
    where: { id: certificate.id },
    data: {
      certificateUrl: fileUrl,
      uploadedBy: actor.id,
      issuedAt,
      source: 'UPLOADED',
      status: 'ISSUED',
      version: existing?.certificateUrl ? (existing.version || 1) + 1 : existing?.version || 1,
      expiresAt: certificateExpiry(issuedAt, training.certificateValidityMonths),
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
    },
  });
  certificate = await ensureCertificateIdentity(certificate, training);

  await auditTraining({
    trainingId: training.id,
    actorId: actor.id,
    action: existing?.certificateUrl ? 'CERTIFICATE_REPLACED' : 'CERTIFICATE_UPLOADED',
    entityType: 'TrainingCertificate',
    entityId: certificate.id,
    before: existing ? { certificateUrl: existing.certificateUrl, version: existing.version, status: existing.status } : null,
    after: { certificateNumber: certificate.certificateNumber, version: certificate.version, registrationId: registration.id, file: file.name, bulk },
  });

  await notifyTraining('CERTIFICATE_ISSUED', {
    userId: registration.userId,
    trainingId: training.id,
    dedupeKey: `certificate:${certificate.id}:v${certificate.version}:upload`,
    extra: { certificate: { number: certificate.certificateNumber, verifyUrl: verifyUrl(appBaseUrl(), certificate.verificationCode) } },
  });
  return prisma.trainingCertificate.update({ where: { id: certificate.id }, data: { emailedAt: new Date() } });
}
