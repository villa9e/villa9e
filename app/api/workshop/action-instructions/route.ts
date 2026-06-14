// Workshop — Wayfinder instruction sheet for a sprint action.
// Generates a detailed, step-by-step "do exactly this" guide via Claude
// (spec WORKSHOP_SPEC §7.1: word for word, what to wear, how to fill out
// documents) and caches it in action_instruction_sheets so it's only
// generated once per action.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export const maxDuration = 60;

async function getUser(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user: cookieUser } } = await supabase.auth.getUser();
  if (cookieUser) return cookieUser;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7));
    if (tokenUser) return tokenUser;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { actionId, actionTitle, actionDescription, goalTitle, goalCategory } = await req.json();
  if (!actionId || !actionTitle) {
    return NextResponse.json({ error: 'Missing actionId or actionTitle' }, { status: 400 });
  }

  const admin = createAdminClient() as any;

  const { data: cached } = await admin
    .from('action_instruction_sheets')
    .select('content')
    .eq('action_id', actionId)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ content: cached.content, cached: true });
  }

  const prompt = `A villager is about to do this specific action as part of their goal plan:

Goal: "${goalTitle ?? 'their goal'}" (category: ${goalCategory ?? 'general'})
Action: "${actionTitle}"
${actionDescription ? `Action details: ${actionDescription}` : ''}

Write a detailed, step-by-step "do exactly this" guide for completing this action. Be concrete and practical:
- Number each step in the order they should be done
- Where relevant, include word-for-word scripts (what to say, what to write), what to bring/wear, and how to fill out any forms or applications
- Call out common mistakes to avoid
- Keep it focused on THIS action only, not the whole goal

Write in plain text with numbered steps and short paragraphs. No markdown headers, no JSON — just the guide itself, ready to read on a phone screen. Aim for 150-300 words.`;

  const content = await callClaude(prompt, { returnRaw: true, maxTokens: 1024 });

  await admin.from('action_instruction_sheets').insert({ action_id: actionId, content });

  return NextResponse.json({ content, cached: false });
}
