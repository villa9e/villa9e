'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { VillageSound } from '@/lib/sounds/village';

type PortalTab = 'dashboard' | 'patients' | 'diagnostics' | 'messages';

export default function ProviderPortalPage() {
  const [provider, setProvider]     = useState<any>(null);
  const [sessions, setSessions]     = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [messages, setMessages]     = useState<any[]>([]);
  const [patients, setPatients]     = useState<any[]>([]);
  const [activeTab, setActiveTab]   = useState<PortalTab>('dashboard');
  const [loading, setLoading]       = useState(true);
  const [notVerified, setNotVerified] = useState(false);
  // Diagnostic submission
  const [imageUrl, setImageUrl]     = useState('');
  const [eyeSide, setEyeSide]       = useState('OD');
  const [patientRef, setPatientRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  // Messaging
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [msgText, setMsgText]       = useState('');
  const [sending, setSending]       = useState(false);
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  const bg       = isNight ? '#0A0B12' : '#F0FDF4';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#BBF7D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A4F72' : '#166634';
  const accent   = isNight ? '#34D399' : '#059669';

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prov } = await (supabase as any)
      .from('provider_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!prov || !['auto_verified','approved'].includes(prov.verification_status)) {
      setNotVerified(true);
      setLoading(false);
      return;
    }

    setProvider(prov);

    const [{ data: sess }, { data: diag }, { data: msgs }] = await Promise.all([
      (supabase as any).from('provider_sessions').select('*, profiles!provider_sessions_patient_user_id_fkey(username,display_name)').eq('provider_id', prov.id).order('scheduled_at', { ascending: false }).limit(10),
      (supabase as any).from('diagnostic_submissions').select('*').eq('provider_id', prov.id).order('created_at', { ascending: false }).limit(10),
      (supabase as any).from('provider_messages').select('*, profiles!provider_messages_patient_user_id_fkey(username,display_name)').eq('provider_id', prov.id).order('sent_at', { ascending: false }).limit(30),
    ]);

    setSessions(sess ?? []);
    setDiagnostics(diag ?? []);
    setMessages(msgs ?? []);

    // Build patient list from sessions + messages
    const patientMap: Record<string, any> = {};
    [...(sess ?? []), ...(msgs ?? [])].forEach((r: any) => {
      const p = r.profiles;
      if (p) patientMap[r.patient_user_id] = { ...p, id: r.patient_user_id };
    });
    setPatients(Object.values(patientMap));
    setLoading(false);
  }

  async function submitDiagnostic() {
    if (!imageUrl || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/hospital/diagnostics/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, eye_side: eyeSide, patient_ref: patientRef }),
      });
      const data = await res.json();
      setSubmitResult(data);
      VillageSound.stepComplete();
      if (data.ok) { setImageUrl(''); setPatientRef(''); load(); }
    } catch { /* silent */ }
    setSubmitting(false);
  }

  async function sendMessage() {
    if (!msgText.trim() || !selectedPatient || sending) return;
    setSending(true);
    await (supabase as any).from('provider_messages').insert({
      provider_id:       provider.id,
      patient_user_id:   selectedPatient.id,
      sender_is_provider: true,
      content:           msgText.trim(),
    });
    setMsgText('');
    VillageSound.tap();
    load();
    setSending(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-4xl animate-pulse">🏥</div>
    </div>
  );

  if (notVerified) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: bg }}>
      <p className="text-5xl mb-4">🔒</p>
      <h2 className="text-2xl font-black mb-2" style={{ color: textMain }}>Provider Portal</h2>
      <p className="text-sm mb-6" style={{ color: textMute }}>You need to be a verified professional to access the provider portal.</p>
      <Link href="/village/hospital/join"
        className="px-6 py-3 rounded-2xl font-bold text-white"
        style={{ background: accent }}>
        Get Verified →
      </Link>
    </div>
  );

  const TABS: [PortalTab, string, string][] = [
    ['dashboard',   '📊', 'Overview'],
    ['patients',    '👤', 'Patients'],
    ['diagnostics', '🔬', 'Imaging'],
    ['messages',    '💬', 'Messages'],
  ];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: isNight ? '#0E1020' : accent, borderColor: isNight ? '#1E2240' : 'transparent' }}>
        <Link href="/village/hospital" className="text-xl text-white">←</Link>
        <span className="text-2xl">🏥</span>
        <div className="flex-1">
          <h1 className="font-black text-white text-base">Provider Portal</h1>
          <p className="text-white/60 text-xs">{provider?.display_name} · {provider?.specialty}</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white">
          ✅ Verified
        </span>
      </div>

      <div className="flex border-b" style={{ background: cardBg, borderColor: border }}>
        {TABS.map(([tab, icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-bold transition-all flex flex-col items-center gap-0.5"
            style={{ color: activeTab === tab ? accent : textMute, borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent' }}>
            <span>{icon}</span><span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sessions',   value: sessions.length },
                { label: 'Scans',      value: diagnostics.length },
                { label: 'Patients',   value: patients.length },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <p className="font-black text-2xl" style={{ color: accent }}>{s.value}</p>
                  <p className="text-xs" style={{ color: textMute }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-3" style={{ color: textMain }}>Recent Sessions</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: textMute }}>No sessions yet. Share your storefront to get bookings.</p>
              ) : sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: border }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                    style={{ background: isNight ? '#1E2240' : '#ECFDF5', color: accent }}>
                    {s.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: textMain }}>@{s.profiles?.username}</p>
                    <p className="text-xs" style={{ color: textMute }}>{s.session_type} · {s.status}</p>
                  </div>
                  <p className="font-bold text-sm" style={{ color: accent }}>{s.rate ? `$${s.rate}` : '—'}</p>
                </div>
              ))}
            </div>

            <Link href="/village/hospital/join"
              className="block text-center py-3 rounded-2xl text-sm font-bold"
              style={{ background: isNight ? '#1E2240' : '#ECFDF5', color: textMute }}>
              Edit Provider Profile →
            </Link>
          </>
        )}

        {/* PATIENTS */}
        {activeTab === 'patients' && (
          <div className="space-y-2">
            {patients.length === 0 ? (
              <div className="text-center py-10" style={{ color: textMute }}>
                <p className="text-3xl mb-2">👤</p>
                <p>No patients yet. Accept your first booking to get started.</p>
              </div>
            ) : patients.map(patient => (
              <button key={patient.id} onClick={() => { setSelectedPatient(patient); setActiveTab('messages'); }}
                className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
                style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black"
                  style={{ background: isNight ? '#1E2240' : '#ECFDF5', color: accent }}>
                  {patient.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: textMain }}>@{patient.username}</p>
                  <p className="text-xs" style={{ color: textMute }}>{patient.display_name}</p>
                </div>
                <span className="ml-auto text-lg" style={{ color: textMute }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <>
            {/* Submit new scan */}
            <div className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="font-black text-sm mb-3" style={{ color: textMain }}>Submit New Scan to AEYE Health</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: textMute }}>Image URL (Cloudinary)</label>
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textMute }}>Eye Side</label>
                    <select value={eyeSide} onChange={e => setEyeSide(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }}>
                      <option value="OD">OD (Right)</option>
                      <option value="OS">OS (Left)</option>
                      <option value="OU">OU (Both)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: textMute }}>Patient Ref (EHR ID)</label>
                    <input value={patientRef} onChange={e => setPatientRef(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
                  </div>
                </div>
                <button onClick={submitDiagnostic} disabled={!imageUrl || submitting}
                  className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-40"
                  style={{ background: accent }}>
                  {submitting ? '⟳ Submitting to AEYE Health…' : '🔬 Submit for AI Analysis (CPT 92229)'}
                </button>
                {submitResult?.ok && (
                  <p className="text-xs text-center" style={{ color: accent }}>
                    ✓ Submitted · ID: {submitResult.submission_id?.slice(0,8)}… · Status: {submitResult.status}
                  </p>
                )}
              </div>
            </div>

            {/* Past submissions */}
            <div className="space-y-2">
              {diagnostics.map(d => (
                <div key={d.id} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm" style={{ color: textMain }}>{d.image_type} scan · {d.eye_side ?? '—'}</p>
                      <p className="text-xs" style={{ color: textMute }}>{new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-bold"
                      style={{
                        background: d.aeye_status === 'complete' ? '#DCFCE7' : '#FEF9C3',
                        color:      d.aeye_status === 'complete' ? '#16A34A' : '#D97706',
                      }}>
                      {d.aeye_status}
                    </span>
                  </div>
                  {d.aeye_findings && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: textMute }}>{d.aeye_findings}</p>
                  )}
                  {d.aeye_severity && (
                    <p className="text-xs mt-1 font-bold" style={{ color: d.aeye_severity === 'none' ? '#16A34A' : '#DC2626' }}>
                      Severity: {d.aeye_severity}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: textMute }}>CPT {d.cpt_code} · {d.is_billable ? '✓ Billable' : 'Not billable'}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MESSAGES (secure provider-patient) */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {/* Patient selector */}
            {patients.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {patients.map(p => (
                  <button key={p.id} onClick={() => setSelectedPatient(p)}
                    className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      background: selectedPatient?.id === p.id ? accent : (isNight ? '#1E2240' : '#ECFDF5'),
                      color:      selectedPatient?.id === p.id ? '#fff' : textMute,
                    }}>
                    @{p.username}
                  </button>
                ))}
              </div>
            )}

            {selectedPatient ? (
              <>
                <div className="rounded-2xl p-4 space-y-3" style={{ background: cardBg, border: `1px solid ${border}`, minHeight: 200 }}>
                  <p className="font-bold text-sm" style={{ color: accent }}>HIPAA-compliant · @{selectedPatient.username}</p>
                  {messages.filter((m: any) => m.patient_user_id === selectedPatient.id).map((m: any) => (
                    <div key={m.id} className={`flex ${m.sender_is_provider ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs rounded-2xl px-4 py-2.5 text-sm"
                        style={m.sender_is_provider
                          ? { background: accent, color: '#fff', borderBottomRightRadius: 4 }
                          : { background: isNight ? '#1E2240' : '#F0FDF4', color: textMain, borderBottomLeftRadius: 4 }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Secure message to patient…"
                    className="flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none"
                    style={{ background: isNight ? '#0A0B12' : '#ECFDF5', border: `1px solid ${border}`, color: textMain }} />
                  <button onClick={sendMessage} disabled={!msgText.trim() || sending}
                    className="rounded-2xl px-4 py-3 font-bold text-white disabled:opacity-40"
                    style={{ background: accent }}>↑</button>
                </div>
              </>
            ) : (
              <div className="text-center py-10" style={{ color: textMute }}>
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">Select a patient above to start a secure conversation.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
