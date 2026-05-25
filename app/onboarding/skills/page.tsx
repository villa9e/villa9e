'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const SUGGESTED_SKILLS = [
  'Graphic Design', 'Video Editing', 'Photography', 'Music Production', 'Writing & Copywriting',
  'Software Development', 'Web Development', 'Data Science', 'UI/UX Design', 'Marketing & Growth',
  'Project Management', 'Sales', 'Financial Planning', 'Business Strategy', 'Public Speaking',
  'Construction', 'Cooking & Nutrition', 'Personal Training', 'Life Coaching', 'Teaching',
];

function getRatingLabel(r: number) {
  if (r <= 3) return { label: 'Pain Point', color: 'text-red-500', bg: 'bg-red-50' };
  if (r <= 6) return { label: 'Neutral', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { label: 'Skillset', color: 'text-green-600', bg: 'bg-green-50' };
}

export default function SkillsOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [skills, setSkills] = useState<{ name: string; rating: number }[]>([{ name: '', rating: 7 }]);
  const [saving, setSaving] = useState(false);

  function addSkill() { setSkills(prev => [...prev, { name: '', rating: 7 }]); }
  function updateSkill(i: number, key: string, value: any) {
    setSkills(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  }

  async function saveSkills() {
    const valid = skills.filter(s => s.name.trim());
    if (!valid.length) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_skills').insert(valid.map(s => ({
        user_id: user.id,
        skill_name: s.name,
        rating: s.rating,
      })));
    }
    router.push('/village/map');
  }

  return (
    <div className="min-h-screen bg-village-bg">
      <div className="village-gradient text-white px-6 py-8 text-center">
        <span className="text-4xl">🔨</span>
        <h1 className="text-2xl font-bold mt-2">Your Skills</h1>
        <p className="text-blue-100 text-sm mt-1">Rate yourself honestly — Spirit will use this to find you the right villagers.</p>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-4">
        <div className="bg-village-blue/5 border border-village-blue/20 rounded-2xl p-4 text-sm text-gray-600">
          <strong>Skill ratings:</strong> 1–3 = Pain Point (need help) · 4–6 = Neutral · 7–9 = Skillset (can help others)
        </div>

        {skills.map((skill, i) => {
          const meta = getRatingLabel(skill.rating);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="village-card space-y-3">
              {/* Skill name */}
              <input
                list={`skills-${i}`}
                value={skill.name}
                onChange={e => updateSkill(i, 'name', e.target.value)}
                placeholder="Skill name (e.g. Graphic Design)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-village-blue text-sm"
              />
              <datalist id={`skills-${i}`}>
                {SUGGESTED_SKILLS.map(s => <option key={s} value={s} />)}
              </datalist>

              {/* Rating slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  <span className="text-lg font-bold text-gray-700">{skill.rating}/9</span>
                </div>
                <input
                  type="range" min={1} max={9}
                  value={skill.rating}
                  onChange={e => updateSkill(i, 'rating', parseInt(e.target.value))}
                  className="w-full accent-village-blue"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Pain Point</span><span>Neutral</span><span>Skillset</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        <button onClick={addSkill} className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm text-gray-500 hover:border-village-blue hover:text-village-blue transition-colors">
          + Add another skill
        </button>

        <button onClick={saveSkills} disabled={saving || !skills.some(s => s.name.trim())} className="village-btn-primary w-full disabled:opacity-50">
          {saving ? 'Saving skills…' : '🚀 Enter the Village →'}
        </button>
      </div>
    </div>
  );
}
