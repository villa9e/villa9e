import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = req.nextUrl.searchParams.get('item');
  if (!item) return NextResponse.json({ info: '' });

  try {
    const msg = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 180,
      system: `You are a friendly guide in a virtual village called villa9e. When asked about an item, give a 2-sentence real-world fact about it. Be educational, warm, and conversational. Do not start with "I" or "Sure". Get straight to the interesting fact.`,
      messages: [{ role: 'user', content: `Tell me about: ${item}` }],
    });

    const info = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return NextResponse.json({ info });
  } catch {
    return NextResponse.json({ info: `${item} is a fascinating element of the natural or built world.` });
  }
}
