'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useRouter } from 'next/navigation';

const A = {
  day:   { bg: '#F2F7FA', card: '#FFFFFF', border: '#D0E4EF', text: '#0A1F2E', textSec: '#3A5A6E', textTer: '#7A9AAE', surface: '#EAF3F8', input: '#FFFFFF' },
  night: { bg: '#060F18', card: '#0E1E2E', border: '#1A3040', text: '#EEF4F8', textSec: '#8EB4CC', textTer: '#4A7A96', surface: '#091525', input: '#060F18' },
};

const OBJECTIVES = [
  { id: 'awareness',   label: 'Awareness',    desc: 'Reach people likely to remember your brand', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: '#2952E8' },
  { id: 'traffic',     label: 'Traffic',      desc: 'Send people to a destination in or outside Village', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: '#0F766E' },
  { id: 'engagement',  label: 'Engagement',   desc: 'Get more OoWops, comments, and shares', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: '#7C3AED' },
  { id: 'video_views', label: 'Video views',  desc: 'Get more people to watch your video content', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#DC2626' },
  { id: 'leads',       label: 'Leads',        desc: 'Collect info from people interested in your work', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#16A34A' },
  { id: 'sales',       label: 'Sales',        desc: 'Find people likely to purchase your product or service', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', color: '#A16207' },
];

const BID_STRATEGIES = ['Highest volume', 'Cost cap', 'Bid cap'];

const PLACEMENTS = [
  { id: 'dreamline',  label: 'DreamLine feed',    desc: 'Full-screen vertical video, highest reach' },
  { id: 'workshop',   label: 'Workshop feed',      desc: 'GPS-action-matched, mission relevance required' },
  { id: 'market',     label: 'Market browse',      desc: 'Sponsored store and product cards' },
  { id: 'deals',      label: 'Deals feed',         desc: 'Sponsored deal card — extra review required' },
  { id: 'profile',    label: 'Profile suggested',  desc: '"People you may know" section' },
  { id: 'stories',    label: 'Stories',            desc: '9:16 format, 15s max' },
  { id: 'overlay',    label: 'In-video overlay',   desc: 'Bottom 20%, 6s non-skippable, lower CPM' },
];

const FORMATS = ['Video', 'Image', 'Carousel', 'Text'];
const CTA_OPTIONS = ['Learn more', 'Shop now', 'Sign up', 'Get started', 'Watch now', 'Contact us', 'Book now', 'Download'];

const STEPS = ['Objective', 'Budget', 'Audience', 'Placements', 'Creative', 'Review', 'Publish'];

export default function CreateCampaignPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const c = isNight ? A.night : A.day;
  const router = useRouter();

  const [step, setStep] = useState(0);

  // Step 1
  const [objective, setObjective] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [cbo, setCbo] = useState(false);
  const [abTest, setAbTest] = useState(false);
  const [specialCat, setSpecialCat] = useState(false);

  // Step 2
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily');
  const [budgetAmount, setBudgetAmount] = useState('20');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bidStrategy, setBidStrategy] = useState('Highest volume');

  // Step 3
  const [audienceType, setAudienceType] = useState<'core' | 'custom' | 'lookalike'>('core');
  const [location, setLocation] = useState('');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(55);
  const [gender, setGender] = useState('All');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [lookalikeSize, setLookalikeSize] = useState('1%');

  // Step 4
  const [autoPlacement, setAutoPlacement] = useState(true);
  const [manualPlacements, setManualPlacements] = useState<string[]>([]);

  // Step 5
  const [format, setFormat] = useState('Video');
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [cta, setCta] = useState('Learn more');
  const [destUrl, setDestUrl] = useState('');

  const canNext = () => {
    if (step === 0) return objective !== '' && campaignName.trim() !== '';
    if (step === 1) return budgetAmount !== '' && parseFloat(budgetAmount) > 0;
    return true;
  };

  const inputStyle = { width: '100%', background: c.input, border: `1px solid ${c.border}`, color: c.text,
    borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };

  const addInterest = () => {
    const v = interestInput.trim();
    if (v && !interests.includes(v)) setInterests(p => [...p, v]);
    setInterestInput('');
  };

  const toggleManualPlacement = (id: string) => {
    setManualPlacements(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '0 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/village/ads" style={{ display: 'flex', alignItems: 'center', color: c.textSec, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Create campaign</span>
          </div>
          <button style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.textSec, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Save draft
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 4px', cursor: i <= step ? 'pointer' : 'default' }}
                onClick={() => i <= step && setStep(i)}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, marginBottom: 4,
                  background: i < step ? '#2952E8' : i === step ? '#2952E8' : c.surface,
                  color: i <= step ? '#fff' : c.textTer,
                  border: i === step ? '2px solid #2952E8' : `2px solid ${i < step ? '#2952E8' : c.border}` }}>
                  {i < step ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? '#2952E8' : c.textTer, fontWeight: i === step ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: c.surface, borderRadius: 2, marginBottom: 0, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#2952E8', width: `${((step) / (STEPS.length - 1)) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
        {/* STEP 0: Objective */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>What is your campaign objective?</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Choosing the right objective helps us optimize delivery for your goal.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
              {OBJECTIVES.map(obj => (
                <button key={obj.id} onClick={() => setObjective(obj.id)}
                  style={{ textAlign: 'left', background: objective === obj.id ? `${obj.color}18` : c.card,
                    border: `2px solid ${objective === obj.id ? obj.color : c.border}`, borderRadius: 12,
                    padding: '16px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={obj.color} strokeWidth="2" style={{ marginBottom: 10 }}>
                    <path d={obj.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 4 }}>{obj.label}</div>
                  <div style={{ fontSize: 12, color: c.textSec, lineHeight: 1.4 }}>{obj.desc}</div>
                </button>
              ))}
            </div>

            {/* Campaign name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Campaign name</label>
              <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. Summer Launch — DreamLine" style={inputStyle} />
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Special ad categories', desc: 'Required for housing, employment, credit, or political ads', val: specialCat, set: setSpecialCat },
                { label: 'Campaign Budget Optimization (CBO)', desc: 'Automatically distributes budget across ad sets', val: cbo, set: setCbo },
                { label: 'A/B Test', desc: 'Compare two versions to see which performs better', val: abTest, set: setAbTest },
              ].map(tog => (
                <div key={tog.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: c.text }}>{tog.label}</div>
                    <div style={{ fontSize: 12, color: c.textSec, marginTop: 2 }}>{tog.desc}</div>
                  </div>
                  <button onClick={() => tog.set(!tog.val)}
                    style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: tog.val ? '#2952E8' : c.surface, transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 3, left: tog.val ? 22 : 3, width: 18, height: 18,
                      background: '#fff', borderRadius: '50%', transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Budget */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Budget and schedule</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Set how much you want to spend and when your campaign runs.</p>

            {/* Budget type */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {(['daily', 'lifetime'] as const).map(bt => (
                <button key={bt} onClick={() => setBudgetType(bt)}
                  style={{ flex: 1, padding: '14px 20px', border: `2px solid ${budgetType === bt ? '#2952E8' : c.border}`,
                    background: budgetType === bt ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 10, cursor: 'pointer',
                    fontWeight: 700, fontSize: 14, color: budgetType === bt ? '#2952E8' : c.text, textTransform: 'capitalize' }}>
                  {bt} budget
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>
                {budgetType === 'daily' ? 'Daily budget ($)' : 'Lifetime budget ($)'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: c.textSec }}>$</span>
                <input type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)}
                  min="1" style={{ ...inputStyle, width: 180 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Start date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>End date <span style={{ color: c.textTer, fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 10 }}>Bid strategy</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {BID_STRATEGIES.map(bs => (
                  <button key={bs} onClick={() => setBidStrategy(bs)}
                    style={{ padding: '8px 16px', border: `2px solid ${bidStrategy === bs ? '#2952E8' : c.border}`,
                      background: bidStrategy === bs ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 20,
                      cursor: 'pointer', fontSize: 13, fontWeight: 600, color: bidStrategy === bs ? '#2952E8' : c.text }}>
                    {bs}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Audience */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Define your audience</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Choose who sees your ad.</p>

            {/* Audience type tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(['core', 'custom', 'lookalike'] as const).map(at => (
                <button key={at} onClick={() => setAudienceType(at)}
                  style={{ padding: '8px 18px', border: `2px solid ${audienceType === at ? '#2952E8' : c.border}`,
                    background: audienceType === at ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 20,
                    cursor: 'pointer', fontSize: 13, fontWeight: 600, color: audienceType === at ? '#2952E8' : c.text, textTransform: 'capitalize' }}>
                  {at}
                </button>
              ))}
            </div>

            {audienceType === 'core' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, state, or country"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Age range: {ageMin}–{ageMax}</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: c.textSec, marginBottom: 4 }}>Min age</div>
                      <input type="range" min="13" max="65" value={ageMin} onChange={e => setAgeMin(+e.target.value)}
                        style={{ width: '100%', accentColor: '#2952E8' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: c.textSec, marginBottom: 4 }}>Max age</div>
                      <input type="range" min="13" max="65" value={ageMax} onChange={e => setAgeMax(+e.target.value)}
                        style={{ width: '100%', accentColor: '#2952E8' }} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Gender</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['All', 'Men', 'Women'].map(g => (
                      <button key={g} onClick={() => setGender(g)}
                        style={{ padding: '7px 16px', border: `2px solid ${gender === g ? '#2952E8' : c.border}`,
                          background: gender === g ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 20,
                          cursor: 'pointer', fontSize: 13, fontWeight: 600, color: gender === g ? '#2952E8' : c.text }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Interests</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={interestInput} onChange={e => setInterestInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInterest()}
                      placeholder="Search interests (press Enter)" style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={addInterest}
                      style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 600 }}>
                      Add
                    </button>
                  </div>
                  {interests.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      {interests.map(int => (
                        <span key={int} style={{ background: 'rgba(41,82,232,0.12)', color: '#2952E8', borderRadius: 20,
                          padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {int}
                          <button onClick={() => setInterests(p => p.filter(x => x !== int))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2952E8', padding: 0, fontSize: 14, lineHeight: 1 }}>
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {audienceType === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Content engagers', desc: 'People who engaged with your Village content' },
                  { label: 'Profile visitors', desc: 'Users who viewed your profile' },
                  { label: 'Pixel events', desc: 'People who triggered your Village Pixel' },
                  { label: 'CSV upload', desc: 'Upload an email or phone list' },
                  { label: 'eStore visitors', desc: 'Visitors to your Trading Post store' },
                  { label: 'Bank recipients', desc: 'Opt-in payment connections' },
                ].map(card => (
                  <div key={card.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 12, color: c.textSec }}>{card.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {audienceType === 'lookalike' && (
              <div>
                <p style={{ color: c.textSec, fontSize: 14, marginBottom: 18 }}>Create a new audience similar to an existing custom audience.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                  {['1%', '2%', '5%', '10%'].map(pct => (
                    <button key={pct} onClick={() => setLookalikeSize(pct)}
                      style={{ width: 80, height: 80, border: `2px solid ${lookalikeSize === pct ? '#2952E8' : c.border}`,
                        background: lookalikeSize === pct ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 12,
                        cursor: 'pointer', fontWeight: 700, fontSize: 18, color: lookalikeSize === pct ? '#2952E8' : c.text }}>
                      {pct}
                    </button>
                  ))}
                </div>
                <p style={{ color: c.textSec, fontSize: 13 }}>1% = most similar, smaller audience. 10% = broader, larger audience.</p>
              </div>
            )}

            {/* Audience size estimator */}
            <div style={{ marginTop: 24, background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Estimated audience size</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 10, background: c.surface, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, #2952E8, #7C3AED)', borderRadius: 5 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>120K – 350K</span>
              </div>
              <div style={{ fontSize: 12, color: c.textSec, marginTop: 6 }}>Estimated daily reach with current targeting settings</div>
            </div>
          </div>
        )}

        {/* STEP 3: Placements */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Choose placements</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Decide where to show your ads across The Village.</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Automatic', val: true, desc: 'Recommended — we maximize results across all placements' },
                { label: 'Manual', val: false, desc: 'Choose exactly where your ad appears' },
              ].map(opt => (
                <div key={opt.label} onClick={() => setAutoPlacement(opt.val)}
                  style={{ flex: 1, padding: '16px', border: `2px solid ${autoPlacement === opt.val ? '#2952E8' : c.border}`,
                    background: autoPlacement === opt.val ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: autoPlacement === opt.val ? '#2952E8' : c.text, marginBottom: 4 }}>
                    {opt.label} {opt.val && <span style={{ fontSize: 11, background: '#2952E8', color: '#fff', padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>Recommended</span>}
                  </div>
                  <div style={{ fontSize: 12, color: c.textSec }}>{opt.desc}</div>
                </div>
              ))}
            </div>

            {!autoPlacement && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PLACEMENTS.map(pl => (
                  <div key={pl.id} onClick={() => toggleManualPlacement(pl.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
                      background: c.card, border: `1px solid ${manualPlacements.includes(pl.id) ? '#2952E8' : c.border}`,
                      borderRadius: 10, cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{pl.label}</div>
                      <div style={{ fontSize: 12, color: c.textSec, marginTop: 2 }}>{pl.desc}</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${manualPlacements.includes(pl.id) ? '#2952E8' : c.border}`,
                      background: manualPlacements.includes(pl.id) ? '#2952E8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {manualPlacements.includes(pl.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Creative */}
        {step === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Create your ad</h2>
              <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Choose a format and add your creative content.</p>

              {/* Format */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Format</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {FORMATS.map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      style={{ padding: '8px 16px', border: `2px solid ${format === f ? '#2952E8' : c.border}`,
                        background: format === f ? 'rgba(41,82,232,0.08)' : c.card, borderRadius: 20,
                        cursor: 'pointer', fontSize: 13, fontWeight: 600, color: format === f ? '#2952E8' : c.text }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload zone */}
              <div style={{ border: `2px dashed ${c.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', marginBottom: 20, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2952E8')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = c.border)}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c.textTer} strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ fontWeight: 600, fontSize: 14, color: c.textSec }}>Upload {format}</div>
                <div style={{ fontSize: 12, color: c.textTer, marginTop: 4 }}>Drag and drop or click to browse</div>
              </div>

              {/* Copy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Primary text <span style={{ color: c.textTer, fontWeight: 400 }}>{primaryText.length}/2200</span>
                  </label>
                  <textarea value={primaryText} onChange={e => setPrimaryText(e.target.value.slice(0, 2200))}
                    placeholder="Tell your audience about your product or service..."
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Headline <span style={{ color: c.textTer, fontWeight: 400 }}>{headline.length}/40</span>
                  </label>
                  <input value={headline} onChange={e => setHeadline(e.target.value.slice(0, 40))} placeholder="Short, punchy headline"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Description <span style={{ color: c.textTer, fontWeight: 400 }}>{description.length}/30</span>
                  </label>
                  <input value={description} onChange={e => setDescription(e.target.value.slice(0, 30))} placeholder="Optional short description"
                    style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Call to action</label>
                    <select value={cta} onChange={e => setCta(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                      {CTA_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Destination URL</label>
                    <input value={destUrl} onChange={e => setDestUrl(e.target.value)} placeholder="https://" style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* Live preview panel */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: c.textSec }}>Preview</div>
              <div style={{ background: '#1A1A2E', borderRadius: 24, padding: 12, width: 280, margin: '0 auto', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
                <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Mock phone frame */}
                  <div style={{ height: 200, background: 'linear-gradient(135deg, #0A5F8A, #1A2DBF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#0A0B12' }}>
                    <div style={{ fontSize: 10, color: '#4A7A96', marginBottom: 4 }}>Sponsored</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4F8', marginBottom: 3 }}>
                      {headline || 'Your headline here'}
                    </div>
                    <div style={{ fontSize: 11, color: '#8EB4CC', marginBottom: 8, lineHeight: 1.4 }}>
                      {primaryText.slice(0, 80) || 'Primary ad text will appear here...'}
                    </div>
                    <div style={{ background: '#2952E8', borderRadius: 6, padding: '7px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      {cta}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Review your campaign</h2>
            <p style={{ color: c.textSec, fontSize: 14, marginBottom: 24 }}>Check everything before publishing.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Objective', val: objective || '—', step: 0 },
                { label: 'Campaign name', val: campaignName || '—', step: 0 },
                { label: 'Budget', val: `$${budgetAmount}/${budgetType}`, step: 1 },
                { label: 'Bid strategy', val: bidStrategy, step: 1 },
                { label: 'Audience', val: audienceType, step: 2 },
                { label: 'Placements', val: autoPlacement ? 'Automatic (recommended)' : `${manualPlacements.length} selected`, step: 3 },
                { label: 'Ad format', val: format, step: 4 },
                { label: 'Headline', val: headline || '—', step: 4 },
                { label: 'CTA', val: cta, step: 4 },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: 12, color: c.textSec }}>{row.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{row.val}</div>
                  </div>
                  <button onClick={() => setStep(row.step)}
                    style={{ background: 'transparent', border: 'none', color: '#2952E8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {/* Policy check */}
            <div style={{ marginTop: 20, background: '#EAF3DE', border: '1px solid #C5E0A8', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#14532D' }}>Policy check — no issues found</span>
              </div>
              <div style={{ fontSize: 12, color: '#166534' }}>Spirit AI scanned your creative and found no policy violations.</div>
            </div>
          </div>
        )}

        {/* STEP 6: Publish */}
        {step === 6 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(41,82,232,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2952E8" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Ready to publish</h2>
            <p style={{ color: c.textSec, fontSize: 15, marginBottom: 8, maxWidth: 480, margin: '0 auto 20px' }}>
              Your campaign <strong>&quot;{campaignName}&quot;</strong> will enter the Village review queue.
            </p>
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '16px 20px', maxWidth: 440, margin: '0 auto 28px', textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>What happens next</div>
              {[
                'Spirit AI reviews your creative (1–24 hours)',
                'You receive a notification when approved',
                'Campaign goes live on your scheduled start date',
                'You can pause or edit at any time from the dashboard',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ color: '#2952E8', fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, color: c.textSec }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/village/ads')}
              style={{ background: '#2952E8', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Publish campaign
            </button>
          </div>
        )}

        {/* Navigation */}
        {step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ padding: '10px 24px', border: `1px solid ${c.border}`, background: c.card, borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, color: step === 0 ? c.textTer : c.text, opacity: step === 0 ? 0.5 : 1 }}>
              Back
            </button>
            <button onClick={() => setStep(s => Math.min(6, s + 1))}
              disabled={!canNext()}
              style={{ padding: '10px 32px', background: canNext() ? '#2952E8' : c.surface, color: canNext() ? '#fff' : c.textTer,
                border: 'none', borderRadius: 8, cursor: canNext() ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 700 }}>
              {step === 5 ? 'Continue to publish' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
