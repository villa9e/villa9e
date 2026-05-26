'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SPECIALTIES = ['All','Therapy & Counseling','Meditation','Energy Healing','Nutrition','Physical Therapy','Spiritual Guidance','Alternative Medicine','Life Coaching'];

// Mock providers until real ones join
const MOCK_PROVIDERS = [
  { id: '1', name: 'Dr. Amara Williams', specialty: 'Therapy & Counseling', verified: true, npi_verified: true, rate: 120, rating: 4.9, reviews: 47, bio: 'Licensed therapist specializing in goal anxiety, burnout, and life transitions.', availability: 'Mon–Fri', accepts_insurance: false },
  { id: '2', name: 'Marcus Chen', specialty: 'Meditation', verified: true, npi_verified: false, rate: 60, rating: 4.8, reviews: 31, bio: 'Certified mindfulness instructor. 10 years of practice, 5 years of teaching.', availability: 'Weekends', accepts_insurance: false },
  { id: '3', name: 'Zara Okafor', specialty: 'Energy Healing', verified: true, npi_verified: false, rate: 85, rating: 4.7, reviews: 22, bio: 'Reiki master and somatic practitioner. Lineage-verified, community-reviewed.', availability: 'Tue, Thu, Sat', accepts_insurance: false },
  { id: '4', name: 'Dr. James Rivera', specialty: 'Nutrition', verified: true, npi_verified: true, rate: 95, rating: 4.9, reviews: 63, bio: 'Registered dietitian. Holistic approach to nutrition for high-achievers.', availability: 'Mon, Wed, Fri', accepts_insurance: true },
];

export default function HospitalProvidersPage() {
  const searchParams = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') ?? 'All';
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [bookingDate, setBookingDate] = useState('');

  const filtered = MOCK_PROVIDERS.filter(p =>
    (specialty === 'All' || p.specialty === specialty) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  function book(provider: any) { setSelected(provider); setBookingStep('confirm'); }
  function confirmBooking() { setBookingStep('done'); }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-emerald-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/hospital" className="text-xl">←</Link>
        <span className="text-2xl">🏥</span>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">Find a Provider</h1>
          <p className="text-emerald-100 text-xs">Verified practitioners · villa9e earns 1.5%</p>
        </div>
      </div>

      {/* Booking modal */}
      {selected && bookingStep !== 'select' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4">
            {bookingStep === 'confirm' ? (
              <>
                <h2 className="text-xl font-bold">Book with {selected.name}</h2>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <p className="font-bold">{selected.specialty}</p>
                  <p className="text-sm text-gray-500">${selected.rate}/session · {selected.availability}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preferred Date & Time</label>
                  <input type="datetime-local" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-500 space-y-1">
                  <p>💳 Payment collected after session confirms</p>
                  <p>🔒 HIPAA-compliant video via Doxy.me</p>
                  <p>💰 villa9e earns 1.5% platform fee</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setSelected(null); setBookingStep('select'); }} className="flex-1 border border-gray-200 rounded-full py-3 text-gray-500">Cancel</button>
                  <button onClick={confirmBooking} disabled={!bookingDate} className="flex-1 bg-emerald-600 text-white rounded-full py-3 font-bold disabled:opacity-50">
                    Confirm Booking
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="text-6xl animate-float">✅</div>
                <h2 className="text-2xl font-bold text-emerald-700">Booking Requested!</h2>
                <p className="text-gray-500 text-sm">{selected.name} will confirm your session. You'll receive a notification with the video link.</p>
                <button onClick={() => { setSelected(null); setBookingStep('select'); }} className="village-btn-primary w-full">
                  Back to Providers
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search providers by name or specialty…"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-sm" />

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setSpecialty(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${specialty === s ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
              {s}
            </button>
          ))}
        </div>

        {filtered.map((provider, i) => (
          <motion.div key={provider.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="village-card">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">🩺</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{provider.name}</p>
                    <p className="text-sm text-emerald-600">{provider.specialty}</p>
                  </div>
                  <span className="text-village-blue font-bold text-sm flex-shrink-0">${provider.rate}/sess</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {provider.npi_verified && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">NPI Verified ✓</span>}
                  {!provider.npi_verified && provider.verified && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Community Verified</span>}
                  {provider.accepts_insurance && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Insurance</span>}
                  <span className="text-xs text-amber-500">★ {provider.rating} ({provider.reviews})</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{provider.bio}</p>
                <p className="text-xs text-gray-400 mt-0.5">📅 {provider.availability}</p>
              </div>
            </div>
            <button onClick={() => book(provider)} className="mt-3 w-full bg-emerald-600 text-white rounded-full py-2.5 text-sm font-bold hover:bg-emerald-700 transition-colors">
              Book Session
            </button>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p>No providers found for "{search || specialty}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
