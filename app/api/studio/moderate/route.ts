// Content moderation — flags posts that violate community guidelines
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const admin = createAdminClient() as any;
  const { post_id, text, user_id } = await req.json();
  if (!post_id || !text) return NextResponse.json({ ok: true });

  try {
    const msg = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a content moderation assistant for villa9e, a goal-focused social platform.

Review this content and flag any violations of community guidelines:
- No hate speech, threats, or harassment
- No explicit sexual content
- No dangerous or illegal activities
- No spam or deceptive content
- No privacy violations (posting others' personal info)

Content to review: "${text}"

Return ONLY valid JSON:
{
  "flagged": false,
  "reason": null,
  "severity": null
}

If flagged, severity is: "low", "medium", or "high"
reason is a brief explanation if flagged, null if clean.`,
      }],
    });

    const txt = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    let result: any = { flagged: false };
    try { result = JSON.parse(txt.match(/\{[\s\S]+\}/)?.[0] ?? '{}'); } catch { /* ignore */ }

    if (result.flagged) {
      await admin.from('studio_posts').update({
        is_flagged:  true,
        flag_reason: result.reason ?? 'Content policy violation',
        is_approved: result.severity === 'high' ? false : true,
      }).eq('id', post_id);

      // Notify user if flagged
      if (result.severity === 'high') {
        await admin.from('notifications').insert({
          user_id,
          type:           'moderation',
          title:          'Content under review',
          body:           `Your post was flagged: ${result.reason}`,
          reference_id:   post_id,
          reference_type: 'studio_post',
        }).catch(() => {});
      }
    }

    return NextResponse.json({ flagged: result.flagged, severity: result.severity });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
