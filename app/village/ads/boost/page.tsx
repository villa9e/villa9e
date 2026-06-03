'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useRouter } from 'next/navigation';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525' },
};

const GOALS = [
  { id: 'views',    label: 'More views',        desc: 'Get more people to watch your video', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  { id: 'engage',   label: 'OoWops & comments', desc: 'Boost engagement on your post', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'profile',  label: 'Profile visits',    desc: 'Send people to your Village profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'store',    label: 'eStore visits',      desc: 'Drive traffic to your Trading Post store', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
];

const AUDIENCES = [
  { id: 'lookalike', label: 'Similar audience',  desc: 'Lookalike of your current followers' },
  { id: 'manual',    label: 'Manual targeting',   desc: 'Choose location, age, and interests' },
  { id: 'followers', label: 'Followers only',     desc: 'Only show to people who already follow you' },
];

const DURATIONS = [1, 7, 14, 30];

const STEPS = ['Goal', 'Audience', 'Budget'];

export default function BoostPostPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('lookalike');
  const [budget, setBudget] = useState(10);
  const [duration, setDuration] = useState(7);

  const totalSpend = budget * duration;

  const estimatedReach = Math.round((budget * duration * 180) + Math.random() * 1000);

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Boost post</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 4px', cursor: i <= step ? 'pointer' : 'default' }}
              onClick={() => i <= step && setStep(i)}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, marginBottom: 4,
                background: i <= step ? '#2952E8' : c.surface, color: i <= step ? '#fff' : c.textTer,
                border: `2px solid ${i <= step ? '#2952E8' : c.border}` }}>
                {i < step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? '#2952E8' : c.textTer, fontWeight: i === step ? 700 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>

        {/* STEP 0: Goal */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>What is your goal?</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Choose what you want this boost to achieve.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  style={{ textAlign: 'left', background: goal === g.id ? 'rgba(41,82,232,0.08)' : c.card,
                    border: `2px solid ${goal === g.id ? '#2952E8' : c.border}`, borderRadius: 12,
                    padding: '18px 18px', cursor: 'pointer' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={goal === g.id ? '#2952E8' : c.textSec} strokeWidth="2" style={{ marginBottom: 10 }}>
                    <path d={g.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontWeight: 700, fontSize: 14, color: goal === g.id ? '#2952E8' : c.text, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: c.textSec }}>{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Audience */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Who should see this?</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Choose your audience for this boosted post.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AUDIENCES.map(aud => (
                <button key={aud.id} onClick={() => setAudience(aud.id)}
                  style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: audience === aud.id ? 'rgba(41,82,232,0.08)' : c.card,
                    border: `2px solid ${audience === aud.id ? '#2952E8' : c.border}`, borderRadius: 12,
                    padding: '16px 18px', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: audience === aud.id ? '#2952E8' : c.text }}>{aud.label}</div>
                    <div style={{ fontSize: 13, color: c.textSec, marginTop: 3 }}>{aud.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${audience === aud.id ? '#2952E8' : c.border}`,
                    background: audience === aud.id ? '#2952E8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {audience === aud.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Budget & Duration */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Set your budget</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 28 }}>Choose how much to spend per day and how long to run your boost.</p>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 15, fontWeight: 700 }}>Daily budget</label>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#2952E8' }}>${budget}/day</span>
              </div>
              <input type="range" min="1" max="1000" step="1" value={budget} onChange={e => setBudget(+e.target.value)}
                style={{ width: '100%', accentColor: '#2952E8', height: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textTer, marginTop: 4 }}>
                <span>$1</span><span>$1,000</span>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 15, fontWeight: 700, display: 'block', marginBottom: 12 }}>Duration</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    style={{ flex: 1, padding: '14px 8px', border: `2px solid ${duration === d ? '#2952E8' : c.border}`,
                      background: duration === d ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 10,
                      cursor: 'pointer', fontWeight: 700, fontSize: 15, color: duration === d ? '#2952E8' : c.text }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: c.textSec }}>Total spend</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>${totalSpend.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: c.textSec }}>Est. reach</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{estimatedReach.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: c.textSec }}>Duration</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{duration} days</div>
                </div>
              </div>
            </div>

            <button onClick={() => router.push('/village/ads')}
              style={{ width: '100%', background: '#2952E8', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 17, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3 }}>
              Boost now
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 2 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              style={{ padding: '10px 24px', border: `1px solid ${c.border}`, background: c.card, borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, color: step === 0 ? c.textTer : c.text, opacity: step === 0 ? 0.5 : 1 }}>
              Back
            </button>
            <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && goal === ''}
              style={{ padding: '10px 32px', background: (step === 0 && goal === '') ? c.surface : '#2952E8',
                color: (step === 0 && goal === '') ? c.textTer : '#fff', border: 'none', borderRadius: 8,
                cursor: (step === 0 && goal === '') ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
