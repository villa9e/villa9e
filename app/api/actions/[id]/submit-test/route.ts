import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { awardVlg } from '@/lib/vlg/award';

const TEST_PASS_THRESHOLD = 70;

async function gradeTextResponse(
  actionTitle: string,
  testPrompt: string,
  userAnswer: string
): Promise<{ passed: boolean; confidence: number; message: string }> {
  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: `You are Spirit, analyzing a user's response to a scientific verification test. This is not a quiz — the demonstration was designed so that only someone who actually completed the action could produce this specific response. Evaluate whether the response is causally consistent with having done the action. Look for concrete, specific details that couldn't be fabricated without doing it. Respond only with valid JSON.`,
      messages: [{
        role: 'user',
        content: `Action: "${actionTitle}"\nVerification test: "${testPrompt}"\nUser's demonstration response: "${userAnswer}"\n\nDoes this response show the user actually completed the action? Respond: {"passed": boolean, "confidence": 0-100, "message": string}`,
      }],
    });
    const raw = (msg.content[0] as any).text ?? '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return {
      passed:     result.passed     ?? false,
      confidence: result.confidence ?? 0,
      message:    result.message    ?? 'Spirit reviewed your demonstration.',
    };
  } catch {
    return { passed: false, confidence: 0, message: 'Spirit could not analyze the response.' };
  }
}

async function gradeImageResponse(
  actionTitle: string,
  testPrompt: string,
  base64: string,
  mediaType: string
): Promise<{ passed: boolean; confidence: number; message: string }> {
  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: `You are Spirit, analyzing a follow-up photo from a scientific verification test. The photo was requested as a controlled demonstration — it should contain specific physical evidence that only someone who completed the action could produce. Evaluate whether the photo causally proves the action was done, not just that it's plausible. Respond only with valid JSON.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
          {
            type: 'text',
            text: `Action: "${actionTitle}"\nVerification test instruction: "${testPrompt}"\n\nDoes this photo satisfy the verification test and prove the action was completed? Respond: {"passed": boolean, "confidence": 0-100, "message": string}`,
          },
        ],
      }],
    });
    const raw = (msg.content[0] as any).text ?? '{}';
    const result = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return {
      passed:     result.passed     ?? false,
      confidence: result.confidence ?? 0,
      message:    result.message    ?? 'Spirit analyzed your photo.',
    };
  } catch {
    return { passed: false, confidence: 0, message: 'Spirit could not analyze the photo.' };
  }
}

async function escalateToDreamLine(
  admin: any,
  verification: any,
  userId: string,
  action: any,
  gradeMessage: string
): Promise<{ dreamlinePostId: string }> {
  const { data: post } = await admin.from('dream_line_posts').insert({
    user_id:        userId,
    goal_id:        action.sprints?.goal_id ?? null,
    content:        `Can you help verify I completed this action? "${action.title}"`,
    media_urls:     [verification.proof_url],
    media_types:    [verification.proof_type],
    is_milestone:   true,
    milestone_type: 'verification_request',
  }).select('id').single();

  await admin.from('action_verifications').update({
    status:             'pending',
    verification_tier:  3,
    proof_test_message: gradeMessage,
    dreamline_post_id:  post?.id ?? null,
  }).eq('id', verification.id);

  return { dreamlinePostId: post?.id ?? '' };
}

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

// ── POST /api/actions/[id]/submit-test ───────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action_id = params.id;

  const { data: action } = await admin
    .from('sprint_actions')
    .select('*, sprints(id, goal_id, user_id, goals(vlg_per_action))')
    .eq('id', action_id)
    .maybeSingle();

  if (!action || action.sprints?.user_id !== user.id) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }

  const VLG_AMOUNT: number = action.sprints?.goals?.vlg_per_action ?? 10;
  const goalId = action.sprints?.goal_id ?? null;

  const formData       = await req.formData();
  const verificationId = formData.get('verificationId') as string | null;
  const textResponse   = formData.get('text_response')  as string | null;
  const imageFile      = formData.get('proof')          as File | null;

  if (!verificationId) return NextResponse.json({ error: 'verificationId required' }, { status: 400 });

  const { data: verification } = await admin
    .from('action_verifications')
    .select('*')
    .eq('id', verificationId)
    .eq('action_id', action_id)
    .eq('user_id', user.id)
    .eq('status', 'proof_test_required')
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: 'Verification not found or already resolved' }, { status: 404 });
  }

  const testPrompt = verification.proof_test_prompt as string;
  const testType   = verification.proof_test_type   as 'text' | 'image';

  let grade: { passed: boolean; confidence: number; message: string };

  if (testType === 'text') {
    if (!textResponse?.trim()) return NextResponse.json({ error: 'Text response required' }, { status: 400 });

    grade = await gradeTextResponse(action.title, testPrompt, textResponse.trim());

    await admin.from('action_verifications').update({
      status:                 'proof_test_submitted',
      proof_test_response:    textResponse.trim(),
      proof_test_confidence:  grade.confidence,
      proof_test_message:     grade.message,
    }).eq('id', verificationId);

  } else {
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Photo required for this test' }, { status: 400 });
    }
    const bytes     = await imageFile.arrayBuffer();
    const base64    = Buffer.from(bytes).toString('base64');
    const mediaType = imageFile.type || 'image/jpeg';

    const ext  = (imageFile.name.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `${user.id}/${action_id}-test-${Date.now()}.${ext}`;
    await admin.storage.from('action-proofs').upload(path, bytes, { contentType: imageFile.type, upsert: true });
    const { data: { publicUrl } } = admin.storage.from('action-proofs').getPublicUrl(path);

    grade = await gradeImageResponse(action.title, testPrompt, base64, mediaType);

    await admin.from('action_verifications').update({
      status:                'proof_test_submitted',
      proof_test_response:   publicUrl,
      proof_test_confidence: grade.confidence,
      proof_test_message:    grade.message,
    }).eq('id', verificationId);
  }

  // ── PASS ─────────────────────────────────────────────────────────────────
  if (grade.passed && grade.confidence >= TEST_PASS_THRESHOLD) {
    const sprintCompleted = await completeAction(admin, action, action_id);
    await awardVlg(user.id, VLG_AMOUNT, 'action_verified', action_id);

    await admin.from('action_verifications').update({
      status: 'verified', resolved_at: new Date().toISOString(),
    }).eq('id', verificationId);

    // Celebrate on DreamLine
    await admin.from('dream_line_posts').insert({
      user_id:        user.id,
      goal_id:        goalId,
      content:        `Challenge passed: "${action.title}" — verified by Spirit. +${VLG_AMOUNT} $VLG mined.`,
      is_milestone:   true,
      milestone_type: 'step_completed',
    }).catch(() => {});

    return NextResponse.json({
      status: 'verified',
      tier: 2,
      verified: true,
      confidence: grade.confidence,
      message: grade.message,
      sprintCompleted,
      vlgEarned: VLG_AMOUNT,
    });
  }

  // ── FAIL → escalate to DreamLine ─────────────────────────────────────────
  const { dreamlinePostId } = await escalateToDreamLine(admin, verification, user.id, action, grade.message);

  return NextResponse.json({
    status: 'pending',
    tier: 3,
    verified: false,
    confidence: grade.confidence,
    message: `${grade.message} Sharing to your DreamLine — 3 friends can confirm it for you.`,
    dreamlinePostId,
    votesRequired: 3,
  });
}
