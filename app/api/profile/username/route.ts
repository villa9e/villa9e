import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const USERNAME_RE = /^[a-z][a-z0-9_]{2,19}$/;
const RESERVED = new Set(['admin', 'villa9e', 'support', 'help', 'api', 'spirit', 'system', 'root']);

function validate(raw: string): string | null {
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return 'Username must be 3-20 characters: lowercase letters, numbers, underscores, starting with a letter.';
  }
  if (RESERVED.has(username)) {
    return 'That username is reserved.';
  }
  return null;
}

// GET /api/profile/username?u=<candidate> — availability check
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const candidate = (req.nextUrl.searchParams.get('u') ?? '').trim().toLowerCase();
  const error = validate(candidate);
  if (error) return NextResponse.json({ available: false, error });

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', candidate)
    .maybeSingle();

  if (data && data.id !== user.id) {
    return NextResponse.json({ available: false, error: 'That username is already taken.' });
  }
  return NextResponse.json({ available: true });
}

// POST /api/profile/username { username } — update, sitewide-unique (case-insensitive)
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? '').trim().toLowerCase();
  const error = validate(username);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id);

  if (updateError) {
    if (updateError.code === '23505') {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update username.' }, { status: 500 });
  }

  return NextResponse.json({ username });
}
