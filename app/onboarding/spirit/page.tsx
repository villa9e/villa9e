'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const TOPICS = [
  { id: 'wellness', emoji: '🌿', label: 'Wellness' },
  { id: 'business', emoji: '💼', label: 'Business' },
  { id: 'creativity', emoji: '🎨', label: 'Creativity' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Family' },
  { id: 'finance', emoji: '💰', label: 'Finance' },
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'spirituality', emoji: '✨', label: 'Spirituality' },
  { id: 'education', emoji: '📚', label: 'Education' },
  { id: 'relationships', emoji: '❤️', label: 'Relationships' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
  { id: 'career', emoji: '🚀', label: 'Career' },
  { id: 'community', emoji: '🤝', label: 'Community' },
];

const SPIRITUAL_SYSTEMS = [
  'Christianity', 'Islam', 'Buddhism', 'Hinduism', 'Judaism', 'Stoicism', 'Secular', 'Spiritual (non-religious)', 'Other',
];

export default function SpiritOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [spiritualSystem, setSpiritualSystem] = useState('Secular');
  const [saving, setSaving] = useState(false);

  function toggleTopic(id: string) {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function saveSpirit() {
    if (selectedTopics.length === 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('spirit_configs').upsert({
        user_id: user.id,
        topics: selectedTopics,
        spiritual_system: spiritualSystem,
      });
    }
    router.push('/onboarding/skills');
  }

  return (
    <div className="min-h-screen village-gradient flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Tent animation */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="mb-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-float">
            <span className="text-5xl">⛺</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to villa9e!</h1>
          <p className="text-blue-100">Let's configure your Spirit — your personal AI life coach.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-6">
          {/* Topics */}
          <div>
            <h2 className="font-bold text-gray-800 mb-1">What do you care about?</h2>
            <p className="text-sm text-gray-500 mb-3">Select all that apply — this shapes how Spirit speaks to you.</p>
            <div className="grid grid-cols-3 gap-2">
              {TOPICS.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-sm ${
                    selectedTopics.includes(topic.id)
                      ? 'border-village-blue bg-blue-50 text-village-blue'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl">{topic.emoji}</span>
                  <span className="font-medium">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spiritual system */}
          <div>
            <h2 className="font-bold text-gray-800 mb-1">Your spiritual system</h2>
            <p className="text-sm text-gray-500 mb-3">Spirit will speak in alignment with your values.</p>
            <div className="grid grid-cols-3 gap-2">
              {SPIRITUAL_SYSTEMS.map(sys => (
                <button
                  key={sys}
                  onClick={() => setSpiritualSystem(sys)}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all ${
                    spiritualSystem === sys
                      ? 'border-village-blue bg-blue-50 text-village-blue'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveSpirit}
            disabled={selectedTopics.length === 0 || saving}
            className="village-btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Configuring Spirit…' : 'Configure My Spirit →'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
