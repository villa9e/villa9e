import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 30;

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Auth check
  try {
    const supabase = createServerClient() as any;
    const { data: { user }, error } = await supabase.auth.getUser();
    results.auth = user ? { ok: true, id: user.id.slice(0, 8) + '...' } : { ok: false, error: error?.message ?? 'no user' };
    if (!user) {
      return NextResponse.json({ ok: false, results, message: 'Not authenticated — log in first.' }, { status: 401 });
    }
  } catch (e: any) {
    results.auth = { ok: false, error: e?.message };
    return NextResponse.json({ ok: false, results }, { status: 500 });
  }

  // 2. Supabase env vars
  results.env = {
    supabase_url:       !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key:  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role_key:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anthropic_api_key:  !!process.env.ANTHROPIC_API_KEY,
    anthropic_key_len:  process.env.ANTHROPIC_API_KEY?.trim().length ?? 0,
  };

  // 3. Claude ping
  try {
    const msg = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 10,
      messages:   [{ role: 'user', content: 'Say "ok".' }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    results.claude = { ok: true, model: CLAUDE_MODEL, response: text };
  } catch (e: any) {
    results.claude = {
      ok:      false,
      status:  e?.status,
      type:    e?.error?.type,
      message: e?.message,
    };
  }

  const allOk = results.auth.ok && results.claude.ok;
  return NextResponse.json({ ok: allOk, results }, { status: 200 });
}
