import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireGlobalAdmin } from '@/lib/require-global-admin';

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function normalizeDomain(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

export async function POST(request, { params }) {
  try {
    const { user, error } = await requireGlobalAdmin();
    if (error) return error;

    const { id } = await params;
    const institution = await prisma.institution.findUnique({ where: { id } });
    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    const body = await request.json();
    const rawList = Array.isArray(body.domains)
      ? body.domains
      : body.domain
        ? [body.domain]
        : [];

    const domains = [...new Set(rawList.map(normalizeDomain).filter(Boolean))];
    if (domains.length === 0) {
      return NextResponse.json({ error: 'At least one domain is required' }, { status: 400 });
    }

    const created = [];
    for (const domain of domains) {
      if (!DOMAIN_REGEX.test(domain)) {
        return NextResponse.json({ error: `Invalid domain: ${domain}` }, { status: 400 });
      }

      const claimed = await prisma.verifiedDomain.findFirst({
        where: { domain, NOT: { institutionId: id } },
      });
      if (claimed) {
        return NextResponse.json(
          { error: `Domain ${domain} is already claimed by another institution` },
          { status: 409 }
        );
      }

      const existing = await prisma.verifiedDomain.findFirst({
        where: { institutionId: id, domain },
      });
      if (existing) {
        created.push(existing);
        continue;
      }

      const record = await prisma.verifiedDomain.create({
        data: {
          institutionId: id,
          domain,
          status: 'VERIFIED',
          verificationMethod: 'MANUAL',
          verifiedBy: user.id,
          verifiedAt: new Date(),
          autoApproveUsers: true,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      success: true,
      message: 'Verified domain(s) added',
      domains: created,
    }, { status: 201 });
  } catch (err) {
    console.error('Error adding verified domain:', err);
    return NextResponse.json({ error: 'Failed to add verified domain' }, { status: 500 });
  }
}
