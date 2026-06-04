import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action_id = params.id;
  const body = await req.json();
  const { verification_method, proof_data, action_level } = body;

  // Fetch the action
  const { data: action, error: actionErr } = await admin
    .from('sprint_actions')
    .select('*, sprints(id, goal_id, user_id)')
    .eq('id', action_id)
    .maybeSingle();

  if (actionErr || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }

  // Ensure the sprint belongs to the user
  if (action.sprints?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let verified   = false;
  let confidence = 0;
  let message    = '';

  // ── Verification logic ──────────────────────────────────────────────────────

  if (action_level === 2 || action_level === 3) {
    // Pathfinder / Trailblazer — auto-approve
    verified   = true;
    confidence = 90;
    message    = 'Action verified. Great work!';
  } else if (verification_method === 'text') {
    // Text — check length + relevance via Claude
    const text = typeof proof_data === 'string' ? proof_data : '';
    if (text.length < 50) {
      return NextResponse.json({
        verified: false,
        confidence: 0,
        message: 'Please write at least 50 characters describing what you completed.',
      });
    }
    try {
      const msg = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system: 'You are Spirit, verifying that a user completed a GPS action. Respond only with valid JSON.',
        messages: [
          {
            role: 'user',
            content: `Action: ${action.title}\nVerification method: text\nProof submitted: "${text}"\n\nDid the user complete this action? Respond with JSON: {"verified": boolean, "confidence": 0-100, "message": string}`,
          },
        ],
      });
      const raw = (msg.content[0] as any).text ?? '{}';
      const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      verified   = result.verified   ?? (text.length >= 50);
      confidence = result.confidence ?? 70;
      message    = result.message    ?? 'Verification complete.';
    } catch {
      // Fallback: length check
      verified   = text.length >= 50;
      confidence = verified ? 70 : 0;
      message    = verified ? 'Looks good!' : 'Provide more detail.';
    }
  } else if (
    verification_method === 'social_url' &&
    typeof proof_data === 'string' &&
    proof_data.startsWith('http')
  ) {
    // Social URL — basic existence check then auto-verify
    try {
      const fetchRes = await fetch(proof_data, { method: 'HEAD', redirect: 'follow' });
      verified   = fetchRes.ok || fetchRes.status < 400;
      confidence = verified ? 80 : 20;
      message    = verified ? 'URL verified. Content found!' : 'Could not reach the URL. Please check the link.';
    } catch {
      verified   = false;
      confidence = 0;
      message    = 'Could not reach that URL. Please try again.';
    }
  } else if (
    typeof proof_data === 'string' &&
    proof_data.startsWith('data:image')
  ) {
    // Image — Claude vision for Wayfinder (level 1), auto-approve otherwise
    if (action_level === 1) {
      try {
        const base64 = proof_data.split(',')[1];
        const mediaType = (proof_data.match(/data:(image\/\w+);/) ?? [])[1] as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp'
          | undefined;

        const msg = await claude.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 300,
          system: 'You are Spirit, verifying that a user completed a GPS action. Respond only with valid JSON.',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType ?? 'image/jpeg',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: `Action: ${action.title}\nVerification method: ${verification_method}\nProof submitted: [image above]\n\nDid the user complete this action? Respond with JSON: {"verified": boolean, "confidence": 0-100, "message": string}`,
                },
              ],
            },
          ],
        });
        const raw = (msg.content[0] as any).text ?? '{}';
        const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
        verified   = result.verified   ?? true;
        confidence = result.confidence ?? 85;
        message    = result.message    ?? 'Image verified by Spirit.';
      } catch {
        verified   = true;
        confidence = 80;
        message    = 'Verification accepted.';
      }
    } else {
      verified   = true;
      confidence = 90;
      message    = 'Proof received. Action verified!';
    }
  } else {
    // Document, screenshot, or unrecognised — auto-approve
    verified   = true;
    confidence = 85;
    message    = 'Proof received. Action verified!';
  }

  if (!verified) {
    return NextResponse.json({ verified, confidence, message, sprintCompleted: false, vlgEarned: 0 });
  }

  // ── Mark action complete ────────────────────────────────────────────────────
  await admin
    .from('sprint_actions')
    .update({
      status:      'complete',
      verified_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', action_id);

  // ── Check if all actions in sprint are complete ──────────────────────────────
  const { data: allActions } = await admin
    .from('sprint_actions')
    .select('id, status')
    .eq('sprint_id', action.sprint_id);

  const updatedActions = (allActions ?? []).map((a: any) =>
    a.id === action_id ? { ...a, status: 'complete' } : a
  );
  const sprintCompleted = updatedActions.every((a: any) => a.status === 'complete');

  if (sprintCompleted) {
    await admin
      .from('sprints')
      .update({ status: 'complete', completed_at: new Date().toISOString() })
      .eq('id', action.sprint_id);
  }

  // ── Award $VLG ──────────────────────────────────────────────────────────────
  const vlgAmount = 10;
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/vlg/earn`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body:    JSON.stringify({ reason: 'action_verified', amount: vlgAmount, source_id: action_id }),
  }).catch(() => {});

  // Fallback: directly update balance tables so VLG always lands even if fetch fails
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('vlg_balance')
      .eq('id', user.id)
      .maybeSingle();
    const current = parseFloat(profile?.vlg_balance ?? '0') || 0;
    await admin.from('profiles').update({ vlg_balance: current + vlgAmount }).eq('id', user.id);
    await admin.from('vlg_transactions').insert({
      user_id:   user.id,
      amount:    vlgAmount,
      reason:    'action_verified',
      source_id: action_id,
    }).catch(() => {});
  } catch { /* silent */ }

  return NextResponse.json({
    verified,
    confidence,
    message,
    sprintCompleted,
    vlgEarned: vlgAmount,
  });
}
