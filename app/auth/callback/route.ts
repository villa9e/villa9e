import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  // OAuth / magic-link error passed back by Supabase
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = createServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Safety net: ensure profile exists (trigger may not have fired for OAuth)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete, username')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Profile missing — create it (trigger should have done this, but just in case)
        const rawMeta = user.user_metadata ?? {};
        const fallbackUsername = rawMeta.username
          || rawMeta.name?.toLowerCase().replace(/\s+/g, '_')
          || `villager_${user.id.slice(0, 8)}`;
        await supabase.from('profiles').upsert({
          id:           user.id,
          username:     fallbackUsername,
          display_name: rawMeta.full_name || rawMeta.name || 'New Villager',
          avatar_url:   rawMeta.avatar_url || rawMeta.picture || null,
        }, { onConflict: 'id' });
      }

      if (!profile?.onboarding_complete) {
        return NextResponse.redirect(`${origin}/onboarding/spirit`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/village/workshop`);
}
