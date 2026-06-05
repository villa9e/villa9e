'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Transaction label formatter ───────────────────────────────────────────────
function formatTxnLabel(t: any): string {
  const type = (t.transaction_type ?? t.description ?? '').toUpperCase();
  const amt  = parseFloat(t.amount ?? 0);

  if (type.includes('SPRINT') || type.includes('ACTION'))  return `Completed a sprint action +${amt} $VLG`;
  if (type.includes('OOWOP') && t.direction === 'credit')  return `OoWop'd a post +${amt} $VLG`;
  if (type.includes('OOWOP') && t.direction === 'debit')   return `Gave an OoWop -${amt} $VLG`;
  if (type.includes('GOAL_COMPLETE') || type.includes('GOAL'))  return `Completed a goal +${amt} $VLG`;
  if (type.includes('STEP'))                                return `Completed a goal step +${amt} $VLG`;
  if (type.includes('MINDFUL'))                             return `Daily mindful moment +${amt} $VLG`;
  if (type.includes('POST'))                                return `Posted on DreamLine +${amt} $VLG`;
  if (type.includes('REFER'))                               return `Referred a villager +${amt} $VLG`;
  if (type.includes('MEDAL') || type.includes('PLATINUM'))  return `Earned Platinum tier +${amt} $VLG`;
  if (type.includes('DEAL'))                                return `Completed a deal +${amt} $VLG`;
  if (type.includes('ONBOARD') || type.includes('WELCOME')) return `Welcome bonus +${amt} $VLG`;
  if (type.includes('CONVERT'))                             return `Converted $VLG → $ViCo -${amt} $VLG`;
  // Fallback: use description or humanized type
  return t.description || type.replace(/_/g, ' ');
}

function txnIcon(t: any): string {
  const type = (t.transaction_type ?? t.description ?? '').toUpperCase();
  if (type.includes('SPRINT') || type.includes('ACTION')) return '⚡';
  if (type.includes('OOWOP'))  return '✊';
  if (type.includes('GOAL'))   return '🏆';
  if (type.includes('STEP'))   return '📍';
  if (type.includes('MINDFUL'))return '🧘';
  if (type.includes('POST'))   return '✨';
  if (type.includes('REFER'))  return '👥';
  if (type.includes('MEDAL') || type.includes('PLATINUM')) return '🥇';
  if (type.includes('DEAL'))   return '🤝';
  if (type.includes('ONBOARD')|| type.includes('WELCOME')) return '🎉';
  if (type.includes('CONVERT'))return '🔄';
  return '🏕️';
}

// ── VLG Wallet Page ───────────────────────────────────────────────────────────
export default function VLGWalletPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [profileVlg,  setProfileVlg]  = useState<number | null>(null);
  const [walletVlg,   setWalletVlg]   = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [txns,        setTxns]        = useState<any[]>([]);
  const [profile,     setProfile]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: prof }, { data: wallet }, { data: txnData }] = await Promise.all([
        supabase.from('profiles')
          .select('vlg_balance,village_score,score_tier,is_founding_villager,username')
          .eq('id', user.id)
          .single(),
        (supabase as any).from('village_wallets')
          .select('vlg_balance,total_earned_vlg')
          .eq('user_id', user.id)
          .maybeSingle(),
        (supabase as any).from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setProfile(prof);
      setProfileVlg(parseFloat(prof?.vlg_balance ?? 0));
      if (wallet) {
        setWalletVlg(parseFloat(wallet.vlg_balance ?? 0));
        setTotalEarned(parseFloat(wallet.total_earned_vlg ?? 0));
      }
      setTxns(txnData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Prefer wallet balance if exists, else profile balance
  const displayVlg = walletVlg !== null ? walletVlg : (profileVlg ?? 0);
  const isFounder  = profile?.is_founding_villager;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0800', color: '#fff' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(10,8,0,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(251,191,36,0.15)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer',
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#FBBF24' }}>$VLG Wallet</p>
          <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.5)', fontWeight: 700 }}>Village Token · Phase 1 Points</p>
        </div>
        {/* Link to bank */}
        <Link href="/village/bank" style={{ textDecoration: 'none' }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#FBBF24',
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 20, padding: '5px 12px',
          }}>
            Bank
          </div>
        </Link>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 120px' }}>

        {/* ── Balance Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #78350F 0%, #92400E 40%, #B45309 100%)',
            borderRadius: 24, padding: '24px 20px', marginBottom: 16,
            boxShadow: '0 8px 32px rgba(251,191,36,0.2)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.7)', fontWeight: 800, letterSpacing: '0.06em', marginBottom: 6 }}>
                TOTAL BALANCE
              </p>
              {loading ? (
                <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>—</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {displayVlg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: 18, color: '#FBBF24', fontWeight: 800 }}>$VLG</span>
                </div>
              )}
            </div>
            {isFounder && (
              <div style={{
                background: 'rgba(251,191,36,0.2)', borderRadius: 16, padding: '8px 12px', textAlign: 'center',
                border: '1px solid rgba(251,191,36,0.4)',
              }}>
                <p style={{ fontSize: 10, color: 'rgba(251,191,36,0.8)' }}>Founding</p>
                <p style={{ fontSize: 18 }}>👑</p>
                <p style={{ fontSize: 10, color: 'rgba(251,191,36,0.8)' }}>Villager</p>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
            {[
              { label: 'Total Earned', value: totalEarned > 0 ? totalEarned.toLocaleString(undefined, { maximumFractionDigits: 0 }) : (displayVlg > 0 ? displayVlg.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0') },
              { label: 'Score',        value: (profile?.village_score ?? 0).toLocaleString() },
              { label: 'Tier',         value: profile?.score_tier ?? 'Villager' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: 'rgba(251,191,36,0.6)', fontWeight: 800, marginBottom: 3 }}>{s.label.toUpperCase()}</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{loading ? '—' : s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── VLG → VICO conversion link ── */}
        <Link href="/village/bank" style={{ display: 'block', textDecoration: 'none', marginBottom: 16 }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(180,83,9,0.12))',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(251,191,36,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🔄</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#FBBF24' }}>$VLG → $VICO Conversion</p>
              <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.5)', marginTop: 2 }}>
                10,000 VLG = 1 ViCo · Available at Phase 3
              </p>
            </div>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </motion.div>
        </Link>

        {/* ── Phase Info ── */}
        <div style={{
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 900, color: '#FBBF24', marginBottom: 4 }}>Phase 1 — Points Mode</p>
            <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.6)', lineHeight: 1.6 }}>
              $VLG is non-tradeable until Phase 3 (50,000+ villagers). Every VLG you earn now converts to real tradeable $VLG tokens. Founding villagers get a 500 VLG bonus airdrop on top.
            </p>
          </div>
        </div>

        {/* ── How to Earn ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.1)',
          borderRadius: 16, padding: '16px', marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '0.03em' }}>How to Earn $VLG</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { icon: '⚡', action: 'Complete a sprint action', vlg: '+10' },
              { icon: '✊', action: 'Give an OoWop',            vlg: '+7'  },
              { icon: '✊', action: 'Receive an OoWop',         vlg: '+10' },
              { icon: '🧘', action: 'Daily mindful moment',     vlg: '+5'  },
              { icon: '✨', action: 'Post on DreamLine',         vlg: '+10' },
              { icon: '👥', action: 'Refer a villager',          vlg: '+100'},
              { icon: '🏆', action: 'Complete a goal (Gold)',    vlg: '+200'},
              { icon: '🥇', action: 'Earn Platinum tier',        vlg: '+500'},
            ].map(item => (
              <div key={item.action} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <p style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.action}</p>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#22C55E' }}>{item.vlg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.1)',
          borderRadius: 16, padding: '16px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Transaction History</p>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '16px 0' }}>Loading...</p>
          ) : txns.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '24px 0', fontWeight: 700 }}>
              No transactions yet. Complete goals to earn $VLG!
            </p>
          ) : (
            <div>
              {txns.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < txns.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{txnIcon(t)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                      {formatTxnLabel(t)}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {new Date(t.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 900, flexShrink: 0,
                    color: t.direction === 'credit' ? '#22C55E' : '#EF4444',
                  }}>
                    {t.direction === 'credit' ? '+' : '-'}{parseFloat(t.amount ?? 0).toFixed(0)} {t.token_type ?? 'VLG'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
