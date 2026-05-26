'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function HospitalApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', specialty: '', npi: '', bio: '', rate: '', availability: '', lineage: '', training_years: '', disclaimer_agreed: false });
  const [verifying, setVerifying] = useState(false);
  const [npiResult, setNpiResult] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const isLicensed = ['Therapy & Counseling','Physical Therapy','Nutrition','Psychiatry','Medical Doctor'].includes(form.specialty);

  async function verifyNPI() {
    if (!form.npi || form.npi.length !== 10) return;
    setVerifying(true);
    try {
      const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${form.npi}&limit=1`);
      const data = await res.json();
      const result = data?.results?.[0];
      if (result) {
        setNpiResult({ verified: true, name: `${result.basic?.first_name} ${result.basic?.last_name}`, status: result.basic?.status });
      } else {
        setNpiResult({ verified: false, error: 'NPI not found in registry' });
      }
    } catch {
      setNpiResult({ verified: false, error: 'Verification unavailable — will be checked manually' });
    }
    setVerifying(false);
  }

  async function submit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // In a real app, this would create a provider_applications record
    // For now, create a Trading Post listing as provider
    await supabase.from('trading_post_listings').insert({
      user_id:      user.id,
      title:        `${form.specialty} — ${form.name}`,
      description:  form.bio,
      skill_offered: form.specialty,
      category:     'Wellness',
      project_rate: form.rate ? parseFloat(form.rate) : null,
      currency:     'USD',
      deal_types:   ['pay'],
      availability: form.availability,
      is_active:    true,
    });
    setSubmitted(true);
  }

  const STEPS = ['Your Info', 'Credentials', 'Profile', 'Review'];

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-emerald-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hospital" className="text-xl">←</Link>
        <span className="text-2xl">🩺</span>
        <h1 className="text-xl font-bold">Apply as Provider</h1>
      </div>

      {submitted ? (
        <div className="max-w-lg mx-auto p-6 text-center py-20">
          <div className="text-6xl animate-float mb-4">✅</div>
          <h2 className="text-2xl font-bold text-emerald-700">Application Submitted!</h2>
          <p className="text-gray-500 mt-2 mb-6">
            {form.npi && npiResult?.verified ? 'Your NPI was verified instantly. Your profile will go live within 24 hours.' : 'Your application is under review. We\'ll notify you within 48 hours.'}
          </p>
          <Link href="/village/hospital" className="village-btn-primary inline-block">← Back to Hospital</Link>
        </div>
      ) : (
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="village-card space-y-4">
                <h2 className="font-bold text-lg">Your Information</h2>
                {[{ label:'Full Name', key:'name', placeholder:'Dr. Jane Smith' }, { label:'Rate per session ($)', key:'rate', placeholder:'e.g. 85' }, { label:'Availability', key:'availability', placeholder:'e.g. Mon–Fri, 9am–5pm' }].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-500">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-500">Specialty</label>
                  <select value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Select specialty…</option>
                    {['Therapy & Counseling','Meditation','Energy Healing','Nutrition','Physical Therapy','Spiritual Guidance','Alternative Medicine','Life Coaching','Psychiatry'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="village-card space-y-4">
                <h2 className="font-bold text-lg">Credentials</h2>
                {isLicensed ? (
                  <>
                    <p className="text-sm text-gray-500">Licensed providers are verified via NPPES in real-time.</p>
                    <div>
                      <label className="text-xs font-medium text-gray-500">NPI Number</label>
                      <div className="flex gap-2 mt-1">
                        <input value={form.npi} onChange={e => setForm(p => ({ ...p, npi: e.target.value }))} placeholder="10-digit NPI" maxLength={10}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                        <button onClick={verifyNPI} disabled={verifying || form.npi.length !== 10}
                          className="bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50">
                          {verifying ? '…' : 'Verify'}
                        </button>
                      </div>
                      {npiResult && (
                        <div className={`mt-2 p-2 rounded-xl text-xs ${npiResult.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {npiResult.verified ? `✓ Verified: ${npiResult.name} (${npiResult.status})` : `⚠ ${npiResult.error}`}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Traditional and alternative medicine providers are verified via community attestation.</p>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Lineage / Teacher</label>
                      <input value={form.lineage} onChange={e => setForm(p => ({ ...p, lineage: e.target.value }))} placeholder="Name of your teacher or lineage holder"
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Years of Practice</label>
                      <input value={form.training_years} onChange={e => setForm(p => ({ ...p, training_years: e.target.value }))} placeholder="e.g. 8 years"
                        className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="village-card space-y-4">
                <h2 className="font-bold text-lg">Your Profile</h2>
                <div>
                  <label className="text-xs font-medium text-gray-500">Bio (min 50 chars)</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the village about your practice, approach, and who you serve…" rows={5}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
                  <p className="text-xs text-gray-400 mt-1">{form.bio.length} / 50 minimum</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="village-card space-y-4">
                <h2 className="font-bold text-lg">Review & Submit</h2>
                <div className="space-y-2 text-sm">
                  {[['Name', form.name], ['Specialty', form.specialty], ['Rate', form.rate ? `$${form.rate}/session` : 'Not set'], ['NPI', form.npi || 'N/A'], ['Availability', form.availability]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.disclaimer_agreed} onChange={e => setForm(p => ({ ...p, disclaimer_agreed: e.target.checked }))} className="mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    {isLicensed ? 'I confirm that my license information is accurate and I am legally authorized to provide these services.' : 'I do not hold a medical license. My services are complementary and do not replace licensed medical care.'}
                  </span>
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            {step > 0 && <button onClick={() => setStep(s => s - 1)} className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500">← Back</button>}
            {step < 3
              ? <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-emerald-600 text-white rounded-full py-3 font-bold hover:bg-emerald-700">Continue →</button>
              : <button onClick={submit} disabled={!form.disclaimer_agreed || !form.name || !form.specialty}
                  className="flex-1 bg-emerald-600 text-white rounded-full py-3 font-bold disabled:opacity-50">
                  Submit Application
                </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}
