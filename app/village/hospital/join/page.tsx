'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

// All credential types across every profession
const CREDENTIAL_CATEGORIES = [
  {
    label: 'Medical & Health',
    emoji: '🏥',
    types: [
      { id: 'npi_medical',       label: 'Physician / Nurse Practitioner / PA',    note: 'Auto-verified via NPPES' },
      { id: 'npi_mental_health', label: 'Therapist / Psychologist / Counselor',   note: 'Auto-verified via NPPES' },
      { id: 'npi_allied_health', label: 'Allied Health (PT, OT, RD, etc.)',        note: 'Auto-verified via NPPES' },
    ],
  },
  {
    label: 'Legal',
    emoji: '⚖️',
    types: [
      { id: 'bar_license',  label: 'Licensed Attorney',    note: 'AI document verification' },
      { id: 'paralegal',    label: 'Certified Paralegal',  note: 'AI document verification' },
      { id: 'mediator',     label: 'Certified Mediator',   note: 'AI document verification' },
    ],
  },
  {
    label: 'Financial & Insurance',
    emoji: '💰',
    types: [
      { id: 'finra_broker',   label: 'FINRA Licensed Broker / Advisor',   note: 'Auto-verified via BrokerCheck' },
      { id: 'cfp',            label: 'Certified Financial Planner (CFP)',  note: 'Auto-verified via CFP Board' },
      { id: 'fiduciary_ria',  label: 'Registered Investment Advisor',     note: 'SEC/FINRA verified' },
      { id: 'cpa_accountant', label: 'Certified Public Accountant (CPA)', note: 'AI document verification' },
      { id: 'insurance_producer', label: 'Licensed Insurance Producer',   note: 'NIPR + AI verification' },
    ],
  },
  {
    label: 'Real Estate',
    emoji: '🏠',
    types: [
      { id: 'real_estate_agent',  label: 'Real Estate Agent',   note: 'State commission + AI verify' },
      { id: 'real_estate_broker', label: 'Real Estate Broker',  note: 'State commission + AI verify' },
      { id: 'mortgage_broker',    label: 'Mortgage Broker/Loan Officer', note: 'NMLS + AI verify' },
    ],
  },
  {
    label: 'Wellness & Holistic',
    emoji: '🌿',
    types: [
      { id: 'reiki_master',   label: 'Reiki Practitioner',          note: 'AI document + community verify' },
      { id: 'herbalist',      label: 'Clinical Herbalist',           note: 'AI document verification' },
      { id: 'sound_healer',   label: 'Sound Healing Practitioner',  note: 'AI document + community verify' },
      { id: 'yoga_therapist', label: 'Yoga Therapist (IAYT/RYT)',   note: 'Registry + AI verify' },
      { id: 'naturopath',     label: 'Naturopathic Doctor',         note: 'State license + NPI verify' },
      { id: 'acupuncturist',  label: 'Licensed Acupuncturist',      note: 'NCCAOM + state verify' },
    ],
  },
  {
    label: 'Fitness & Coaching',
    emoji: '💪',
    types: [
      { id: 'personal_trainer', label: 'Certified Personal Trainer (NASM/ACE)', note: 'Cert registry verify' },
      { id: 'life_coach',       label: 'Life Coach (ICF Certified)',             note: 'ICF registry + AI verify' },
      { id: 'nutritionist',     label: 'Nutritionist / Dietitian',              note: 'AND registry + NPI verify' },
    ],
  },
];

type Step = 'category' | 'type' | 'details' | 'documents' | 'submitting' | 'done';

export default function JoinAsProviderPage() {
  const router = useRouter();
  const [step, setStep]           = useState<Step>('category');
  const [category, setCategory]   = useState<any>(null);
  const [credType, setCredType]   = useState<any>(null);
  const [form, setForm]           = useState({
    first_name: '', last_name: '', business_name: '',
    license_number: '', license_state: '', npi_number: '',
    specialty: '', bio: '', session_rate: '',
  });
  const [docUrl, setDocUrl]       = useState('');
  const [result, setResult]       = useState<any>(null);
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F0FDF4';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#BBF7D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A4F72' : '#166534';
  const accent   = isNight ? '#34D399' : '#059669';

  async function submit() {
    setStep('submitting');
    try {
      const res = await fetch('/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_type: credType.id,
          ...form,
          document_url: docUrl || null,
        }),
      });
      const data = await res.json();
      setResult(data);
      VillageSound.stepComplete();
      setStep('done');
    } catch {
      setStep('details');
    }
  }

  const progress = { category: 20, type: 40, details: 60, documents: 80, submitting: 90, done: 100 }[step];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/hospital" className="text-xl text-white">←</Link>
        <div className="flex-1">
          <h1 className="font-black text-white text-base">Join as a Professional</h1>
          <p className="text-white/60 text-xs">Verify your credentials → open your storefront</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: isNight ? '#1E2240' : '#BBF7D0' }}>
        <motion.div className="h-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
          style={{ background: accent }} />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="wait">

          {/* STEP 1: Category */}
          {step === 'category' && (
            <motion.div key="cat" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: textMute }}>Step 1 of 4</p>
                <h2 className="text-2xl font-black" style={{ color: textMain }}>What do you do?</h2>
                <p className="text-sm mt-1" style={{ color: textMute }}>Select your professional category.</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {CREDENTIAL_CATEGORIES.map(cat => (
                  <motion.button key={cat.label} whileTap={{ scale: 0.96 }}
                    onClick={() => { setCategory(cat); setStep('type'); VillageSound.tap(); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all"
                    style={{ background: cardBg, border: `2px solid ${border}` }}>
                    <span className="text-3xl">{cat.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: textMain }}>{cat.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Credential type */}
          {step === 'type' && category && (
            <motion.div key="type" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: textMute }}>Step 2 of 4</p>
                <h2 className="text-2xl font-black" style={{ color: textMain }}>{category.emoji} {category.label}</h2>
                <p className="text-sm mt-1" style={{ color: textMute }}>Select your specific credential.</p>
              </div>
              <div className="space-y-2.5">
                {category.types.map((type: any) => (
                  <motion.button key={type.id} whileTap={{ scale: 0.98 }}
                    onClick={() => { setCredType(type); setStep('details'); VillageSound.tap(); }}
                    className="w-full text-left p-4 rounded-2xl transition-all"
                    style={{ background: cardBg, border: `2px solid ${border}` }}>
                    <p className="font-bold text-sm" style={{ color: textMain }}>{type.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: textMute }}>✓ {type.note}</p>
                  </motion.button>
                ))}
              </div>
              <button onClick={() => setStep('category')} className="w-full text-center py-3 text-sm mt-3" style={{ color: textMute }}>
                ← Back
              </button>
            </motion.div>
          )}

          {/* STEP 3: Details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: textMute }}>Step 3 of 4</p>
                <h2 className="text-2xl font-black" style={{ color: textMain }}>Your Details</h2>
                <p className="text-sm mt-1" style={{ color: textMute }}>We'll use this to verify your credentials.</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'first_name',     label: 'First Name',       ph: 'First' },
                  { key: 'last_name',      label: 'Last Name',        ph: 'Last' },
                  { key: 'business_name',  label: 'Practice / Business Name (optional)', ph: '' },
                  ...(credType?.id?.startsWith('npi') ? [
                    { key: 'npi_number',   label: 'NPI Number',       ph: '1234567890' },
                  ] : [
                    { key: 'license_number', label: 'License / Cert Number', ph: '' },
                    { key: 'license_state',  label: 'State / Jurisdiction',   ph: 'CA' },
                  ]),
                  { key: 'specialty',     label: 'Specialty / Focus Area',  ph: 'e.g. Family Law, Retinal Imaging' },
                  { key: 'session_rate',  label: 'Session Rate ($/hr)',      ph: '150' },
                  { key: 'bio',           label: 'Short Bio',                ph: 'Tell the village about your practice…' },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textMute }}>{label}</label>
                    {key === 'bio' ? (
                      <textarea value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={ph} rows={3}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                        style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
                    ) : (
                      <input type="text" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={ph}
                        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setStep('type')} className="flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: isNight ? '#1E2240' : '#F0FDF4', color: textMute }}>← Back</button>
                <button onClick={() => setStep('documents')} disabled={!form.first_name || !form.last_name}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: accent }}>Continue →</button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Document upload */}
          {step === 'documents' && (
            <motion.div key="docs" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: textMute }}>Step 4 of 4</p>
                <h2 className="text-2xl font-black" style={{ color: textMain }}>Upload Your Credential</h2>
                <p className="text-sm mt-1" style={{ color: textMute }}>
                  {credType?.id?.startsWith('npi') ? 'NPI credentials are auto-verified — no upload required. Optionally add a document for additional verification.' : 'Upload your license, certificate, or official credential document.'}
                </p>
              </div>

              <div className="rounded-2xl p-6 text-center mb-4"
                style={{ background: cardBg, border: `2px dashed ${border}` }}>
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm font-bold mb-1" style={{ color: textMain }}>Upload License / Certificate</p>
                <p className="text-xs mb-3" style={{ color: textMute }}>PDF, JPG, or PNG · AI will analyze it instantly</p>
                <input type="url" value={docUrl} onChange={e => setDocUrl(e.target.value)}
                  placeholder="Or paste a Cloudinary/URL to your document"
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none text-center"
                  style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
              </div>

              <div className="rounded-2xl p-4 mb-4" style={{ background: isNight ? '#0D1820' : '#ECFDF5', border: `1px solid ${border}` }}>
                <p className="text-xs font-bold mb-2" style={{ color: accent }}>How verification works</p>
                {[
                  '✓ NPI credentials verified in seconds via federal NPPES registry',
                  '✓ Financial credentials via FINRA BrokerCheck',
                  '✓ All other credentials reviewed by our AI + verified team',
                  '✓ Auto-approvals receive +100 $VLG and Trading Post storefront',
                  '✓ Manual reviews completed within 24–48 hours',
                ].map((item, i) => (
                  <p key={i} className="text-xs mb-1" style={{ color: textMute }}>{item}</p>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('details')} className="flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: isNight ? '#1E2240' : '#F0FDF4', color: textMute }}>← Back</button>
                <button onClick={submit}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: accent }}>
                  Submit for Verification →
                </button>
              </div>
            </motion.div>
          )}

          {/* SUBMITTING */}
          {step === 'submitting' && (
            <motion.div key="sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 mx-auto mb-4"
                style={{ borderColor: border, borderTopColor: accent }} />
              <p className="font-bold" style={{ color: textMain }}>Verifying your credentials…</p>
              <p className="text-sm mt-1" style={{ color: textMute }}>
                {credType?.id?.startsWith('npi') ? 'Querying NPPES federal registry…' :
                 credType?.id === 'finra_broker' ? 'Querying FINRA BrokerCheck…' :
                 'AI is analyzing your document…'}
              </p>
            </motion.div>
          )}

          {/* DONE */}
          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="text-center py-8">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6 }}
                  className="text-6xl mb-4">
                  {result.status === 'auto_verified' ? '✅' : result.status === 'manual_review' ? '📋' : '❌'}
                </motion.div>
                <h2 className="text-2xl font-black mb-2" style={{ color: textMain }}>
                  {result.status === 'auto_verified' ? 'Verified!' :
                   result.status === 'manual_review' ? 'Under Review' : 'Not Verified'}
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: textMute }}>
                  {result.status === 'auto_verified'
                    ? `Your ${credType?.label} credential has been verified via ${result.source}. Your Trading Post storefront is ready to set up. +100 $VLG added to your wallet.`
                    : result.status === 'manual_review'
                    ? 'Your application is being reviewed by our team. We\'ll notify you within 24–48 hours.'
                    : `Verification failed: ${result.notes}`}
                </p>
                {result.confidence && (
                  <div className="rounded-2xl p-3 mb-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <p className="text-xs" style={{ color: textMute }}>Verification confidence: <span className="font-bold" style={{ color: accent }}>{result.confidence}%</span></p>
                    {result.specialty && <p className="text-xs mt-0.5" style={{ color: textMute }}>Specialty: {result.specialty}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  {result.status === 'auto_verified' && (
                    <Link href="/village/trading-post"
                      className="block py-4 rounded-2xl font-black text-white text-base"
                      style={{ background: accent }}>
                      Open My Trading Post Storefront →
                    </Link>
                  )}
                  <Link href="/village/hospital"
                    className="block py-3 rounded-2xl font-bold text-sm text-center"
                    style={{ background: isNight ? '#1E2240' : '#ECFDF5', color: textMute }}>
                    Back to Hospital
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
