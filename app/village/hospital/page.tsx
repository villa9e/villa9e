'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { icon: '🩺', label: 'Licensed Therapists', desc: 'HIPAA-compliant video sessions', specialty: 'Therapy & Counseling' },
  { icon: '🧘', label: 'Meditation & Mindfulness', desc: 'Guided sessions from certified teachers', specialty: 'Meditation' },
  { icon: '🌿', label: 'Alternative Healing', desc: 'Homeopathic, naturopathic, herbalism', specialty: 'Alternative Medicine' },
  { icon: '💆', label: 'Energy Work', desc: 'Reiki, acupuncture, somatic healing', specialty: 'Energy Healing' },
  { icon: '🌟', label: 'Spiritual Guidance', desc: 'Tarot, astrology, oracle — verified practitioners', specialty: 'Spiritual Guidance' },
  { icon: '🍃', label: 'Nutrition & Wellness', desc: 'Certified nutritionists and wellness coaches', specialty: 'Nutrition' },
];

export default function HospitalPage() {
  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-emerald-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🏥</span>
        <div>
          <h1 className="text-xl font-bold leading-tight">Hospital</h1>
          <p className="text-emerald-100 text-xs">Wellness & Healing — Free to browse</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Spirit wellness check */}
        <div className="village-card bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🌿</span>
            <div>
              <p className="font-bold text-emerald-700">Spirit says:</p>
              <p className="text-sm text-gray-600 mt-1">
                "You cannot achieve your goals if your body, mind, and spirit are depleted. The Hospital exists to keep you whole."
              </p>
            </div>
          </div>
        </div>

        {/* Find a provider CTA */}
        <Link href="/village/hospital/providers" className="block">
          <motion.div whileHover={{ scale: 1.01 }} className="village-card bg-gradient-to-r from-emerald-600 to-teal-500 text-white cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Find a Provider</p>
                <p className="text-emerald-100 text-sm mt-0.5">4 verified practitioners available now</p>
              </div>
              <span className="text-4xl">🔍</span>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="text-xs bg-white/20 rounded-full px-3 py-1">NPI Verified</span>
              <span className="text-xs bg-white/20 rounded-full px-3 py-1">HIPAA Compliant</span>
              <span className="text-xs bg-white/20 rounded-full px-3 py-1">1.5% fee</span>
            </div>
          </motion.div>
        </Link>

        {/* Provider notice */}
        <div className="village-card border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">Provider Verification</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">NPI Verified ✓</span>
          </div>
          <p className="text-xs text-gray-500">
            Licensed providers are verified via NPPES in real-time. Traditional medicine practitioners display community verification tier.
            villa9e earns 1.5% commission per completed session.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h2 className="font-bold mb-3">Browse by Specialty</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.label} href={`/village/hospital/providers?specialty=${encodeURIComponent(cat.specialty)}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="village-card hover:shadow-md transition-shadow cursor-pointer h-full"
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Are you a provider? */}
        <div className="village-card text-center bg-gradient-to-br from-emerald-50 to-white">
          <p className="font-bold mb-1">Are you a provider?</p>
          <p className="text-sm text-gray-500 mb-4">Join the village. Set your own rates. Reach people who need you.</p>
          <Link href="/village/hospital/apply" className="inline-block bg-emerald-600 text-white rounded-full px-6 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors">
            Apply to List Your Practice
          </Link>
          <p className="text-xs text-gray-400 mt-2">NPI verification takes &lt; 5 seconds</p>
        </div>
      </div>
    </div>
  );
}
