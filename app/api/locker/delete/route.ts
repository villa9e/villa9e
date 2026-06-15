import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
export const dynamic = 'force-dynamic';

function generateReference() {
  return `GDPR-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: requests } = await admin
    .from('data_deletion_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false });

  return NextResponse.json({ requests: requests ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { scope, category } = await req.json();
  if (scope !== 'category' && scope !== 'full_account') {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }

  const reference_number = generateReference();
  const { data: request, error } = await admin
    .from('data_deletion_requests')
    .insert({ user_id: user.id, reference_number, scope, category: scope === 'category' ? category : null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ request });
}
