import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { VillageLogo } from '@/components/brand/VillageLogo';
import { getAppConfig, cfg } from '@/lib/admin/getAppConfig';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single();
    if (profile?.onboarding_complete) redirect('/village/workshop');
    else redirect('/onboarding/spirit');
  }

  // Load live config from DB (falls back to defaults if table not seeded)
  const [counterRes, config] = await Promise.all([
    (supabase as any).from('founding_villager_counter').select('count,max_count').eq('id', 1).single(),
    getAppConfig(['home.hero.title','home.hero.subtitle','home.hero.cta_primary','home.founding.max','home.founding.bonus','brand.tagline']),
  ]);

  const counter = counterRes.data;
  const villagerCount = counter?.count ?? 0;
  const foundingMax   = cfg(config, 'home.founding.max',   counter?.max_count ?? 1000);
  const foundingBonus = cfg(config, 'home.founding.bonus', 500);
  const spotsLeft = Math.max(0, foundingMax - villagerCount);
  const pct = Math.round((villagerCount / foundingMax) * 100);
  const heroTitle    = cfg(config, 'home.hero.title',    'It takes a village to achieve your goals.');
  const heroSubtitle = cfg(config, 'home.hero.subtitle', 'Set a goal. AI builds your plan. Your village validates every step. Progress is a community sport.');
  const heroCta      = cfg(config, 'home.hero.cta_primary', '🏡 Enter the Village');

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 backdrop-blur-md bg-[#0a0e1a]/80 border-b border-white/5">
        <div className="flex items-center gap-2">
          <VillageLogo size={32} variant="circle" />
          <span className="text-lg font-black tracking-tight text-white">villa9e</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="text-sm text-white/60 hover:text-white py-2 px-3 transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm bg-[#1877F2] hover:bg-[#1565c0] text-white font-semibold py-2 px-4 rounded-full transition-colors">
            Join Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-16 overflow-hidden">
        {/* Ambient glow circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#1877F2]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-amber-500/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] bg-emerald-500/8 rounded-full blur-[80px]" />
        </div>

        {/* Tribal pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z'/%3E%3Cpath d='M30 15L45 30L30 45L15 30Z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Founding villager badge */}
          {spotsLeft > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {spotsLeft} Founding Villager spots left · {foundingBonus} $VLG bonus at launch
            </div>
          )}

          {/* Village logo */}
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
            <div className="absolute inset-0 rounded-full bg-[#1877F2]/20 animate-ping opacity-20" />
            <VillageLogo size={96} variant="circle" className="relative z-10 drop-shadow-2xl" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-5">
            <span className="text-white">{heroTitle.split(' to ')[0] ?? 'It takes a village'}</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #1877F2, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {heroTitle.includes(' to ') ? 'to ' + heroTitle.split(' to ').slice(1).join(' to ') : 'to achieve your goals.'}
            </span>
          </h1>

          <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(24,119,242,0.3)]">
              {heroCta}
            </Link>
            <Link href="/login"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-base px-8 py-4 rounded-2xl transition-colors">
              Sign in →
            </Link>
          </div>

          <p className="text-white/25 text-xs mt-5">Free forever · No credit card needed</p>
        </div>

        {/* Founding villager progress bar */}
        {villagerCount > 0 && (
          <div className="relative z-10 mt-14 w-full max-w-sm mx-auto">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>Founding Villagers</span>
                <span>{villagerCount} / {counter?.max_count ?? 1000}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#1877F2] to-[#60a5fa] transition-all duration-1000"
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-white/30 text-xs mt-2 text-center">First 1,000 get Founding Villager status + 500 $VLG airdrop</p>
            </div>
          </div>
        )}

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 text-xs animate-bounce">
          <span>Explore the village</span>
          <span>↓</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-5 relative">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#1877F2] text-xs font-bold tracking-[2px] uppercase mb-3">The GPS System</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Your goal. Your plan. Your village.</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '01',
                icon: '📡',
                color: '#1877F2',
                title: 'Set your goal — Spirit builds your GPS',
                desc: 'Tell Spirit what you want to achieve. In seconds, it generates a full GPS plan: actionable steps, estimated timeline, resource costs, success probability, and the people you\'ll need.',
              },
              {
                step: '02',
                icon: '✊',
                color: '#f59e0b',
                title: 'Your village validates every step with OoWops',
                desc: 'As you complete each step, post your proof. Villagers give you OoWops — the village\'s validation signal. 3 OoWops marks a step complete. You both earn $VLG tokens.',
              },
              {
                step: '03',
                icon: '🏆',
                color: '#10b981',
                title: 'Your Force Rate rises. Real rewards unlock.',
                desc: 'Every completed step boosts your Village Score and Force Rate. At scale, $VLG converts to real currency. Your track record unlocks credit, investing access, and opportunities.',
              },
            ].map((item, i) => (
              <div key={i} className="group flex gap-5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-2xl p-6 transition-all">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${item.color}20`, border: `1px solid ${item.color}30` }}>
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: item.color }}>STEP {item.step}</span>
                    <h3 className="text-white font-bold text-base">{item.title}</h3>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 LOCATIONS ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-amber-400 text-xs font-bold tracking-[2px] uppercase mb-3">The Village Map</p>
            <h2 className="text-3xl font-black text-white">8 spaces. One village.</h2>
            <p className="text-white/40 mt-2 text-sm">Every tool you need to achieve any goal — all in one place.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🔨', name: 'Workshop',    desc: 'Goal GPS Engine',      color: '#f97316' },
              { icon: '✨', name: 'Dream Line',  desc: 'Progress Feed',        color: '#1877F2' },
              { icon: '🏦', name: 'Bank',        desc: 'Wallet & Funding',     color: '#10b981' },
              { icon: '🤝', name: 'Trading Post',desc: 'Skills & Services',    color: '#f59e0b' },
              { icon: '👥', name: 'Tribes',      desc: 'Project Teams',        color: '#8b5cf6' },
              { icon: '📅', name: 'Spaces',      desc: 'Events & Calendar',    color: '#ec4899' },
              { icon: '🌿', name: 'Zen',         desc: 'Wellness & Spirit',    color: '#06b6d4' },
              { icon: '🏥', name: 'Hospital',    desc: 'Licensed Providers',   color: '#34d399' },
            ].map(loc => (
              <div key={loc.name}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-4 flex items-center gap-3 transition-all cursor-default group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${loc.color}18`, border: `1px solid ${loc.color}25` }}>
                  {loc.icon}
                </div>
                <div>
                  <p className="font-bold text-white text-sm group-hover:text-white transition-colors">{loc.name}</p>
                  <p className="text-white/35 text-xs">{loc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPIRIT AI FEATURE ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#1877F2]/15 to-[#1877F2]/5 border border-[#1877F2]/20 rounded-3xl p-8 sm:p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1877F2]/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#1877F2]/20 border border-[#1877F2]/30 flex items-center justify-center text-3xl mb-6">
                🌀
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Meet Spirit — your AI guide.</h2>
              <p className="text-white/55 text-base leading-relaxed mb-6 max-w-lg">
                Spirit knows your goals, your strengths, your pace. It builds your GPS plan, coaches you through every step, connects you with the right villagers, and adapts as you grow.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {['Goal GPS Planning', 'Step-by-step coaching', 'Probability scoring', 'Villager matching'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <span className="text-[#1877F2]">✓</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/signup"
                className="inline-block bg-[#1877F2] hover:bg-[#1565c0] text-white font-bold px-7 py-3.5 rounded-full transition-colors text-sm">
                Talk to Spirit →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {[
              { num: '∞', label: 'Goals Supported', icon: '🎯' },
              { num: '3×', label: 'More likely to succeed with community', icon: '👥' },
              { num: '500', label: '$VLG for Founding Villagers', icon: '🪙' },
            ].map((s, i) => (
              <div key={i} className="text-center bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-3xl font-black text-white mb-1">{s.num}</div>
                <div className="text-white/40 text-xs leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#1877F2]/10 rounded-3xl blur-[40px]" />
            <div className="relative bg-white/[0.03] border border-white/8 rounded-3xl px-8 py-14">
              <span className="text-5xl mb-6 block">🏕️</span>
              <h2 className="text-3xl font-black text-white mb-4">Your village is waiting.</h2>
              <p className="text-white/45 text-base mb-8 max-w-sm mx-auto leading-relaxed">
                Every goal is better when you don't do it alone. Join free — no credit card, no catch.
              </p>
              <Link href="/signup"
                className="inline-block bg-[#1877F2] hover:bg-[#1565c0] text-white font-black text-lg px-10 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_60px_rgba(24,119,242,0.4)]">
                🏡 Join the Village Free
              </Link>
              <p className="text-white/20 text-xs mt-5">villa9e · Powered by Anthropic Claude AI · Legaci Jackson</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
