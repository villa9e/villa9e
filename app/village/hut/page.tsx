'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getScoreTier } from '@/lib/village/score';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

const ARCHETYPE_EMOJI: Record<string, string> = {
  architect:'🏗️', spark:'⚡', anchor:'⚓', compass:'🧭',
  pioneer:'🏔️', sage:'📚', weaver:'🕸️', flame:'🔥',
};

const LEVEL_NAMES: Record<number, string> = {
  1:'Seedling', 2:'Sprout', 3:'Grower', 4:'Builder', 5:'Maker',
  6:'Achiever', 7:'Champion', 8:'Elder', 9:'Legend', 10:'Godlike',
};

const HUT_LINKS = [
  { href: '/village/hut/avatar',      emoji: '🎭', label: 'Build Avatar',      desc: 'Customize your village character' },
  { href: '/village/hut/settings',    emoji: '⚙️', label: 'Settings',           desc: 'Profile, Spirit, language' },
  { href: '/village/hut/vlg-wallet',  emoji: '🪙', label: '$VLG Wallet',        desc: 'Balance, transactions, earning' },
  { href: '/village/blockchain',      emoji: '⛓️', label: 'Blockchain',          desc: 'Village ledger · $VLG token' },
  { href: '/village/hut/data-locker', emoji: '🔒', label: 'Data Locker',        desc: 'Control your data & earnings' },
  { href: '/village/hut/referrals',   emoji: '🤝', label: 'Referrals',          desc: 'Invite villagers, earn VLG' },
  { href: '/village/hospital/join',   emoji: '✅', label: 'Get Verified',        desc: 'Open your professional storefront' },
  { href: '/village/hut/achievements', emoji: '🏆', label: 'Achievements',       desc: 'Medals, milestones, badges' },
];

export default function HutPage() {
  const [profile, setProfile]       = useState<any>(null);
  const [xp, setXp]                 = useState<any>(null);
  const [skills, setSkills]         = useState<any[]>([]);
  const [goals, setGoals]           = useState<any[]>([]);
  const [wallet, setWallet]         = useState<any>(null);
  const [provider, setProvider]     = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [badges, setBadges]         = useState<any[]>([]);
  const [completedSprints, setCompletedSprints] = useState<any[]>([]);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#FFF8EE';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#FED7AA';
  const textMain = isNight ? '#F0EBE0' : '#2D1F0E';
  const textMute = isNight ? '#4A4F72' : '#8B6F47';
  const accent   = isNight ? '#FFB84D' : '#D97706';

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: p }, { data: s }, { data: g },
        { data: w }, { data: xpData }, { data: prov },
      ] = await Promise.all([
        (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
        (supabase as any).from('user_skills').select('*').eq('user_id', user.id).order('rating', { ascending: false }).limit(6),
        (supabase as any).from('goals').select('id,title,probability_score,status,progress_percentage,goal_steps(status)').eq('user_id', user.id).eq('status', 'active').limit(4),
        (supabase as any).from('village_wallets').select('vlg_balance,total_earned_vlg,total_data_earnings').eq('user_id', user.id).single(),
        (supabase as any).from('user_xp').select('*').eq('user_id', user.id).single(),
        (supabase as any).from('provider_profiles').select('verification_status,specialty,credential_type').eq('user_id', user.id).single(),
      ]);

      setProfile(p); setSkills(s ?? []); setGoals(g ?? []);
      setWallet(w); setXp(xpData); setProvider(prov);

      // Load earned badges
      const { data: earned } = await (supabase as any)
        .from('user_achievements')
        .select('achievement_id, earned_at, achievements(id, title, icon, rarity, points, description)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      setBadges(earned ?? []);

      // Load completed sprints (verified accomplishments)
      const { data: sprints } = await (supabase as any)
        .from('sprints')
        .select('id, title, goal_id, week_start, week_end, focus_intention, goals(title, category)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('week_end', { ascending: false })
        .limit(10);
      setCompletedSprints(sprints ?? []);

      setLoading(false);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 2, repeat: Infinity }}>
        <span className="text-5xl">🏠</span>
      </motion.div>
    </div>
  );

  const tier       = getScoreTier(profile?.village_score ?? 0);
  const score      = profile?.village_score ?? 0;
  const xpLevel    = xp?.current_level ?? 1;
  const xpTotal    = xp?.total_xp ?? 0;
  const xpToNext   = xp?.xp_to_next_level ?? 100;
  const xpThisLevel = xpTotal % xpToNext;
  const xpPct      = Math.round((xpThisLevel / xpToNext) * 100);
  const levelName  = LEVEL_NAMES[xpLevel] ?? 'Villager';
  const archEmoji  = ARCHETYPE_EMOJI[profile?.personality_type ?? ''] ?? '🏕️';
  const vlg        = parseFloat(wallet?.vlg_balance ?? 0);
  const vlgDisplay = vlg >= 1000 ? `${(vlg/1000).toFixed(1)}K` : vlg.toFixed(0);

  const avatarCfg  = profile?.avatar_config;
  const skinColors: Record<string, string> = { s1:'#FDDBB4', s2:'#F0C27F', s3:'#C68642', s4:'#8D5524', s5:'#5C2A0E', s6:'#3B1506' };
  const skinColor  = skinColors[avatarCfg?.skin_id ?? 's4'] ?? '#8D5524';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/map" className="text-xl text-white">←</Link>
        <span className="text-2xl">🏠</span>
        <div className="flex-1">
          <h1 className="font-black text-white text-base">The Hut</h1>
          <p className="text-white/60 text-xs">@{profile?.username}</p>
        </div>
        <button onClick={signOut} className="text-xs text-white/50 hover:text-white/80 transition-colors">Sign out</button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3">

        {/* Profile hero card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: isNight ? 'linear-gradient(135deg,#1A1200,#2D1F00)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)', }}>
          <div className="flex items-start gap-4">
            {/* Avatar preview */}
            <Link href="/village/hut/avatar">
              <div className="w-18 h-18 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                style={{ background: 'rgba(0,0,0,0.2)', width: 72, height: 72 }}>
                {/* Simple avatar preview — circle face */}
                <svg width="48" height="60" viewBox="0 0 48 60">
                  <circle cx="24" cy="18" r="14" fill={skinColor} />
                  <rect x="12" y="28" width="24" height="20" rx="8" fill={isNight ? '#1877F2' : '#E8770A'} />
                  <circle cx="18" cy="16" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="30" cy="16" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="19" cy="17" r="1.5" fill="#111" />
                  <circle cx="31" cy="17" r="1.5" fill="#111" />
                  <path d="M18,24 Q24,28 30,24" stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
                <div className="absolute -bottom-1 -right-1 text-lg">{archEmoji}</div>
              </div>
            </Link>

            <div className="flex-1 text-white">
              <p className="font-black text-lg">{profile?.display_name || `@${profile?.username}`}</p>
              <p className="text-white/70 text-sm">{profile?.occupation || 'Villager'}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {tier.label}
                </span>
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{score} pts</span>
                {profile?.is_founding_villager && (
                  <span className="text-xs font-bold" style={{ color: '#FFD700' }}>👑 Founder #{profile.founding_villager_number}</span>
                )}
              </div>
            </div>

            {/* VLG balance */}
            <div className="text-right">
              <p className="font-black text-2xl" style={{ color: isNight ? '#FFB84D' : '#fff' }}>{vlgDisplay}</p>
              <p className="text-xs text-white/60">$VLG</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/70">Lv {xpLevel} · {levelName}</span>
              <span className="text-white/50">{xpToNext - xpThisLevel} XP to {LEVEL_NAMES[xpLevel + 1] ?? 'Max'}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg,#FFFFFF,#FFD700)' }} />
            </div>
          </div>
        </motion.div>

        {/* Active goals */}
        {goals.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm" style={{ color: textMain }}>Active GPS Goals</p>
              <Link href="/village/workshop" className="text-xs font-bold" style={{ color: accent }}>View all →</Link>
            </div>
            <div className="space-y-2.5">
              {goals.map(goal => {
                const done  = goal.goal_steps?.filter((s: any) => s.status === 'completed').length ?? 0;
                const total = goal.goal_steps?.length ?? 0;
                const pct   = total ? Math.round((done / total) * 100) : goal.progress_percentage ?? 0;
                return (
                  <Link key={goal.id} href={`/village/workshop/goal/${goal.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: textMain }}>{goal.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: isNight ? '#1E2240' : '#FED7AA' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: accent }} />
                          </div>
                          <span className="text-xs flex-shrink-0" style={{ color: textMute }}>{done}/{total}</span>
                        </div>
                      </div>
                      <span className="font-black text-sm flex-shrink-0" style={{ color: '#1877F2' }}>{goal.probability_score ?? 0}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <p className="font-black text-sm mb-2" style={{ color: textMain }}>Your Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 6).map(s => (
                <span key={s.id} className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: s.rating >= 7 ? (isNight ? '#0D2D1A' : '#DCFCE7') : (isNight ? '#1E2240' : '#EDE9FE'),
                    color:      s.rating >= 7 ? '#16A34A' : (isNight ? '#7A7FA8' : '#6D28D9'),
                  }}>
                  {s.skill_name} {s.rating >= 7 ? '✓' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Streak ────────────────────────────────────────────── */}
        {(profile?.checkin_streak ?? 0) > 0 && (
          <div className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: isNight ? 'rgba(255,107,43,0.08)' : '#FFF7ED', border: `1px solid ${isNight ? 'rgba(255,107,43,0.2)' : '#FED7AA'}` }}>
            <span className="text-3xl">🔥</span>
            <div className="flex-1">
              <p className="font-black text-lg" style={{ color: isNight ? '#FB923C' : '#EA580C' }}>
                {profile.checkin_streak}-Day Streak
              </p>
              <p className="text-xs" style={{ color: textMute }}>
                Longest: {profile.longest_streak ?? profile.checkin_streak} days · Keep checking in daily
              </p>
            </div>
            <Link href="/village/spirit/checkin"
              className="text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: isNight ? 'rgba(255,107,43,0.15)' : '#FED7AA', color: isNight ? '#FB923C' : '#9A3412' }}>
              Check In →
            </Link>
          </div>
        )}

        {/* ── Achievement badges ─────────────────────────────────── */}
        {badges.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm" style={{ color: textMain }}>Achievements</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: isNight ? '#1E2240' : '#EEF2FF', color: isNight ? '#7A7FA8' : '#4338CA' }}>
                {badges.length} earned
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b: any) => {
                const ach = b.achievements;
                const rarityColor: Record<string, string> = {
                  legendary: '#F59E0B',
                  epic:      '#8B5CF6',
                  rare:      '#3B82F6',
                  common:    isNight ? '#4A4F72' : '#6B7280',
                };
                const color = rarityColor[ach?.rarity ?? 'common'];
                return (
                  <div key={b.achievement_id} title={`${ach?.title}: ${ach?.description}`}
                    className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center"
                    style={{ background: isNight ? '#0D1020' : '#F8FAFF', border: `1px solid ${color}30`, minWidth: '60px' }}>
                    <span className="text-2xl">{ach?.icon}</span>
                    <span className="text-[10px] font-bold leading-tight" style={{ color }}>{ach?.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Verified Wins (completed sprints) ────────────────── */}
        {completedSprints.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <p className="font-black text-sm" style={{ color: textMain }}>Verified Wins</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: isNight ? '#0D2D1A' : '#DCFCE7', color: '#16A34A' }}>
                {completedSprints.length} sprints
              </span>
            </div>
            <div className="space-y-2.5">
              {completedSprints.map((sp: any) => {
                const goal = sp.goals;
                const endDate = new Date(sp.week_end);
                return (
                  <Link key={sp.id} href={`/village/workshop/sprint/${sp.id}`}>
                    <div className="flex items-start gap-3 rounded-2xl px-3 py-2.5"
                      style={{ background: isNight ? 'rgba(34,197,94,0.06)' : '#F0FDF4', border: `1px solid ${isNight ? 'rgba(34,197,94,0.15)' : '#BBF7D0'}` }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(34,197,94,0.15)' }}>
                        <span className="text-xs">✓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight" style={{ color: textMain }}>{sp.title}</p>
                        {goal?.title && (
                          <p className="text-xs mt-0.5" style={{ color: textMute }}>
                            {goal.category} · {goal.title}
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: '#16A34A' }}>
                          Completed {endDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: textMute }}>
              These accomplishments are visible on your public profile and can be used when applying for opportunities or monetizing your experience.
            </p>
          </div>
        )}

        {/* Provider status */}
        {provider && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: provider.verification_status === 'auto_verified' || provider.verification_status === 'approved'
              ? (isNight ? '#0D2D1A' : '#ECFDF5')
              : cardBg,
              border: `1px solid ${provider.verification_status === 'auto_verified' || provider.verification_status === 'approved' ? '#16A34A40' : border}` }}>
            <span className="text-2xl">{provider.verification_status === 'auto_verified' || provider.verification_status === 'approved' ? '✅' : '⏳'}</span>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: textMain }}>
                {provider.verification_status === 'auto_verified' || provider.verification_status === 'approved'
                  ? 'Verified Professional' : 'Verification Pending'}
              </p>
              <p className="text-xs" style={{ color: textMute }}>{provider.specialty ?? provider.credential_type}</p>
            </div>
            <Link href="/village/trading-post" className="text-xs font-bold" style={{ color: '#1877F2' }}>Storefront →</Link>
          </div>
        )}

        {/* Quick links grid */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: textMute }}>Your Hut</p>
          <div className="grid grid-cols-2 gap-2.5">
            {HUT_LINKS.map(link => (
              <Link key={link.href + link.label} href={link.href}>
                <motion.div whileTap={{ scale: 0.97 }}
                  className="rounded-2xl p-4 flex flex-col gap-1 transition-all"
                  style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <span className="text-2xl">{link.emoji}</span>
                  <p className="font-bold text-sm" style={{ color: textMain }}>{link.label}</p>
                  <p className="text-xs" style={{ color: textMute }}>{link.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors mt-2"
          style={{ background: isNight ? '#1E2240' : '#FFF8EE', color: textMute, border: `1px solid ${border}` }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
