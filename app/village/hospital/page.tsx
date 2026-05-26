'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { VillageHeader } from '@/components/village/VillageHeader';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const CATEGORIES = [
  { icon: '🩺', label: 'Licensed Therapists',     desc: 'HIPAA-compliant video sessions',           specialty: 'Therapy & Counseling' },
  { icon: '🧘', label: 'Meditation & Mindfulness', desc: 'Guided sessions from certified teachers',  specialty: 'Meditation' },
  { icon: '🌿', label: 'Alternative Healing',      desc: 'Homeopathic, naturopathic, herbalism',     specialty: 'Alternative Medicine' },
  { icon: '💆', label: 'Energy Work',              desc: 'Reiki, acupuncture, somatic healing',      specialty: 'Energy Healing' },
  { icon: '🌟', label: 'Spiritual Guidance',       desc: 'Tarot, astrology, oracle — verified',      specialty: 'Spiritual Guidance' },
  { icon: '🍃', label: 'Nutrition & Wellness',     desc: 'Certified nutritionists and coaches',      specialty: 'Nutrition' },
];

export default function HospitalPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const bg       = isNight ? '#0A0B12' : '#F0FDF4';
  const cardBg   = isNight ? '#12152A' : '#FFFFFF';
  const border   = isNight ? '#1E2240' : '#BBF7D0';
  const textMain = isNight ? '#F0EBE0' : '#052E16';
  const textMute = isNight ? '#4A4F72' : '#166534';
  const accent   = isNight ? '#34D399' : '#059669';

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      {isNight && (
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.05) 0%, transparent 60%)' }} />
      )}
      <VillageHeader title="Hospital" subtitle="Wellness & Healing — Free to browse" icon="🏥" accentColor={accent} />

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: isNight ? '#0D1F1A' : '#ECFDF5', border: `1px solid ${isNight ? '#1A3D2F' : '#A7F3D0'}` }}>
          <span className="text-3xl">🌿</span>
          <div>
            <p className="font-bold text-sm" style={{ color: accent }}>Spirit says:</p>
            <p className="text-sm mt-1 leading-relaxed italic" style={{ color: textMute }}>
              "You cannot achieve your goals if your body, mind, and spirit are depleted. The Hospital exists to keep you whole."
            </p>
          </div>
        </div>

        <Link href="/village/hospital/providers">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="rounded-2xl p-5 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-white text-lg">Find a Provider</p>
                <p className="text-green-100 text-sm mt-0.5">4 verified practitioners available now</p>
              </div>
              <span className="text-4xl">🔍</span>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['NPI Verified', 'HIPAA Compliant', '1.5% platform fee'].map(tag => (
                <span key={tag} className="text-xs rounded-full px-3 py-1"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{tag}</span>
              ))}
            </div>
          </motion.div>
        </Link>

        <Link href="/village/hospital/apply">
          <div className="rounded-2xl p-4 flex items-center justify-between cursor-pointer"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div>
              <p className="font-bold text-sm" style={{ color: textMain }}>Are you a practitioner?</p>
              <p className="text-xs mt-0.5" style={{ color: textMute }}>Apply to join the hospital as a verified provider</p>
            </div>
            <span className="text-2xl">➕</span>
          </div>
        </Link>

        <div>
          <h2 className="font-black mb-3" style={{ color: textMain }}>Browse by Specialty</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/village/hospital/providers?specialty=${encodeURIComponent(cat.specialty)}`}>
                  <div className="rounded-2xl p-4 h-full cursor-pointer transition-all"
                    style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <p className="text-2xl mb-2">{cat.icon}</p>
                    <p className="font-bold text-sm leading-tight" style={{ color: textMain }}>{cat.label}</p>
                    <p className="text-xs mt-1 leading-snug" style={{ color: textMute }}>{cat.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4 space-y-2" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <p className="font-bold text-sm" style={{ color: textMain }}>How villa9e verifies providers</p>
          {[
            { icon: '✓', text: 'NPI number cross-referenced with national registry' },
            { icon: '🔒', text: 'HIPAA-compliant video via Doxy.me' },
            { icon: '👥', text: 'Community reviewed — 3+ OoWops from clients' },
            { icon: '💰', text: 'villa9e earns 1.5% — provider keeps the rest' },
          ].map(item => (
            <div key={item.text} className="flex items-start gap-2">
              <span className="text-sm font-bold flex-shrink-0" style={{ color: accent }}>{item.icon}</span>
              <p className="text-xs" style={{ color: textMute }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
