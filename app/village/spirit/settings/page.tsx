'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { useSpiritVoice } from '@/components/village/SpiritVoiceProvider';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';
import { SPIRIT_VARIANTS } from '@/components/spirit/SpiritFigure';

const SpiritSelector = dynamic(
  () => import('@/components/spirit/SpiritSelector').then(m => ({ default: m.SpiritSelector })),
  { ssr: false, loading: () => <div className="h-52 rounded-3xl animate-pulse" style={{ background: 'rgba(24,119,242,0.06)' }} /> }
);

// ── All world spiritual/philosophical traditions ────────────────────────────
const TRADITIONS = [
  {
    category: 'Abrahamic',
    icon: '✝️',
    items: [
      'Christianity', 'Catholicism', 'Eastern Orthodox Christianity',
      'Evangelicalism', 'Pentecostalism', 'Seventh-day Adventism',
      'Mormonism (LDS)', 'Islam (Sunni)', 'Islam (Shia)', 'Sufism',
      'Judaism', 'Kabbalah', 'Bahá\'í',
    ],
  },
  {
    category: 'South Asian',
    icon: '🪷',
    items: [
      'Hinduism', 'Advaita Vedanta', 'Buddhism (Theravada)',
      'Buddhism (Zen / Mahayana)', 'Buddhism (Tibetan)', 'Jainism',
      'Sikhism', 'Zoroastrianism',
    ],
  },
  {
    category: 'East Asian',
    icon: '☯️',
    items: ['Taoism', 'Confucianism', 'Shinto'],
  },
  {
    category: 'African & Diaspora',
    icon: '🌍',
    items: [
      'Yoruba / Ifá', 'Vodou', 'Candomblé', 'Santería / Lucumí',
      'Kemetic Spirituality', 'Ubuntu Philosophy', 'Rastafari',
    ],
  },
  {
    category: 'Indigenous & Earth-Based',
    icon: '🌿',
    items: [
      'Indigenous / First Nations', 'Shamanism', 'Wicca / Witchcraft',
      'Paganism', 'Druidry', 'Asatru / Norse Heathenry',
    ],
  },
  {
    category: 'Mystical & Esoteric',
    icon: '🔮',
    items: [
      'Hermeticism', 'Gnosticism', 'New Age', 'Theosophy', 'Rosicrucianism',
    ],
  },
  {
    category: 'Philosophy',
    icon: '🏛️',
    items: [
      'Stoicism', 'Secular Humanism', 'Existentialism',
      'Pantheism / Panentheism', 'Unitarian Universalism',
    ],
  },
  {
    category: 'Personal',
    icon: '✨',
    items: [
      'Spiritual, not Religious', 'Eclectic / Syncretic',
      'Agnostic', 'Atheist (ethical living)', 'Other / My Own Path',
    ],
  },
] as const;

// ── Glow color presets ──────────────────────────────────────────────────────
const GLOW_PRESETS = [
  { label: 'Spirit Blue',   color: '#3B82F6' },
  { label: 'Violet',        color: '#7C3AED' },
  { label: 'Emerald',       color: '#10B981' },
  { label: 'Gold',          color: '#F59E0B' },
  { label: 'Rose',          color: '#F43F5E' },
  { label: 'Cyan',          color: '#06B6D4' },
  { label: 'White',         color: '#E8ECFF' },
  { label: 'Deep Purple',   color: '#4C1D95' },
];

const MAX_TRADITIONS = 3;

export default function SpiritSettingsPage() {
  const supabase = createClient();
  const { theme } = useVillageTheme();
  const { voiceGender, setGender, voiceEnabled, toggleVoice } = useSpiritVoice();
  const isNight = theme === 'night';

  const bg     = isNight ? '#080912' : '#F0F4FF';
  const card   = isNight ? '#0D1020' : '#FFFFFF';
  const border = isNight ? '#1A1F3A' : '#E0E7FF';
  const text   = isNight ? '#F0EBE0' : '#1E1B4B';
  const muted  = isNight ? '#4A4F72' : '#6B7280';
  const accent = '#7C3AED';

  // ── State ──────────────────────────────────────────────────────────────────
  const [spiritVariant, setSpiritVariant]         = useState<SpiritVariantId>('blue');
  const [selectedSystems, setSelectedSystems]     = useState<string[]>([]);
  const [glowColor, setGlowColor]                 = useState('#3B82F6');
  const [customColor, setCustomColor]             = useState('#3B82F6');
  const [saving, setSaving]                       = useState(false);
  const [saved, setSaved]                         = useState(false);
  const [activeCategory, setActiveCategory]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: s }] = await Promise.all([
        (supabase as any).from('profiles').select('avatar_config').eq('id', user.id).single(),
        (supabase as any).from('spirit_configs')
          .select('spiritual_systems, spiritual_system, spirit_glow_color')
          .eq('user_id', user.id).single(),
      ]);
      if (p?.avatar_config?.spirit_variant) {
        setSpiritVariant(p.avatar_config.spirit_variant as SpiritVariantId);
      }
      if (s?.spiritual_systems?.length) {
        setSelectedSystems(s.spiritual_systems);
      } else if (s?.spiritual_system) {
        setSelectedSystems([s.spiritual_system]);
      }
      if (s?.spirit_glow_color) {
        setGlowColor(s.spirit_glow_color);
        setCustomColor(s.spirit_glow_color);
      }
    }
    load();
  }, []);

  function toggleTradition(system: string) {
    setSelectedSystems(prev => {
      if (prev.includes(system)) return prev.filter(s => s !== system);
      if (prev.length >= MAX_TRADITIONS) return prev; // max 3
      return [...prev, system];
    });
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: profile } = await (supabase as any)
      .from('profiles').select('avatar_config').eq('id', user.id).single();

    await Promise.all([
      (supabase as any).from('profiles').update({
        avatar_config: { ...(profile?.avatar_config ?? {}), spirit_variant: spiritVariant },
      }).eq('id', user.id),
      (supabase as any).from('spirit_configs').upsert({
        user_id:          user.id,
        spiritual_systems: selectedSystems,
        spiritual_system:  selectedSystems[0] ?? 'Secular',
        spirit_glow_color: glowColor,
      }, { onConflict: 'user_id' }),
    ]);

    // Persist glow color to localStorage for the 3D companion
    localStorage.setItem('spirit_glow_color', glowColor);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const selectedCount = selectedSystems.length;

  return (
    <div className="min-h-screen pb-24" style={{ background: bg }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{ background: isNight ? 'rgba(8,9,18,0.92)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}` }}>
        <Link href="/village/spirit"
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{ background: `${accent}20`, color: accent }}>
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-black" style={{ color: text }}>Spirit Settings</h1>
          <p className="text-xs" style={{ color: muted }}>Personalize your companion</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
          style={{ background: saved ? 'rgba(34,197,94,0.2)' : accent, color: saved ? '#4ADE80' : '#fff' }}
        >
          {saved ? '✓ Saved' : saving ? '…' : 'Save'}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-4">

        {/* ── 1. Choose Your Spirit ──────────────────────────────────── */}
        <section className="rounded-3xl p-5 space-y-4" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: accent }}>Choose Your Spirit</h2>
          </div>
          <SpiritSelector selected={spiritVariant} onSelect={setSpiritVariant} />
          <div className="flex gap-2 justify-center">
            {SPIRIT_VARIANTS.map(v => (
              <button
                key={v.id}
                onClick={() => setSpiritVariant(v.id)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all"
                style={{
                  background: spiritVariant === v.id ? `${v.glowColor}20` : 'transparent',
                  border: `1.5px solid ${spiritVariant === v.id ? v.glowColor : 'transparent'}`,
                }}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: v.color }} />
                <span className="text-xs font-semibold" style={{ color: spiritVariant === v.id ? v.glowColor : muted }}>
                  {v.label.replace('Spirit ', '')}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 2. Voice ───────────────────────────────────────────────── */}
        <section className="rounded-3xl p-5 space-y-4" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: accent }}>Spirit Voice</h2>
          </div>

          {/* Voice on/off */}
          <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: text }}>Voice Enabled</p>
              <p className="text-xs" style={{ color: muted }}>Spirit speaks when guiding you</p>
            </div>
            <button
              onClick={toggleVoice}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: voiceEnabled ? accent : 'rgba(255,255,255,0.15)' }}
            >
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ left: voiceEnabled ? '26px' : '2px' }} />
            </button>
          </div>

          {/* Gender */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: muted }}>Voice Gender</p>
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className="py-3 rounded-2xl text-sm font-bold capitalize transition-all"
                  style={{
                    background: voiceGender === g ? `${accent}18` : 'transparent',
                    border: `1.5px solid ${voiceGender === g ? accent : border}`,
                    color: voiceGender === g ? accent : muted,
                  }}
                >
                  {g === 'female' ? '👩 Female' : '🧑 Male'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Spirit Glow Color ───────────────────────────────────── */}
        <section className="rounded-3xl p-5 space-y-4" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: accent }}>Spirit Glow</h2>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${glowColor}22`, border: `2px solid ${glowColor}55`, boxShadow: `0 0 24px ${glowColor}44` }}>
                <span className="text-2xl">🌿</span>
              </div>
            </div>
          </div>

          {/* Color presets */}
          <div className="grid grid-cols-4 gap-2">
            {GLOW_PRESETS.map(p => (
              <button
                key={p.color}
                onClick={() => { setGlowColor(p.color); setCustomColor(p.color); }}
                className="flex flex-col items-center gap-1.5 py-2 rounded-2xl transition-all"
                style={{
                  background: glowColor === p.color ? `${p.color}18` : 'transparent',
                  border: `1.5px solid ${glowColor === p.color ? p.color : border}`,
                }}
              >
                <div className="w-6 h-6 rounded-full" style={{ background: p.color, boxShadow: glowColor === p.color ? `0 0 8px ${p.color}88` : 'none' }} />
                <span className="text-[9px] font-semibold" style={{ color: glowColor === p.color ? p.color : muted }}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Custom color */}
          <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
            <input
              type="color"
              value={customColor}
              onChange={e => { setCustomColor(e.target.value); setGlowColor(e.target.value); }}
              className="w-10 h-10 rounded-xl cursor-pointer border-none"
            />
            <div>
              <p className="text-sm font-bold" style={{ color: text }}>Custom color</p>
              <p className="text-xs font-mono" style={{ color: muted }}>{customColor}</p>
            </div>
          </div>
        </section>

        {/* ── 4. Spiritual Wisdom Path ──────────────────────────────── */}
        <section className="rounded-3xl p-5 space-y-4" style={{ background: card, border: `1px solid ${border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🙏</span>
              <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: accent }}>Spiritual Wisdom Path</h2>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: selectedCount >= MAX_TRADITIONS ? `${accent}22` : `${accent}11`, color: accent }}>
              {selectedCount}/{MAX_TRADITIONS}
            </span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: muted }}>
            Choose up to {MAX_TRADITIONS} traditions. Spirit will speak as a knowledgeable guide within each — using their authentic language, practices, and wisdom.
          </p>

          {/* Selected traditions chips */}
          {selectedSystems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSystems.map(s => (
                <motion.button
                  key={s}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => toggleTradition(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}44` }}
                >
                  {s} <span style={{ opacity: 0.6 }}>×</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Category accordion */}
          <div className="space-y-2">
            {TRADITIONS.map(cat => {
              const isOpen = activeCategory === cat.category;
              const selectedInCat = cat.items.filter(i => selectedSystems.includes(i));
              return (
                <div key={cat.category} className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${border}` }}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3"
                    style={{ background: isOpen ? `${accent}10` : 'transparent' }}
                    onClick={() => setActiveCategory(isOpen ? null : cat.category)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-sm font-bold" style={{ color: text }}>{cat.category}</span>
                      {selectedInCat.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: accent, color: '#fff' }}>
                          {selectedInCat.length}
                        </span>
                      )}
                    </div>
                    <span style={{ color: muted, transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>
                      ↓
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2">
                          {cat.items.map(item => {
                            const isSelected = selectedSystems.includes(item);
                            const isDisabled = !isSelected && selectedCount >= MAX_TRADITIONS;
                            return (
                              <button
                                key={item}
                                onClick={() => !isDisabled && toggleTradition(item)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style={{
                                  background: isSelected ? accent : isNight ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  color: isSelected ? '#fff' : isDisabled ? muted : text,
                                  border: `1px solid ${isSelected ? accent : border}`,
                                  opacity: isDisabled ? 0.4 : 1,
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Save button ───────────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-3xl text-base font-black transition-all"
          style={{
            background: saved ? 'rgba(34,197,94,0.2)' : `linear-gradient(135deg, ${accent}, #1877F2)`,
            color: saved ? '#4ADE80' : '#fff',
            boxShadow: saved ? 'none' : '0 8px 32px rgba(124,58,237,0.35)',
          }}
        >
          {saved ? '✓ Settings Saved' : saving ? 'Saving…' : 'Save Spirit Settings'}
        </motion.button>
      </div>
    </div>
  );
}
