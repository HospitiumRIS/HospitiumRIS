import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { requireInstitutionPortalAccess } from '@/lib/institution-scope';
import { ethicsExportRows, ethicsRow, ethicsSummary, filterEthicsRows, tabCounts } from '@/lib/institution-ethics';

/**
 * GET /api/institution/ethics/applications[?format=xlsx|csv&tab&search&department]
 * Ethics applications of the institution's members for the research office (#21).
 * `EthicsApplication` has only a scalar `userId` (no `user` relation), so the scope is
 * the member ID list and applicants are loaded separately.
 */
export async function GET(request) {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const { institution, memberIds } = access;

    const applications = memberIds.length
      ? await prisma.ethicsApplication.findMany({
          where: { userId: { in: memberIds } },
          select: {
            id: true, userId: true, title: true, principalInvestigator: true, department: true, researchType: true,
            riskLevel: true, status: true, referenceNumber: true, committeeName: true, source: true,
            submittedDate: true, approvalDate: true, expiryDate: true, createdAt: true, updatedAt: true,
            _count: { select: { linkedProposals: true } },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];
    const owners = applications.length
      ? await prisma.user.findMany({
          where: { id: { in: [...new Set(applications.map((a) => a.userId))] } },
          select: { id: true, givenName: true, familyName: true, email: true },
        })
      : [];
    const byId = new Map(owners.map((u) => [u.id, u]));
    const rows = applications.map((a) => ethicsRow(a, byId.get(a.userId)));

    const p = new URL(request.url).searchParams;
    const format = p.get('format');
    if (format === 'xlsx' || format === 'csv') {
      const out = ethicsExportRows(filterEthicsRows(rows, { tab: p.get('tab') || 'all', search: p.get('search') || '', department: p.get('department') || 'all' }));
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        const cols = out.length ? Object.keys(out[0]) : ['Reference'];
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [cols.map(esc).join(','), ...out.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
        return new NextResponse(`﻿${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ethics-applications-${stamp}.csv"` } });
      }
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(out.length ? out : [{ Note: 'No applications match these filters' }]), 'Ethics applications');
      return new NextResponse(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="ethics-applications-${stamp}.xlsx"` },
      });
    }

    return NextResponse.json({
      success: true,
      institution: { id: institution.id, name: institution.name },
      applications: rows,
      counts: tabCounts(rows),
      summary: ethicsSummary(rows),
      count: rows.length,
    });
  } catch (error) {
    console.error('Error fetching ethics applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
