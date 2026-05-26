'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const SKILL_CHIPS = [
  { name: 'Graphic Design',      emoji: '🎨' },
  { name: 'Video Editing',       emoji: '🎬' },
  { name: 'Music Production',    emoji: '🎵' },
  { name: 'Photography',         emoji: '📸' },
  { name: 'Writing',             emoji: '✍️' },
  { name: 'Software Development',emoji: '💻' },
  { name: 'Web Development',     emoji: '🌐' },
  { name: 'UI/UX Design',        emoji: '🖌️' },
  { name: 'Marketing',           emoji: '📣' },
  { name: 'Sales',               emoji: '🤝' },
  { name: 'Financial Planning',  emoji: '💰' },
  { name: 'Business Strategy',   emoji: '♟️' },
  { name: 'Public Speaking',     emoji: '🎤' },
  { name: 'Coaching',            emoji: '🏆' },
  { name: 'Teaching',            emoji: '📚' },
  { name: 'Construction',        emoji: '🔨' },
  { name: 'Cooking & Nutrition', emoji: '🍽️' },
  { name: 'Personal Training',   emoji: '💪' },
  { name: 'Data Science',        emoji: '📊' },
  { name: 'Project Management',  emoji: '📋' },
];

export default function SkillsOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  function toggle(name: string) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  }

  function addCustom() {
    const trimmed = custom.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    setSelected(prev => [...prev, trimmed]);
    setCustom('');
  }

  async function saveSkills() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && selected.length > 0) {
      await (supabase as any).from('user_skills').insert(
        selected.map(name => ({
          user_id: user.id,
          skill_name: name,
          rating: 7, // default to skillset — user can adjust in profile
        }))
      );
    }
    router.push('/onboarding/first-goal');
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/6 rounded-full blur-[100px]" />
      </div>

      {/* Progress */}
      <div className="relative z-10 flex justify-center gap-2 pt-10 pb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === 1 ? 'w-8 bg-amber-400' : i < 1 ? 'w-4 bg-amber-400/50' : 'w-4 bg-white/10'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">
        <div className="py-6">
          <p className="text-amber-400 text-xs font-bold tracking-[2px] uppercase mb-2">STEP 2 OF 4 · SKILLS</p>
          <h2 className="text-2xl font-black text-white">What do you bring to the village?</h2>
          <p className="text-white/45 text-sm mt-1">
            Select your skills — both what you're great at and what you need help with. Spirit uses this to match you with the right villagers.
          </p>
        </div>

        {/* Selected skills */}
        <AnimatePresence>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <p className="text-xs text-white/30 mb-2 uppercase tracking-wide font-semibold">Your Skills ({selected.length})</p>
              <div className="flex flex-wrap gap-2">
                {selected.map(s => (
                  <motion.button
                    key={s}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => toggle(s)}
                    className="flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full"
                  >
                    {s} <span className="text-amber-400/60 ml-0.5">×</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill chips grid */}
        <div className="flex flex-wrap gap-2 flex-1 content-start">
          {SKILL_CHIPS.filter(c => !selected.includes(c.name)).map(chip => (
            <motion.button
              key={chip.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(chip.name)}
              className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-white/20 text-white/60 hover:text-white text-xs font-medium px-3 py-2 rounded-full transition-all"
            >
              <span>{chip.emoji}</span> {chip.name}
            </motion.button>
          ))}
        </div>

        {/* Custom skill input */}
        <div className="mt-4 flex gap-2">
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Add a skill not listed…"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30"
          />
          <button
            onClick={addCustom}
            disabled={!custom.trim()}
            className="bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-sm px-4 py-2.5 rounded-full transition-colors"
          >
            Add
          </button>
        </div>

        {/* CTA */}
        <div className="pt-5 space-y-3">
          <button
            onClick={saveSkills}
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-4 rounded-2xl transition-all disabled:opacity-50 text-base"
          >
            {saving ? 'Saving…' : selected.length > 0 ? `Continue with ${selected.length} skills →` : 'Continue →'}
          </button>
          <button
            onClick={() => router.push('/onboarding/first-goal')}
            className="w-full text-white/25 text-sm py-2"
          >
            Skip this step
          </button>
        </div>
      </div>
    </div>
  );
}
