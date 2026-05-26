import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { verifyCredential } from '@/lib/credentials/verify';
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit';

// POST /api/credentials/verify
// Verifies a professional credential and creates/updates a provider_profile
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await rateLimit(`cred-verify:${user.id}`, 5, 60_000))) return rateLimitResponse();

  const body = await req.json();
  const {
    credential_type, license_number, license_state,
    first_name, last_name, npi_number, business_name,
    document_url, specialty, bio, session_rate,
  } = body;

  if (!credential_type) return NextResponse.json({ error: 'credential_type is required' }, { status: 400 });

  // Run verification
  const result = await verifyCredential({
    credential_type, license_number, license_state,
    first_name, last_name, npi_number, document_url,
  });

  const admin = createAdminClient();

  // Get user's display name for the provider profile
  const { data: profile } = await (admin as any).from('profiles')
    .select('display_name, username').eq('id', user.id).single();

  // Upsert provider profile
  const { data: provider, error: provErr } = await (admin as any)
    .from('provider_profiles')
    .upsert({
      user_id:              user.id,
      display_name:         [first_name, last_name].filter(Boolean).join(' ') || profile?.display_name || profile?.username,
      business_name:        business_name ?? null,
      credential_type:      credential_type as any,
      license_number:       license_number ?? null,
      license_state:        license_state ?? null,
      npi_number:           npi_number ?? null,
      npi_verified:         result.source === 'nppes_api' && result.verified,
      specialty:            result.specialty ?? specialty ?? null,
      bio:                  bio ?? null,
      session_rate:         session_rate ?? null,
      verification_status:  result.status as any,
      verification_date:    result.verified ? new Date().toISOString() : null,
      verification_source:  result.source,
      verification_data:    result.raw_data,
      documents_uploaded:   document_url ? [document_url] : [],
      updated_at:           new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('id').single();

  if (provErr) {
    return NextResponse.json({ error: provErr.message }, { status: 500 });
  }

  // Log the verification attempt
  await (admin as any).from('credential_verifications').insert({
    provider_id:     provider.id,
    user_id:         user.id,
    credential_type: credential_type as any,
    license_number:  license_number,
    api_source:      result.source,
    api_response:    result.raw_data,
    ai_analysis:     result.source === 'claude_ai_document' ? result.raw_data : {},
    result:          result.status as any,
    notes:           result.notes,
  });

  // If auto-verified: create a draft storefront in Trading Post
  if (result.status === 'auto_verified' && provider.id) {
    await (admin as any).from('provider_storefronts').upsert({
      provider_id: provider.id,
      user_id:     user.id,
      title:       [first_name, last_name].filter(Boolean).join(' ') + (specialty ? ` — ${specialty}` : ''),
      is_published: false,  // they still need to fill out services
    }, { onConflict: 'provider_id' });

    // Award VLG for verification
    await admin.rpc('award_village_score', {
      p_user_id: user.id, p_points: 25, p_vlg: 100,
      p_reason: 'PROVIDER_VERIFIED', p_reference_id: provider.id,
    }).catch(() => {});

    // Notify
    await (admin as any).from('notifications').insert({
      user_id: user.id, type: 'goal_step',
      title:   '✅ Credential Verified!',
      body:    'Your professional credential has been verified. Your Trading Post storefront is ready to set up.',
      reference_id: provider.id, reference_type: 'provider',
    });
  } else if (result.status === 'manual_review') {
    await (admin as any).from('notifications').insert({
      user_id: user.id, type: 'goal_step',
      title:   '📋 Credential Under Review',
      body:    'Your credential is being reviewed by our team. We\'ll notify you within 24–48 hours.',
      reference_id: provider.id, reference_type: 'provider',
    });
  }

  return NextResponse.json({
    ok:          true,
    provider_id: provider.id,
    verified:    result.verified,
    status:      result.status,
    confidence:  result.confidence,
    source:      result.source,
    specialty:   result.specialty,
    notes:       result.notes,
    name_match:  result.name_match,
    expiry_date: result.expiry_date,
  });
}

// GET /api/credentials/verify?provider_id=xxx
// Returns current verification status for a provider
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: provider } = await (supabase as any).from('provider_profiles')
    .select('verification_status, verification_date, verification_source, npi_verified, specialty, credential_type')
    .eq('user_id', user.id).single();

  return NextResponse.json(provider ?? { verification_status: 'not_started' });
}
