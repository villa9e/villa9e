// Creator Studio — AI transcript + keyword generation
// Called async after post creation. Uses Claude to analyze and generate keywords.
// Full speech-to-text requires Whisper/AssemblyAI — placeholder generates from caption.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const admin = createAdminClient() as any;
  const { post_id, media_url } = await req.json();
  if (!post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

  // Get post data for context
  const { data: post } = await admin.from('studio_posts').select('caption, post_label, goal_id').eq('id', post_id).single();
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  try {
    const msg = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Analyze this villa9e content post and generate metadata for discoverability.

Post type: ${post.post_label ?? 'general'}
Caption: "${post.caption ?? 'No caption'}"
${media_url ? `Media URL: ${media_url}` : ''}

Return ONLY valid JSON:
{
  "keywords": ["keyword1", "keyword2"],
  "summary": "One sentence summary of this content",
  "workshopCategory": "category if this is workshop content, null if not",
  "captions": []
}

Keywords should be specific and searchable (5-10 keywords max).
If this is an action how-to or product review, workshopCategory should describe the topic.
captions array is empty for now (requires speech-to-text service).`,
      }],
    });

    const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(txt.match(/\{[\s\S]+\}/)?.[0] ?? '{}'); } catch { /* ignore */ }

    // Save transcript record
    await admin.from('post_transcripts').upsert({
      post_id,
      transcript:  null,
      captions:    parsed.captions ?? [],
      keywords:    parsed.keywords ?? [],
      language:    'en',
    }, { onConflict: 'post_id' });

    // Update post with AI keywords + summary
    await admin.from('studio_posts').update({
      ai_keywords:      parsed.keywords ?? [],
      ai_summary:       parsed.summary ?? null,
      workshop_category: parsed.workshopCategory ?? null,
    }).eq('id', post_id);

    return NextResponse.json({ success: true, keywords: parsed.keywords });
  } catch {
    return NextResponse.json({ success: false });
  }
}
