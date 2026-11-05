import { NextResponse } from 'next/server';
import { requireGlobalAdmin } from '@/lib/require-global-admin';
import { OPS_JOBS, runOpsJob } from '@/lib/ops/jobs';

// Run a background job now (Operations > Jobs > "Run now").
export async function POST(request, { params }) {
  const { user, error } = await requireGlobalAdmin();
  if (error) return error;

  const { job } = await params;
  if (!OPS_JOBS[job]) {
    return NextResponse.json({ success: false, error: 'Unknown job' }, { status: 404 });
  }

  const result = await runOpsJob(job, { actor: user, request });
  return NextResponse.json({ success: result.ok, message: result.summary }, { status: result.ok ? 200 : 500 });
}
