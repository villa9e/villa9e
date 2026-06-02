import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content, post_type } = await req.json();
  if (!post_id || !content) {
    return NextResponse.json({ error: 'Missing post_id or content' }, { status: 400 });
  }

  // Ensure ai_keywords column exists
  try {
    await (admin as any).rpc('run_sql', {
      sql: `ALTER TABLE dream_line_posts ADD COLUMN IF NOT EXISTS ai_keywords text[] DEFAULT '{}'::text[];`,
    });
  } catch {
    // Column may already exist or RPC not available — continue
  }

  const prompt = `Generate 3-5 short, relevant keywords for this villa9e DreamLine post.

Post type: ${post_type ?? 'general'}
Content: "${content}"

Keywords help position the post in Workshop search and discovery. Focus on:
- The goal category or skill (e.g. "fitness", "real estate", "coding")
- The action or milestone type (e.g. "sprint win", "accountability", "how-to")
- The community value (e.g. "motivation", "side hustle", "mental health")

Return JSON ONLY:
{ "keywords": ["keyword1", "keyword2", "keyword3"] }`;

  let keywords: string[] = [];
  try {
    const result = await callClaude(prompt);
    keywords = Array.isArray(result?.keywords) ? result.keywords.slice(0, 5) : [];
  } catch {
    keywords = [];
  }

  // Save to post
  if (keywords.length > 0) {
    await (admin as any)
      .from('dream_line_posts')
      .update({ ai_keywords: keywords })
      .eq('id', post_id);
  }

  return NextResponse.json({ keywords });
}
