import { NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { CATEGORY_LABELS, dataCategoryToShareKey } from '@/lib/locker/constants';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rows } = await admin
    .from('data_access_audit')
    .select('*')
    .eq('user_id', user.id)
    .order('accessed_at', { ascending: false })
    .limit(200);

  const entries = (rows ?? []).map((row: any) => ({
    id: row.id,
    accessor: row.accessor_name,
    accessorType: row.accessor_type === 'buyer' ? 'buyer' : 'platform',
    category: CATEGORY_LABELS[dataCategoryToShareKey(row.data_category)] ?? row.data_category,
    purpose: row.access_purpose,
    legalBasis: row.legal_basis,
    accessedAt: row.accessed_at,
  }));

  return NextResponse.json({ entries });
}
