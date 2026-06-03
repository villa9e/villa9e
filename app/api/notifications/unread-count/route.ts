import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  // Try read_at first (newer schema), fall back to read boolean (older schema)
  let count = 0;

  const { count: c1 } = await (supabase as any)
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (c1 !== null && c1 !== undefined) {
    count = c1;
  } else {
    // Fall back to read=false column
    const { count: c2 } = await (supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    count = c2 ?? 0;
  }

  return NextResponse.json({ count });
}
