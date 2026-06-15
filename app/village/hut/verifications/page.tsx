'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
type CredStatus = 'verified' | 'pending' | 'failed';

interface Credential {
  id: string;
  credential_type: string;
  issuing_body: string;
  issue_date: string;
  status: CredStatus;
  notes?: string;
}

const CREDENTIAL_TYPES = [
  'Business License',
  'Professional Certificate',
  'Academic Degree',
  'Trade Certification',
  'Government ID',
  'Insurance / Bonded',
  'Background Check',
  'Industry Accreditation',
  'Tax Registration',
  'Other',
];

const STATUS_STYLES: Record<CredStatus, { bg: string; color: string; label: string }> = {
  verified: { bg: 'rgba(13,148,136,0.15)', color: '#0D9488', label: 'Verified' },
  pending:  { bg: 'rgba(217,119,6,0.15)',  color: '#D97706', label: 'Pending' },
  failed:   { bg: 'rgba(239,68,68,0.15)',  color: '#EF4444', label: 'Failed'  },
};

// ── Upload Sheet ──────────────────────────────────────────────────────────────
function UploadSheet({ onClose, onAdded, supabase, userId }: { onClose: () => void; onAdded: (c: Credential) => void; supabase: any; userId: string }) {
  const [credType, setCredType] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
  };

  async function submit() {
    if (!credType) { setErr('Select a credential type'); return; }
    if (!issuingBody.trim()) { setErr('Enter issuing body'); return; }
    if (!issueDate) { setErr('Enter issue date'); return; }
    if (!userId) { setErr('Please sign in first'); return; }
    setSubmitting(true);
    const { data, error } = await (supabase as any).from('user_credentials').insert({
      user_id: userId,
      credential_type: credType,
      issuing_body: issuingBody.trim(),
      issue_date: issueDate,
      status: 'pending',
      notes: 'Under review — typically 3-5 business days',
    }).select().single();
    if (error || !data) { setErr('Failed to submit. Try again.'); setSubmitting(false); return; }
    onAdded(data as Credential);
    setSubmitting(false);
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#0F1020', borderRadius: '20px 20px 0 0', padding: '20px 20px 48px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Add Credential</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontWeight: 900 }}>×</button>
        </div>

        {/* Credential type */}
        <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 8 }}>CREDENTIAL TYPE</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {CREDENTIAL_TYPES.map(t => (
            <button key={t} onClick={() => setCredType(t)} style={{
              padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12,
              background: credType === t ? '#0D9488' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${credType === t ? '#0D9488' : 'rgba(255,255,255,0.1)'}`,
              color: credType === t ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        <input value={issuingBody} onChange={e => setIssuingBody(e.target.value)} placeholder="Issuing body (e.g. State of California)"
          style={{ ...inputStyle, marginBottom: 12 }} />

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>ISSUE DATE</p>
          <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>

        {/* File upload */}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
        <button onClick={() => fileRef.current?.click()} style={{
          width: '100%', padding: '14px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.2)',
          color: fileName ? '#0D9488' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {fileName || 'Upload document (image or PDF)'}
        </button>

        <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Our AI verifies credentials against issuing bodies in 3-5 business days. Once verified, your badge appears on your profile and eStore.
          </p>
        </div>

        {err && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 10, fontWeight: 700 }}>{err}</p>}
        <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={submitting} style={{
          width: '100%', padding: '16px 0', borderRadius: 14, background: '#0D9488',
          color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}>
          {submitting ? 'Submitting...' : 'Submit for Verification'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VerificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await (supabase as any)
        .from('user_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setCredentials(data ?? []);
    })();
  }, []);

  return (
    <div style={{ background: '#080E24', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(8,14,36,0.97)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/village/hut')} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Your Verifications</p>
          <button onClick={() => setShowUpload(true)} style={{ height: 36, borderRadius: 18, background: '#0D9488', display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', border: 'none', cursor: 'pointer' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>Add</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 100px' }}>
        {/* Info banner */}
        <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 16, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0D9488' }}>Verified credentials boost trust</p>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            Verified badges appear on your profile, eStore, and listing cards. They signal credibility to buyers and collaborators across The Village.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { v: credentials.filter(c => c.status === 'verified').length, l: 'Verified', color: '#0D9488' },
            { v: credentials.filter(c => c.status === 'pending').length, l: 'Pending', color: '#D97706' },
            { v: credentials.length, l: 'Total', color: '#2952E8' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.04em' }}>{s.l.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {/* Credential list */}
        <p style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 12 }}>YOUR CREDENTIALS</p>

        {credentials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,0.25)' }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No credentials yet</p>
            <p style={{ fontSize: 12, marginBottom: 16 }}>Add your first credential to build trust</p>
            <button onClick={() => setShowUpload(true)} style={{ padding: '10px 24px', borderRadius: 20, background: '#0D9488', color: '#fff', fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer' }}>Add Credential</button>
          </div>
        ) : (
          credentials.map(cred => {
            const ss = STATUS_STYLES[cred.status];
            return (
              <motion.div key={cred.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: `1px solid ${cred.status === 'verified' ? 'rgba(13,148,136,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{cred.credential_type}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{cred.issuing_body}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      Issued {new Date(cred.issue_date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {cred.notes && cred.status !== 'verified' && (
                      <p style={{ fontSize: 11, color: ss.color, marginTop: 6, lineHeight: 1.4 }}>{cred.notes}</p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, background: ss.bg, border: `1px solid ${ss.color}44`, borderRadius: 20, padding: '4px 10px' }}>
                    {cred.status === 'verified' && (
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={ss.color} strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 900, color: ss.color }}>{ss.label.toUpperCase()}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Footer link */}
        {credentials.some(c => c.status === 'verified') && (
          <div style={{ background: 'rgba(41,82,232,0.08)', border: '1px solid rgba(41,82,232,0.2)', borderRadius: 14, padding: '12px 16px', marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Verified credentials automatically appear on your eStore. Visit your{' '}
              <span style={{ color: '#4D72FF', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/village/trading-post/market')}>
                Market profile
              </span>
              {' '}to see them in action.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showUpload && (
          <UploadSheet
            onClose={() => setShowUpload(false)}
            onAdded={c => setCredentials(prev => [c, ...prev])}
            supabase={supabase}
            userId={userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
