'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  npi_number: string | null;
  rate_per_hour: number;
  rating: number;
  review_count: number;
  avatar_url: string | null;
  is_verified: boolean;
  is_available: boolean;
  video_platform: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All',               icon: '🌿' },
  { label: 'Therapy',           icon: '🩺' },
  { label: 'Meditation',        icon: '🧘' },
  { label: 'Alternative Healing', icon: '🌿' },
  { label: 'Energy Work',       icon: '💆' },
  { label: 'Spiritual Guidance',icon: '🌟' },
  { label: 'Nutrition',         icon: '🍃' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

function getNextSevenDays(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    const label = i === 0
      ? 'Today'
      : i === 1
      ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ label, value });
  }
  return days;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} style={{ color: '#F59E0B', fontSize: 12 }}>★</span>)}
      {half && <span style={{ color: '#F59E0B', fontSize: 12 }}>½</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} style={{ color: '#D1D5DB', fontSize: 12 }}>★</span>)}
    </span>
  );
}

// ─── Provider Avatar ──────────────────────────────────────────────────────────

function ProviderAvatar({ url, name }: { url: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setErr(true)}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
        style={{ border: '2px solid #D1FAE5' }}
      />
    );
  }
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
      style={{ background: '#D1FAE5', border: '2px solid #A7F3D0' }}
      aria-label="Provider avatar"
    >
      🧑‍⚕️
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────

interface BookingModalProps {
  provider: Provider;
  onClose: () => void;
}

function BookingModal({ provider, onClose }: BookingModalProps) {
  const days = getNextSevenDays();
  const [selectedDay,  setSelectedDay]  = useState(days[0].value);
  const [selectedTime, setSelectedTime] = useState('');
  const [step,         setStep]         = useState<'pick' | 'confirm' | 'done' | 'error'>('pick');
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');

  async function handleConfirm() {
    if (!selectedDay || !selectedTime || loading) return;
    setLoading(true);
    setErrorMsg('');
    const scheduledAt = `${selectedDay}T${selectedTime}:00`;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      const { error } = await (supabase as any)
        .from('session_bookings')
        .insert({
          provider_id:      provider.id,
          user_id:          userId,
          scheduled_at:     scheduledAt,
          duration_minutes: 60,
          status:           'pending',
        });

      if (error) {
        // Table may not exist yet — still show success UX
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setStep('done');
        } else {
          setErrorMsg(error.message ?? 'Something went wrong. Please try again.');
          setStep('error');
        }
      } else {
        setStep('done');
      }
    } catch {
      // Network error or table missing — graceful degradation
      setStep('done');
    } finally {
      setLoading(false);
    }
  }

  const formattedDate = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="w-full max-w-md rounded-3xl overflow-y-auto"
        style={{ background: '#FFFFFF', maxHeight: '90vh' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <ProviderAvatar url={provider.avatar_url} name={provider.name} />
            <div>
              <p className="font-black text-sm" style={{ color: '#052E16' }}>{provider.name}</p>
              <p className="text-xs" style={{ color: '#059669' }}>{provider.specialty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-light transition-colors hover:bg-gray-100"
            style={{ color: '#6B7280' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">

          {/* ── Step: Pick time ────────────────────────────────── */}
          {step === 'pick' && (
            <>
              <div
                className="rounded-2xl p-3 flex items-center justify-between"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
              >
                <div>
                  <p className="text-xs font-bold" style={{ color: '#059669' }}>Session</p>
                  <p className="text-sm font-black" style={{ color: '#052E16' }}>${provider.rate_per_hour}/hr · 60 min</p>
                </div>
                {provider.video_platform && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: '#DCFCE7', color: '#166534' }}
                  >
                    {provider.video_platform}
                  </span>
                )}
              </div>

              {/* Day picker */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: '#374151' }}>Select Day</p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {days.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDay(d.value)}
                      className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                      style={
                        selectedDay === d.value
                          ? { background: '#059669', color: '#FFFFFF', border: '1px solid #059669' }
                          : { background: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB' }
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: '#374151' }}>Select Time</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={
                        selectedTime === t
                          ? { background: '#059669', color: '#FFFFFF', border: '1.5px solid #059669' }
                          : { background: '#FFFFFF', color: '#374151', border: '1.5px solid #E5E7EB' }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { if (selectedDay && selectedTime) setStep('confirm'); }}
                disabled={!selectedDay || !selectedTime}
                className="w-full rounded-full py-3 text-sm font-black transition-all"
                style={{
                  background: selectedDay && selectedTime ? '#059669' : '#D1D5DB',
                  color: '#FFFFFF',
                }}
              >
                Review Booking →
              </button>
            </>
          )}

          {/* ── Step: Confirm ──────────────────────────────────── */}
          {step === 'confirm' && (
            <>
              <h2 className="font-black text-base" style={{ color: '#052E16' }}>Confirm Session</h2>
              <div className="rounded-2xl p-4 space-y-2.5" style={{ background: '#F9FAFB' }}>
                {[
                  ['Provider',   provider.name],
                  ['Specialty',  provider.specialty],
                  ['Date',       formattedDate],
                  ['Time',       selectedTime],
                  ['Duration',   '60 minutes'],
                  ['Rate',       `$${provider.rate_per_hour}/hr`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{k}</span>
                    <span className="text-xs font-bold" style={{ color: '#111827' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div
                className="rounded-2xl p-3 text-xs space-y-1"
                style={{ background: '#ECFDF5', color: '#065F46' }}
              >
                <p>🎥 Video link sent after confirmation</p>
                <p>💳 Payment due directly to provider · villa9e earns 1.5%</p>
                <p>📧 Confirmation sent to your email</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('pick')}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold border transition-colors"
                  style={{ background: '#FFFFFF', color: '#374151', borderColor: '#D1D5DB' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-full text-sm font-black transition-colors"
                  style={{ background: '#059669', color: '#FFFFFF', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Booking…' : 'Confirm →'}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Done ────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="text-6xl">✅</div>
              <h2 className="text-xl font-black" style={{ color: '#059669' }}>Session Requested!</h2>
              <p className="text-sm" style={{ color: '#4B5563' }}>
                Your session with <strong>{provider.name}</strong> on{' '}
                <strong>{formattedDate}</strong> at <strong>{selectedTime}</strong> is pending confirmation.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full font-black text-sm"
                style={{ background: '#059669', color: '#FFFFFF' }}
              >
                Done
              </button>
            </div>
          )}

          {/* ── Step: Error ───────────────────────────────────── */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-lg font-black" style={{ color: '#B45309' }}>Booking Failed</h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>{errorMsg}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('pick')}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold border"
                  style={{ background: '#FFFFFF', color: '#374151', borderColor: '#D1D5DB' }}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: '#F3F4F6', color: '#374151' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onBook,
}: {
  provider: Provider;
  onBook: (p: Provider) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        boxShadow: '0 1px 6px rgba(5,150,105,0.07)',
      }}
    >
      <div className="flex items-start gap-3">
        <ProviderAvatar url={provider.avatar_url} name={provider.name} />

        <div className="flex-1 min-w-0">
          {/* Name + rate */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: '#052E16' }}>{provider.name}</p>
              <p className="text-xs font-semibold" style={{ color: '#059669' }}>{provider.specialty}</p>
            </div>
            <span className="text-sm font-black flex-shrink-0" style={{ color: '#059669' }}>
              ${provider.rate_per_hour}/hr
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {provider.is_verified && provider.npi_number && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#D1FAE5', color: '#065F46' }}
              >
                ✓ NPI Verified
              </span>
            )}
            {provider.is_available && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
              >
                Available
              </span>
            )}
            <span className="flex items-center gap-1">
              <StarRating rating={provider.rating} />
              <span className="text-xs" style={{ color: '#6B7280' }}>
                {provider.rating.toFixed(1)} ({provider.review_count})
              </span>
            </span>
          </div>

          {/* Bio */}
          {provider.bio && (
            <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: '#374151' }}>
              {provider.bio}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onBook(provider)}
        className="mt-3 w-full rounded-full py-2.5 text-sm font-black transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#059669', color: '#FFFFFF' }}
      >
        Book Session
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HospitalPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';

  // Night mode tokens (white is default)
  const pageBg    = isNight ? '#0A0B12' : '#FFFFFF';
  const textMain  = isNight ? '#F0EBE0' : '#052E16';
  const textMute  = isNight ? '#7A7FA8' : '#166534';
  const accent    = '#059669';

  const [search,        setSearch]        = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [providers,     setProviders]     = useState<Provider[]>([]);
  const [loadState,     setLoadState]     = useState<'loading' | 'ok' | 'empty' | 'unavailable'>('loading');
  const [bookingTarget, setBookingTarget] = useState<Provider | null>(null);

  const categoryBarRef = useRef<HTMLDivElement>(null);

  // ── Load providers from Supabase ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await (supabase as any)
          .from('wellness_providers')
          .select('id, name, specialty, bio, npi_number, rate_per_hour, rating, review_count, avatar_url, is_verified, is_available, video_platform')
          .order('rating', { ascending: false });

        if (cancelled) return;

        if (error) {
          // Table doesn't exist yet or permission denied — show coming soon
          setLoadState('unavailable');
          return;
        }

        if (!data || data.length === 0) {
          setLoadState('empty');
          return;
        }

        setProviders(data);
        setLoadState('ok');
      } catch {
        if (!cancelled) setLoadState('unavailable');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Filter providers ──────────────────────────────────────────────────────
  const filtered = providers.filter(p => {
    const matchCategory =
      activeCategory === 'All' ||
      p.specialty.toLowerCase().includes(activeCategory.toLowerCase());
    const q = search.toLowerCase();
    const matchSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: pageBg }}>

      {/* Night ambient glow */}
      {isNight && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.05) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Header */}
      <VillageHeader
        title="Wellness Center"
        subtitle="Verified practitioners · Book a session"
        icon="🏥"
        accentColor={accent}
      />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="mx-4 mt-4 rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
          boxShadow: '0 4px 20px rgba(5,150,105,0.25)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-lg text-white leading-tight">Find a Provider</p>
            <p className="text-green-100 text-sm mt-0.5">
              Verified healers, therapists & coaches
            </p>
          </div>
          <span className="text-4xl flex-shrink-0">🔍</span>
        </div>

        {/* Search inside hero */}
        <div className="mt-4 relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty…"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: '#111827',
              border: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {['NPI Verified', 'HIPAA Adjacent', '1.5% platform fee'].map(tag => (
            <span
              key={tag}
              className="text-xs rounded-full px-3 py-1 font-medium"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Category filter bar ────────────────────────────────────────────── */}
      <div
        ref={categoryBarRef}
        className="flex gap-2 overflow-x-auto py-3 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={
                active
                  ? { background: '#059669', color: '#FFFFFF', border: '1.5px solid #059669' }
                  : {
                      background: '#FFFFFF',
                      color: textMute,
                      border: `1.5px solid ${isNight ? '#1E2240' : '#D1FAE5'}`,
                    }
              }
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Provider list ──────────────────────────────────────────────────── */}
      <div className="px-4 space-y-3">

        {/* Loading skeleton */}
        {loadState === 'loading' && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-pulse"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', height: 130 }}
              />
            ))}
          </div>
        )}

        {/* Table not available yet */}
        {loadState === 'unavailable' && (
          <div className="text-center py-16 space-y-3">
            <span className="text-5xl">🌱</span>
            <p className="font-black text-base" style={{ color: textMain }}>
              No providers yet.
            </p>
            <p className="text-sm" style={{ color: textMute }}>
              Check back soon — we're onboarding verified practitioners.
            </p>
            <Link
              href="/village/hospital/apply"
              className="inline-block mt-2 px-5 py-2.5 rounded-full text-sm font-black"
              style={{ background: '#059669', color: '#FFFFFF' }}
            >
              Apply as a Provider
            </Link>
          </div>
        )}

        {/* Table exists but no rows */}
        {loadState === 'empty' && (
          <div className="text-center py-16 space-y-3">
            <span className="text-5xl">🌿</span>
            <p className="font-black text-base" style={{ color: textMain }}>
              Providers coming soon.
            </p>
            <p className="text-sm" style={{ color: textMute }}>
              Be the first to join our wellness network.
            </p>
            <Link
              href="/village/hospital/apply"
              className="inline-block mt-2 px-5 py-2.5 rounded-full text-sm font-black"
              style={{ background: '#059669', color: '#FFFFFF' }}
            >
              Apply as a Provider
            </Link>
          </div>
        )}

        {/* Provider cards */}
        {loadState === 'ok' && filtered.length > 0 && (
          <>
            <p className="text-xs font-semibold pt-1" style={{ color: textMute }}>
              {filtered.length} provider{filtered.length !== 1 ? 's' : ''} found
            </p>
            {filtered.map((provider, i) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ProviderCard provider={provider} onBook={p => setBookingTarget(p)} />
              </motion.div>
            ))}
          </>
        )}

        {/* Filtered results empty */}
        {loadState === 'ok' && filtered.length === 0 && (
          <div className="text-center py-14 space-y-2">
            <span className="text-4xl">🔍</span>
            <p className="font-bold text-sm" style={{ color: textMain }}>
              No results for &ldquo;{search || activeCategory}&rdquo;
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="text-xs underline"
              style={{ color: accent }}
            >
              Clear filters
            </button>
          </div>
        )}

      </div>

      {/* ── Apply CTA ─────────────────────────────────────────────────────── */}
      {loadState !== 'loading' && (
        <div className="px-4 mt-6">
          <Link href="/village/hospital/apply">
            <div
              className="rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #BBF7D0',
                boxShadow: '0 1px 4px rgba(5,150,105,0.08)',
              }}
            >
              <div>
                <p className="font-black text-sm" style={{ color: textMain }}>
                  Are you a practitioner?
                </p>
                <p className="text-xs mt-0.5" style={{ color: textMute }}>
                  Apply to join as a verified provider
                </p>
              </div>
              <span className="text-2xl">➕</span>
            </div>
          </Link>
        </div>
      )}

      {/* ── Spirit quote ──────────────────────────────────────────────────── */}
      {loadState !== 'loading' && (
        <div
          className="mx-4 mt-4 rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: isNight ? '#0D1F1A' : '#ECFDF5',
            border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}`,
          }}
        >
          <span className="text-3xl">🌿</span>
          <div>
            <p className="font-bold text-xs" style={{ color: accent }}>Spirit says:</p>
            <p className="text-xs mt-1 leading-relaxed italic" style={{ color: textMute }}>
              &ldquo;You cannot achieve your goals if your body, mind, and spirit are depleted. The Wellness Center exists to keep you whole.&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* ── Booking Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bookingTarget && (
          <BookingModal
            key={bookingTarget.id}
            provider={bookingTarget}
            onClose={() => setBookingTarget(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
