import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

const AI_CONFIDENCE_THRESHOLD = 75;
const VLG_AMOUNT = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action_id = params.id;

  // Fetch the action
  const { data: action, error: actionErr } = await admin
    .from('sprint_actions')
    .select('*, sprints(id, goal_id, user_id)')
    .eq('id', action_id)
    .maybeSingle();

  if (actionErr || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.sprints?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('proof') as File | null;
  const note = (formData.get('note') as string | null) ?? '';
  if (!file) return NextResponse.json({ error: 'No proof file provided' }, { status: 400 });

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Proof must be a photo or video' }, { status: 400 });
  }
  const maxSize = isVideo ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File must be under ${maxSize / (1024 * 1024)}MB` }, { status: 400 });
  }

  // ── Upload proof to storage ─────────────────────────────────────────────────
  const ext = (file.name.split('.').pop() ?? (isImage ? 'jpg' : 'mp4')).toLowerCase();
  const path = `${user.id}/${action_id}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadErr } = await admin.storage
    .from('action-proofs')
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadErr) {
    return NextResponse.json({ error: 'Upload failed — please try again' }, { status: 500 });
  }
  const { data: { publicUrl } } = admin.storage.from('action-proofs').getPublicUrl(path);
  const proofType: 'image' | 'video' = isImage ? 'image' : 'video';

  // ── AI check (images only — Claude vision can't process video) ──────────────
  let verified = false;
  let confidence = 0;
  let message = '';

  if (isImage) {
    try {
      const base64 = Buffer.from(bytes).toString('base64');
      const mediaType = (file.type as
        | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg';

      const msg = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        system: 'You are Spirit, verifying that a user completed a GPS action. Respond only with valid JSON.',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              {
                type: 'text',
                text: `Action: ${action.title}\n${action.description ? `Instructions: ${action.description}\n` : ''}User note: ${note || '(none)'}\n\nDoes this photo show the user completed this action? Respond with JSON: {"verified": boolean, "confidence": 0-100, "message": string}`,
              },
            ],
          },
        ],
      });
      const raw = (msg.content[0] as any).text ?? '{}';
      const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      verified   = result.verified   ?? false;
      confidence = result.confidence ?? 0;
      message    = result.message    ?? 'Spirit reviewed your proof.';
    } catch {
      verified   = false;
      confidence = 0;
      message    = 'Spirit could not review the image automatically.';
    }
  } else {
    message = 'Video proof needs a few friends to confirm it.';
  }

  // ── High-confidence image: auto-complete + award $VLG ───────────────────────
  if (isImage && verified && confidence >= AI_CONFIDENCE_THRESHOLD) {
    await admin.from('sprint_actions').update({
      completed: true, completed_at: new Date().toISOString(),
    }).eq('id', action_id);

    const { data: allActions } = await admin
      .from('sprint_actions').select('id, completed').eq('sprint_id', action.sprint_id);
    const updated = (allActions ?? []).map((a: any) => a.id === action_id ? { ...a, completed: true } : a);
    const sprintCompleted = updated.every((a: any) => a.completed === true);
    if (sprintCompleted) {
      await admin.from('sprints').update({ status: 'complete', completed_at: new Date().toISOString() }).eq('id', action.sprint_id);
    }

    await awardVlg(admin, req, user.id, action_id, VLG_AMOUNT);

    return NextResponse.json({
      status: 'verified', verified: true, confidence, message, proofUrl: publicUrl,
      sprintCompleted, vlgEarned: VLG_AMOUNT,
    });
  }

  // ── Otherwise: post to DreamLine for 3-person co-sign verification ──────────
  const { data: post } = await admin.from('dream_line_posts').insert({
    user_id:        user.id,
    goal_id:        action.sprints?.goal_id ?? null,
    content:        `Can you help verify I completed this action? "${action.title}"${note ? `\n\n${note}` : ''}`,
    media_urls:     [publicUrl],
    media_types:    [proofType],
    is_milestone:   true,
    milestone_type: 'verification_request',
  }).select('id').single();

  const { data: verification } = await admin.from('action_verifications').insert({
    action_id,
    user_id:           user.id,
    proof_url:         publicUrl,
    proof_type:        proofType,
    ai_confidence:     isImage ? confidence : null,
    ai_message:        message,
    dreamline_post_id: post?.id ?? null,
  }).select('id').single();

  return NextResponse.json({
    status: 'pending',
    verified: false,
    confidence,
    message: isImage
      ? `${message} Sharing to your DreamLine — ask 3 friends to confirm.`
      : message,
    proofUrl: publicUrl,
    verificationId: verification?.id ?? null,
    dreamlinePostId: post?.id ?? null,
    votesRequired: 3,
  });
}

async function awardVlg(admin: any, req: NextRequest, userId: string, sourceId: string, amount: number) {
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/vlg/earn`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    body:    JSON.stringify({ reason: 'action_verified', amount, source_id: sourceId }),
  }).catch(() => {});

  try {
    const { data: profile } = await admin.from('profiles').select('vlg_balance').eq('id', userId).maybeSingle();
    const current = parseFloat(profile?.vlg_balance ?? '0') || 0;
    await admin.from('profiles').update({ vlg_balance: current + amount }).eq('id', userId);
    try {
      await admin.from('vlg_transactions').insert({ user_id: userId, amount, reason: 'action_verified', source_id: sourceId });
    } catch { /* non-blocking */ }
  } catch { /* silent */ }
}
