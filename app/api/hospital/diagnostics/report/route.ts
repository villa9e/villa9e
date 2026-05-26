import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/hospital/diagnostics/report?submission_id=xxx
// Poll for AEYE Health diagnostic report status and results
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get('submission_id');
  if (!submissionId) return NextResponse.json({ error: 'submission_id required' }, { status: 400 });

  const admin = createAdminClient();

  const { data: sub } = await (admin as any)
    .from('diagnostic_submissions')
    .select('*, provider_profiles(user_id)')
    .eq('id', submissionId)
    .single();

  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  // Verify ownership
  if (sub.provider_profiles?.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // If still processing, poll AEYE Health
  if (sub.aeye_status === 'processing' && sub.aeye_submission_id && process.env.AEYE_HEALTH_API_KEY) {
    try {
      const aeyeRes = await fetch(
        `${process.env.AEYE_HEALTH_API_URL ?? 'https://api.aeyehealth.com/v1'}/submissions/${sub.aeye_submission_id}`,
        { headers: { 'Authorization': `Bearer ${process.env.AEYE_HEALTH_API_KEY}` } }
      );

      if (aeyeRes.ok) {
        const report = await aeyeRes.json();
        if (report.status === 'complete') {
          await (admin as any).from('diagnostic_submissions').update({
            aeye_status:   'complete',
            aeye_report:   report,
            aeye_findings: report.findings ?? null,
            aeye_severity: report.severity ?? null,
          }).eq('id', submissionId);

          sub.aeye_status   = 'complete';
          sub.aeye_report   = report;
          sub.aeye_findings = report.findings;
          sub.aeye_severity = report.severity;
        }
      }
    } catch { /* polling failure — return cached state */ }
  }

  return NextResponse.json({
    submission_id:       sub.id,
    aeye_submission_id:  sub.aeye_submission_id,
    status:              sub.aeye_status,
    image_type:          sub.image_type,
    eye_side:            sub.eye_side,
    cpt_code:            sub.cpt_code,
    is_billable:         sub.is_billable,
    findings:            sub.aeye_findings,
    severity:            sub.aeye_severity,
    full_report:         sub.aeye_report,
    created_at:          sub.created_at,
  });
}
