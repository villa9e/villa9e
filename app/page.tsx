import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_complete) {
      redirect('/village/map');
    } else {
      redirect('/onboarding/spirit');
    }
  }

  redirect('/login');
}
