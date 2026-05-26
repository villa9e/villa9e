import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_complete) redirect('/village/map');
    else redirect('/onboarding/spirit');
  }

  // Get founding villager count for social proof
  const { data: counter } = await supabase.from('founding_villager_counter').select('count,max_count').eq('id', 1).single();
  const villagerCount = counter?.count ?? 0;
  const spotsLeft = Math.max(0, (counter?.max_count ?? 1000) - villagerCount);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛺</span>
          <span className="text-xl font-bold text-village-blue">villa9e</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 py-2 px-4">Sign in</Link>
          <Link href="/signup" className="village-btn-primary text-sm py-2 px-5">Join Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        {spotsLeft > 0 && (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-4 py-2 rounded-full mb-6">
            <span>👑</span>
            <span>{spotsLeft} Founding Villager spots left · Get 500 $VLG bonus at launch</span>
          </div>
        )}

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          It takes a village
          <br />
          <span className="text-village-blue">to achieve your goals.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          villa9e is a GPS system for your goals — powered by AI, validated by community. Set a goal. Build your plan. Get OoWops from your village as you complete every step.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link href="/signup" className="village-btn-primary text-lg px-8 py-4 rounded-2xl">
            🏡 Join the Village Free
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-600 text-lg px-8 py-4 rounded-2xl hover:bg-gray-50 transition-colors">
            Sign in →
          </Link>
        </div>
        <p className="text-sm text-gray-400">No credit card. Free forever.</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How villa9e works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: '📡', step: '1', title: 'Set your goal', desc: 'Tell Spirit what you want to achieve. It builds a GPS plan — steps, timeline, resources, probability score.' },
              { icon: '✊', step: '2', title: 'Get OoWops', desc: 'As you complete steps, villagers validate your progress with OoWops. 3 OoWops = step validated. You both earn $VLG.' },
              { icon: '🏆', step: '3', title: 'Earn & grow', desc: 'Your village score rises. Unlock credit, investing, and real token at Phase 3 (50k+ villagers).' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl village-gradient flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Locations */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">8 spaces. One village.</h2>
          <p className="text-center text-gray-500 mb-12">Everything you need to achieve any goal — all in one place.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🔨', name: 'Workshop', desc: 'Goal GPS Engine' },
              { icon: '✨', name: 'Dream Line', desc: 'Progress Feed' },
              { icon: '🏦', name: 'Bank', desc: 'Wallet & Funding' },
              { icon: '🤝', name: 'Trading Post', desc: 'Skills & Services' },
              { icon: '👥', name: 'Tribes', desc: 'Project Teams' },
              { icon: '📅', name: 'Spaces', desc: 'Events & Calendar' },
              { icon: '🌿', name: 'Zen', desc: 'Wellness & Spirit' },
              { icon: '🏥', name: 'Hospital', desc: 'Licensed Providers' },
            ].map(loc => (
              <div key={loc.name} className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:shadow-md transition-shadow">
                <p className="text-3xl mb-2">{loc.icon}</p>
                <p className="font-bold text-sm">{loc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{loc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="village-gradient py-20 px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Your village is waiting.</h2>
          <p className="text-blue-100 mb-8">Every goal is better when you don't do it alone. Join free — and be among the first 1,000 Founding Villagers.</p>
          <Link href="/signup" className="bg-white text-village-blue font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors inline-block">
            🏡 Join the Village
          </Link>
          <p className="text-blue-200 text-sm mt-4">villa9e · Powered by Legaci Jackson · Anthropic Claude AI</p>
        </div>
      </section>
    </div>
  );
}
