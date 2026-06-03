import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    businessName,
    businessType,
    category,
    hasPhysicalLocation,
    address,
    payoutPreference,
    estoreId,
  } = body;

  if (!businessName || !businessType || !category) {
    return NextResponse.json({ error: 'Missing required fields: businessName, businessType, category' }, { status: 400 });
  }

  // Look up the user's username for the merchant handle
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  const merchantHandle = profile?.username ?? `merchant_${user.id.slice(0, 8)}`;

  // Check if merchant account already exists
  const { data: existing } = await supabase
    .from('merchant_accounts')
    .select('id, merchant_handle')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      merchantId:     existing.id,
      merchantHandle: existing.merchant_handle,
      alreadyExists:  true,
    });
  }

  const { data: merchant, error } = await supabase
    .from('merchant_accounts')
    .insert({
      user_id:              user.id,
      store_name:           businessName,
      business_type:        businessType,
      category:             category,
      has_physical_location: hasPhysicalLocation ?? false,
      address:              address ?? null,
      payout_preference:    payoutPreference ?? 'hold',
      estore_id:            estoreId ?? null,
      merchant_handle:      merchantHandle,
      is_active:            true,
      is_verified:          false,
      created_at:           new Date().toISOString(),
    })
    .select('id, merchant_handle')
    .single();

  if (error) {
    console.error('Merchant onboarding error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    merchantId:     merchant.id,
    merchantHandle: merchant.merchant_handle,
  });
}
