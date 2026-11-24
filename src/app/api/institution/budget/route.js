import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireInstitutionPortalAccess } from '@/lib/institution-scope';
import { loadInstitutionBudget } from '@/lib/project-budget-server';
import { expenseExportRows, projectExportRows } from '@/lib/project-budget';

/**
 * GET /api/institution/budget[?format=xlsx]: approved projects with budget figures, all
 * expenses and claims, for the research office (#179).
 */
export async function GET(request) {
  try {
    const access = await requireInstitutionPortalAccess();
    if (access.error) return access.error;
    const data = await loadInstitutionBudget(access.institution.id);
    if (new URL(request.url).searchParams.get('format') === 'xlsx') {
      const book = XLSX.utils.book_new();
      const projects = projectExportRows(data.projects);
      const expenses = expenseExportRows(data.expenses);
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(projects.length ? projects : [{ Note: 'No approved projects' }]), 'Projects');
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(expenses.length ? expenses : [{ Note: 'No expenses' }]), 'Expenses');
      return new NextResponse(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="project-budgets-${new Date().toISOString().slice(0, 10)}.xlsx"` },
      });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Loading institution budgets failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
