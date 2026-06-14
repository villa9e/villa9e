// Workshop — record a "skip" / "not interested" signal for a feed card
// (WORKSHOP_SPEC §5.3). Increments a per-user, per-card skip count which
// the Workshop feed uses to de-prioritize (1-2 skips) or hide (3+ skips)
// that card on future loads.
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

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

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });

  const admin = createAdminClient() as any;

  const { data: existing } = await admin
    .from('card_skips')
    .select('skip_count')
    .eq('user_id', user.id).eq('card_id', cardId)
    .maybeSingle();

  const skipCount = (existing?.skip_count ?? 0) + 1;

  await admin.from('card_skips').upsert(
    { user_id: user.id, card_id: cardId, skip_count: skipCount, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,card_id' }
  );

  return NextResponse.json({ skipCount });
}
