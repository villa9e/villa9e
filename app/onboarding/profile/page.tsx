'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const OCCUPATIONS = ['Student','Entrepreneur','Artist/Creative','Musician','Developer/Engineer','Designer','Healthcare Professional','Educator','Nonprofit/NGO','Finance/Business','Trades/Construction','Coach/Consultant','Government','Athlete','Other'];
const EDUCATION   = ['High School','Some College','Associate\'s','Bachelor\'s','Master\'s','Doctorate','Trade/Vocational','Self-taught'];
const COMM_STYLES = ['Encouraging & warm','Direct & concise','Analytical & detailed','Storytelling & metaphors','Gentle & patient'];

export default function ProfileOnboarding() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    display_name: '',
    date_of_birth: '',
    location_city: '',
    location_country: 'United States',
    occupation: '',
    education_level: '',
    communication_style: '',
    gender: '',
  });
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      label: 'Your Name',
      field: 'display_name',
      question: 'What should the village call you?',
      hint: 'This is your display name — you can change it later.',
      type: 'text',
      placeholder: 'Your name or preferred nickname',
    },
    {
      label: 'Date of Birth',
      field: 'date_of_birth',
      question: 'When were you born?',
      hint: 'Used to personalize your Spirit experience. Private.',
      type: 'date',
      placeholder: '',
    },
    {
      label: 'Location',
      field: 'location_city',
      question: 'Where are you based?',
      hint: 'Helps Spirit find local opportunities and villagers near you.',
      type: 'text',
      placeholder: 'City, State (e.g. Sacramento, CA)',
    },
    {
      label: 'Occupation',
      field: 'occupation',
      question: 'What do you do?',
      hint: 'Shapes how Spirit speaks to you and who it matches you with.',
      type: 'select',
      options: OCCUPATIONS,
    },
    {
      label: 'Education',
      field: 'education_level',
      question: 'Highest education level?',
      hint: 'Helps Spirit tailor goal recommendations.',
      type: 'select',
      options: EDUCATION,
    },
    {
      label: 'Communication Style',
      field: 'communication_style',
      question: 'How would you like Spirit to speak to you?',
      hint: 'You can change this anytime in settings.',
      type: 'select',
      options: COMM_STYLES,
    },
  ];

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  async function next() {
    if (isLast) {
      await save();
    } else {
      setStep(s => s + 1);
    }
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        display_name:        form.display_name || null,
        date_of_birth:       form.date_of_birth || null,
        location_city:       form.location_city || null,
        occupation:          form.occupation || null,
        education_level:     form.education_level || null,
        communication_style: form.communication_style || null,
        onboarding_complete: true,
        onboarding_step:     99,
        is_minor:            form.date_of_birth ? (new Date().getFullYear() - new Date(form.date_of_birth).getFullYear() < 18) : false,
      }).eq('id', user.id);

      // Pass referrer from localStorage (set by /join/[username] page)
      const referrer = typeof window !== 'undefined' ? localStorage.getItem('villa9e_referrer') : null;
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrer }),
      });
      if (referrer) localStorage.removeItem('villa9e_referrer');
    }
    router.push('/village/map');
  }

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen village-gradient flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Progress */}
        <div className="w-full max-w-md mb-6">
          <div className="flex justify-between text-white text-xs mb-2">
            <span>Profile Setup</span>
            <span>{step + 1} / {steps.length}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <motion.div className="h-1.5 bg-white rounded-full" animate={{ width: `${progress}%` }} />
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6"
        >
          <div>
            <p className="text-xs text-village-blue font-medium uppercase tracking-wide mb-1">{current.label}</p>
            <h2 className="text-2xl font-bold text-gray-900">{current.question}</h2>
            <p className="text-sm text-gray-500 mt-1">{current.hint}</p>
          </div>

          {current.type === 'select' ? (
            <div className="grid grid-cols-2 gap-2">
              {current.options!.map(opt => (
                <button
                  key={opt}
                  onClick={() => setForm(f => ({ ...f, [current.field]: opt }))}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                    form[current.field as keyof typeof form] === opt
                      ? 'border-village-blue bg-blue-50 text-village-blue'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type={current.type}
              value={form[current.field as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [current.field]: e.target.value }))}
              placeholder={current.placeholder}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-village-blue transition-colors"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && next()}
            />
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 border border-gray-200 rounded-2xl py-3 font-medium text-gray-500 hover:bg-gray-50">
                ← Back
              </button>
            )}
            <button
              onClick={next}
              disabled={saving}
              className="flex-1 village-btn-primary py-3 text-base disabled:opacity-50"
            >
              {saving ? 'Setting up your village…' : isLast ? '🏡 Enter the Village →' : 'Continue →'}
            </button>
          </div>

          <button onClick={isLast ? save : next} className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
            Skip {isLast ? 'and enter' : 'this step'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
