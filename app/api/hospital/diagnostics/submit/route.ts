import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

// POST /api/hospital/diagnostics/submit
// Submit a retinal image to AEYE Health for autonomous AI analysis
// CPT Code 92229 — Imaging of retina for detection/monitoring of disease
//
// AEYE Health integration:
// - API endpoint: https://api.aeyehealth.com/v1/submissions (production)
// - Requires: API key, image URL or base64, patient metadata
// - Returns: submission_id for polling
//
// Architecture: Doctor uploads fundus photo → we send to AEYE Health →
// AEYE returns diagnostic report → clinic bills insurance via CPT 92229

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify user is an active, verified provider
  const { data: provider } = await (admin as any).from('provider_profiles')
    .select('id, credential_type, verification_status, display_name')
    .eq('user_id', user.id)
    .eq('verification_status', 'approved')
    .single();

  if (!provider) {
    return NextResponse.json({ error: 'Only verified medical providers can submit diagnostic images' }, { status: 403 });
  }

  const {
    image_url,       // Cloudinary URL of fundus photo
    image_type = 'fundus',
    eye_side,        // 'OD', 'OS', or 'OU'
    patient_ref,     // EHR patient reference ID
    patient_user_id, // villa9e user ID if patient is a villager
    cpt_code = '92229',
  } = await req.json();

  if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 });

  // Create submission record first (before AEYE API call)
  const { data: submission, error: subErr } = await (admin as any)
    .from('diagnostic_submissions')
    .insert({
      provider_id:    provider.id,
      patient_user_id: patient_user_id ?? null,
      patient_ref:    patient_ref ?? null,
      image_url,
      image_type,
      eye_side:       eye_side ?? null,
      aeye_status:    'submitted',
      cpt_code,
      is_billable:    true,
    })
    .select('id')
    .single();

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  // ── AEYE Health API Integration ────────────────────────────────────
  // Production: requires AEYE_HEALTH_API_KEY in env vars
  // Sandbox: returns mock report for testing
  const AEYE_API_KEY = process.env.AEYE_HEALTH_API_KEY;
  const AEYE_BASE    = process.env.AEYE_HEALTH_API_URL ?? 'https://api.aeyehealth.com/v1';

  let aeyeSubmissionId: string | null = null;
  let aeyeStatus = 'processing';

  if (AEYE_API_KEY) {
    try {
      const aeyeRes = await fetch(`${AEYE_BASE}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AEYE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url,
          image_type,
          laterality:     eye_side,       // OD/OS/OU
          patient_ref:    patient_ref,
          provider_ref:   provider.id,
          cpt_code,
          callback_url:   `${process.env.NEXT_PUBLIC_APP_URL}/api/hospital/diagnostics/webhook`,
        }),
      });

      if (aeyeRes.ok) {
        const aeyeData = await aeyeRes.json();
        aeyeSubmissionId = aeyeData.submission_id ?? null;
        aeyeStatus = 'processing';

        await (admin as any).from('diagnostic_submissions').update({
          aeye_submission_id: aeyeSubmissionId,
          aeye_status: 'processing',
        }).eq('id', submission.id);
      }
    } catch (e: any) {
      // AEYE API unavailable — flag for manual processing
      await (admin as any).from('diagnostic_submissions').update({
        aeye_status: 'failed',
      }).eq('id', submission.id);
    }
  } else {
    // ── Sandbox mode — simulate AEYE response for testing ──
    // In production, this block is removed and AEYE_API_KEY is required
    const mockReport = {
      submission_id:  `mock_${Date.now()}`,
      status:         'complete',
      findings:       'No diabetic retinopathy detected. Optic disc appears normal. Macula appears healthy.',
      severity:       'none',
      dr_grade:       0,
      confidence:     0.94,
      recommendation: 'Routine annual screening. No immediate intervention required.',
      artifacts:      [],
    };
    aeyeSubmissionId = mockReport.submission_id;
    aeyeStatus = 'complete';

    await (admin as any).from('diagnostic_submissions').update({
      aeye_submission_id: mockReport.submission_id,
      aeye_status:        'complete',
      aeye_report:        mockReport,
      aeye_findings:      mockReport.findings,
      aeye_severity:      mockReport.severity,
    }).eq('id', submission.id);
  }

  // Notify provider that submission is processing
  await (admin as any).from('notifications').insert({
    user_id:        user.id,
    type:           'goal_step',
    title:          '🔬 Diagnostic Image Submitted',
    body:           `AEYE Health is analyzing your ${image_type} image. Report typically available in 2–5 minutes.`,
    reference_id:   submission.id,
    reference_type: 'diagnostic',
  });

  return NextResponse.json({
    ok:                  true,
    submission_id:       submission.id,
    aeye_submission_id:  aeyeSubmissionId,
    status:              aeyeStatus,
    cpt_code,
    billable:            true,
    message:             AEYE_API_KEY
      ? 'Image submitted to AEYE Health. Poll /api/hospital/diagnostics/report for results.'
      : 'SANDBOX: Mock report generated. Add AEYE_HEALTH_API_KEY for production.',
  });
}
