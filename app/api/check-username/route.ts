import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle')?.toLowerCase().trim();

  if (!handle) {
    return NextResponse.json({ available: false, error: 'handle required' }, { status: 400 });
  }

  // Validate format: 3-20 chars, letters/numbers/underscores only
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
    return NextResponse.json({ available: false, error: 'Invalid format' });
  }

  // Reserved words
  const RESERVED = ['admin', 'api', 'support', 'help', 'village', 'bank', 'login', 'signup', 'official', 'staff', 'mod'];
  if (RESERVED.includes(handle)) {
    return NextResponse.json({ available: false });
  }

  const supabase = createServerClient();
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id')
    .ilike('username', handle)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }

  return NextResponse.json({ available: data === null });
}
