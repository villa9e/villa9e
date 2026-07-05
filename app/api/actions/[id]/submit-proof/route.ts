import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { awardVlg } from '@/lib/vlg/award';

const DIRECT_VERIFY_THRESHOLD = 75;

// ── TIER 1: Direct Claude vision ─────────────────────────────────────────────
async function directVerify(
  actionTitle: string,
  actionDescription: string | null,
  note: string,
  base64: string,
  mediaType: string
): Promise<{ verified: boolean; confidence: number; message: string }> {
  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: 'You are Spirit verifying a completed GPS action. Respond only with valid JSON.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
          {
            type: 'text',
            text: `Action: ${actionTitle}\n${actionDescription ? `Instructions: ${actionDescription}\n` : ''}User note: ${note || '(none)'}\n\nDoes this photo clearly show the user completed this specific action? Respond with JSON: {"verified": boolean, "confidence": 0-100, "message": string}`,
          },
        ],
      }],
    });
    const raw = (msg.content[0] as any).text ?? '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return {
      verified:   result.verified   ?? false,
      confidence: result.confidence ?? 0,
      message:    result.message    ?? 'Spirit reviewed your proof.',
    };
  } catch {
    return { verified: false, confidence: 0, message: 'Spirit could not review the image.' };
  }
}

// ── TIER 2: Spirit designs a scientific proof test ────────────────────────────
async function designProofTest(
  actionTitle: string,
  actionDescription: string | null,
  proofType: 'image' | 'video',
  aiMessage: string
): Promise<{ test_type: 'text' | 'image'; test_prompt: string } | null> {
  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: `You are Spirit, an AI coach. A user submitted proof of completing a goal action but it couldn't be directly verified.

Your job: design a SCIENTIFIC VERIFICATION TEST — a controlled demonstration that produces physical evidence causally connected to the action having been done. Think like a scientist designing an experiment, not a teacher writing a quiz.

The test must:
1. Be a specific physical demonstration only someone who DID the action could produce
2. Take under 2 minutes to complete
3. Generate evidence you can analyze with ≥75% confidence
4. Feel natural — "show me X" or "do Y right now" not "answer this question"

Good test types:
- "Open the book to the exact page you reached and photograph it so the text is readable"
- "Take a 15-second video doing 5 [reps/laps] right now to prove your current capability"
- "Screenshot your actual progress screen / completion screen / timestamp"
- "Photograph the specific output you created (the sketch, the code, the writing) up close"
- "Take a photo holding the finished product with today's date visible on a clock or screen"

Bad test types (do NOT use):
- Multiple choice or trivia questions ("What was the main idea?")
- Essay questions ("Describe what you learned")
- Anything that a non-doer could answer by guessing or Googling

Prefer image tests — they produce richer evidence. Use text only if a physical demonstration is truly not possible.

If no meaningful scientific demonstration is possible, return can_test: false.
Respond ONLY with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Action: "${actionTitle}"${actionDescription ? `\nDetails: ${actionDescription}` : ''}\nProof type submitted: ${proofType}\nAI review note: ${aiMessage}\n\nDesign the verification experiment. Respond: {"can_test": boolean, "test_type": "text" | "image", "test_prompt": string, "rationale": string}`,
      }],
    });
    const raw = (msg.content[0] as any).text ?? '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    if (!result.can_test) return null;
    if (!result.test_prompt || !result.test_type) return null;
    return { test_type: result.test_type as 'text' | 'image', test_prompt: result.test_prompt };
  } catch {
    return null;
  }
}

// ── TIER 3: Post to DreamLine for community co-sign ───────────────────────────
async function postToDreamLine(
  admin: any,
  userId: string,
  goalId: string | null,
  actionTitle: string,
  note: string,
  publicUrl: string,
  proofType: 'image' | 'video',
  actionId: string,
  confidence: number,
  aiMessage: string,
  tier: number
): Promise<{ verificationId: string; dreamlinePostId: string }> {
  const { data: post } = await admin.from('dream_line_posts').insert({
    user_id:        userId,
    goal_id:        goalId,
    content:        `Can you help verify I completed this action? "${actionTitle}"${note ? `\n\n${note}` : ''}`,
    media_urls:     [publicUrl],
    media_types:    [proofType],
    is_milestone:   true,
    milestone_type: 'verification_request',
  }).select('id').single();

  const { data: verification } = await admin.from('action_verifications').insert({
    action_id:         actionId,
    user_id:           userId,
    proof_url:         publicUrl,
    proof_type:        proofType,
    ai_confidence:     confidence,
    ai_message:        aiMessage,
    status:            'pending',
    verification_tier: tier,
    dreamline_post_id: post?.id ?? null,
  }).select('id').single();

  return { verificationId: verification?.id ?? '', dreamlinePostId: post?.id ?? '' };
}

// ── Post DreamLine celebration after Spirit-verified action ───────────────────
async function postVerifiedCelebration(
  admin: any,
  userId: string,
  goalId: string | null,
  actionTitle: string,
  proofUrl: string,
  vlgEarned: number
) {
  await admin.from('dream_line_posts').insert({
    user_id:        userId,
    goal_id:        goalId,
    content:        `Just verified: "${actionTitle}" — Spirit confirmed it. +${vlgEarned} $VLG mined.`,
    media_urls:     proofUrl ? [proofUrl] : [],
    media_types:    proofUrl ? ['image'] : [],
    is_milestone:   true,
    milestone_type: 'step_completed',
  }).catch(() => {});
}

// ── Mark action + sprint complete ─────────────────────────────────────────────
async function completeAction(admin: any, action: any, actionId: string): Promise<boolean> {
  await admin.from('sprint_actions').update({
    completed: true, completed_at: new Date().toISOString(),
  }).eq('id', actionId);

  const { data: allActions } = await admin
    .from('sprint_actions').select('id, completed').eq('sprint_id', action.sprint_id);
  const updated = (allActions ?? []).map((a: any) =>
    a.id === actionId ? { ...a, completed: true } : a
  );
  const sprintCompleted = updated.every((a: any) => a.completed === true);
  if (sprintCompleted) {
    await admin.from('sprints').update({
      status: 'complete', completed_at: new Date().toISOString(),
    }).eq('id', action.sprint_id);
  }
  return sprintCompleted;
}

// ── POST /api/actions/[id]/submit-proof ───────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action_id = params.id;

  const { data: action, error: actionErr } = await admin
    .from('sprint_actions')
    .select('*, sprints(id, goal_id, user_id, goals(vlg_per_action))')
    .eq('id', action_id)
    .maybeSingle();

  if (actionErr || !action) return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  if (action.sprints?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const VLG_AMOUNT: number = action.sprints?.goals?.vlg_per_action ?? 10;
  const goalId = action.sprints?.goal_id ?? null;

  const formData = await req.formData();
  const file = formData.get('proof') as File | null;
  const note = (formData.get('note') as string | null) ?? '';

  if (!file) return NextResponse.json({ error: 'No proof file provided' }, { status: 400 });

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) return NextResponse.json({ error: 'Proof must be a photo or video' }, { status: 400 });

  const maxSize = isVideo ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: `File must be under ${maxSize / (1024 * 1024)}MB` }, { status: 400 });

  const ext  = (file.name.split('.').pop() ?? (isImage ? 'jpg' : 'mp4')).toLowerCase();
  const path = `${user.id}/${action_id}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await admin.storage
    .from('action-proofs')
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadErr) return NextResponse.json({ error: 'Upload failed — please try again' }, { status: 500 });

  const { data: { publicUrl } } = admin.storage.from('action-proofs').getPublicUrl(path);
  const proofType: 'image' | 'video' = isImage ? 'image' : 'video';

  // ── TIER 1: Direct AI vision (images only) ────────────────────────────────
  let directResult = { verified: false, confidence: 0, message: '' };

  if (isImage) {
    const base64 = Buffer.from(bytes).toString('base64');
    directResult = await directVerify(action.title, action.description ?? null, note, base64, file.type || 'image/jpeg');
  } else {
    directResult.message = 'Video proof received.';
  }

  if (isImage && directResult.verified && directResult.confidence >= DIRECT_VERIFY_THRESHOLD) {
    const sprintCompleted = await completeAction(admin, action, action_id);
    await awardVlg(user.id, VLG_AMOUNT, 'action_verified', action_id);
    await postVerifiedCelebration(admin, user.id, goalId, action.title, publicUrl, VLG_AMOUNT);
    return NextResponse.json({
      status: 'verified',
      tier: 1,
      verified: true,
      confidence: directResult.confidence,
      message: directResult.message,
      proofUrl: publicUrl,
      sprintCompleted,
      vlgEarned: VLG_AMOUNT,
    });
  }

  // ── TIER 2: Spirit designs a proof test ──────────────────────────────────
  const proofTest = await designProofTest(
    action.title, action.description ?? null, proofType, directResult.message
  );

  if (proofTest) {
    const { data: verification } = await admin.from('action_verifications').insert({
      action_id,
      user_id:            user.id,
      proof_url:          publicUrl,
      proof_type:         proofType,
      ai_confidence:      directResult.confidence,
      ai_message:         directResult.message,
      status:             'proof_test_required',
      verification_tier:  2,
      proof_test_type:    proofTest.test_type,
      proof_test_prompt:  proofTest.test_prompt,
    }).select('id').single();

    return NextResponse.json({
      status: 'proof_test_required',
      tier: 2,
      verified: false,
      confidence: directResult.confidence,
      message: directResult.message,
      proofUrl: publicUrl,
      verificationId: verification?.id ?? null,
      proofTest: { type: proofTest.test_type, prompt: proofTest.test_prompt },
    });
  }

  // ── TIER 3: DreamLine community co-sign ──────────────────────────────────
  const { verificationId, dreamlinePostId } = await postToDreamLine(
    admin, user.id, goalId, action.title, note,
    publicUrl, proofType, action_id,
    directResult.confidence, directResult.message, 3
  );

  return NextResponse.json({
    status: 'pending',
    tier: 3,
    verified: false,
    confidence: directResult.confidence,
    message: isImage
      ? `${directResult.message} Sharing to your DreamLine — ask 3 friends to confirm.`
      : 'Sharing your video to DreamLine — ask 3 friends to confirm it.',
    proofUrl: publicUrl,
    verificationId,
    dreamlinePostId,
    votesRequired: 3,
  });
}
