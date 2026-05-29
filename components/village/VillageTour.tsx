'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface TourStep {
  title:       string;
  body:        string;
  emoji:       string;
  highlight?:  string;   // building name to highlight
  arrowDir?:   'north' | 'south' | 'east' | 'west' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    title:    'Welcome to Villa9e',
    body:     'This is your living goal map — a 3D village where every building is a space to grow. Walk around and explore.',
    emoji:    '🌍',
    arrowDir: 'center',
  },
  {
    title:    'Your Hut',
    body:     'The Hut is your personal space. Customize your avatar, track your goals, and invite tribe members inside.',
    emoji:    '🏠',
    highlight:'My Hut',
    arrowDir: 'south',
  },
  {
    title:    'The Workshop',
    body:     'Where goals are born. Use AI to break goals into sprints, track skills, and build daily habits.',
    emoji:    '🔨',
    highlight:'Workshop',
    arrowDir: 'west',
  },
  {
    title:    'Dream Line',
    body:     'Your goal GPS. Visualize long-term dreams on an interactive timeline. Every dream starts here.',
    emoji:    '✨',
    highlight:'Dream Line',
    arrowDir: 'east',
  },
  {
    title:    'Tribes',
    body:     'Find your people. Join tribes, start collaborative goals, and build together around a sacred fire.',
    emoji:    '🔥',
    highlight:'Tribes',
    arrowDir: 'east',
  },
  {
    title:    'Trading Post',
    body:     'The marketplace. Exchange skills, services, and agreements with tribe members using VLG tokens.',
    emoji:    '🏪',
    highlight:'Trading Post',
    arrowDir: 'south',
  },
  {
    title:    'Zen Garden',
    body:     'High on the mountain — your sanctuary. Breathwork, journaling, music, and daily affirmations.',
    emoji:    '🧘',
    highlight:'Zen Garden',
    arrowDir: 'west',
  },
  {
    title:    'Wellness Center',
    body:     'Telehealth on the coast. Schedule providers, track health goals, and book virtual appointments.',
    emoji:    '💙',
    highlight:'Wellness Center',
    arrowDir: 'north',
  },
  {
    title:    'The Pavilion',
    body:     'Watch films, attend virtual concerts, and join webinars. Host your own events and sell tickets in VLG.',
    emoji:    '🎭',
    highlight:'Pavilion',
    arrowDir: 'east',
  },
  {
    title:    "You're Ready",
    body:     'Walk up to any building and enter. Click on tribe members to message or call them. Earn VLG by completing goals.',
    emoji:    '⬡',
    arrowDir: 'center',
  },
];

const DIRECTION_ARROWS: Record<string, string> = {
  north:  '↑ North',
  south:  '↓ South',
  east:   '→ East',
  west:   '← West',
  center: '',
};

interface VillageTourProps {
  onComplete: () => void;
}

export function VillageTour({ onComplete }: VillageTourProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const current = TOUR_STEPS[step];
  const isLast  = step === TOUR_STEPS.length - 1;

  function next() {
    if (isLast) {
      complete();
    } else {
      setStep(s => s + 1);
    }
  }

  function complete() {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').update({ has_done_tour: true }).eq('id', user.id);
      }
    });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/30" style={{ pointerEvents: 'auto' }} />

      {/* Tour card — bottom center */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute bottom-24 left-1/2"
          style={{ transform: 'translateX(-50%)', width: 'min(480px, 92vw)', pointerEvents: 'auto' }}
        >
          <div className="relative bg-[#0D1A0F] border border-[#2A5C14]/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-[#1A3A1A]">
              <motion.div
                className="h-full bg-[#4ADE80]"
                initial={{ width: `${(step / TOUR_STEPS.length) * 100}%` }}
                animate={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="p-5">
              {/* Step header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl leading-none mt-0.5">{current.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {current.highlight && (
                      <span className="text-[10px] bg-[#16532A] text-[#4ADE80] px-2 py-0.5 rounded font-bold tracking-wide">
                        {current.arrowDir && DIRECTION_ARROWS[current.arrowDir]}
                        {current.arrowDir && DIRECTION_ARROWS[current.arrowDir] ? ' · ' : ''}
                        {current.highlight}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[#C8E8C8] font-bold text-base">{current.title}</h3>
                </div>
                {/* Step counter */}
                <span className="text-[#4A7A4A] text-xs shrink-0 mt-1">
                  {step + 1} / {TOUR_STEPS.length}
                </span>
              </div>

              <p className="text-[#8AAA8A] text-sm leading-relaxed mb-4">
                {current.body}
              </p>

              {/* Action row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={complete}
                  className="text-[#4A7A4A] text-xs hover:text-[#C8E8C8] transition-colors"
                >
                  Skip tour
                </button>
                <div className="flex-1" />
                {/* Dot indicators */}
                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === step ? 'bg-[#4ADE80]' :
                      i < step  ? 'bg-[#2A5C14]' :
                      'bg-[#1A3A1A]'
                    }`} />
                  ))}
                </div>
                <button
                  onClick={next}
                  className="px-5 py-2 bg-[#16532A] hover:bg-[#1A6A35] text-[#4ADE80] text-sm font-bold rounded-xl transition-colors"
                >
                  {isLast ? "Let's go! ⬡" : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
