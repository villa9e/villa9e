'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useStoryMode, useCurrentStep, useStoryProgress,
  STORY_GOALS, STORY_STEPS, type GoalId,
} from '@/lib/storyMode/useStoryMode';
import { VillageSound } from '@/lib/sounds/village';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

// ─── Typewriter text effect ───────────────────────────────────────────────────
function TypewriterText({ text, speed = 28, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  function skipToEnd() {
    setDisplayed(text);
    setDone(true);
    idx.current = text.length;
    onDone?.();
  }

  return (
    <div onClick={!done ? skipToEnd : undefined} style={{ cursor: done ? 'default' : 'pointer' }}>
      <span>{displayed}</span>
      {!done && <span className="animate-pulse ml-0.5">▌</span>}
    </div>
  );
}

// ─── XP Float animation ──────────────────────────────────────────────────────
function XPFloat({ xp, vlg }: { xp: number; vlg: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], y: -60 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none flex flex-col items-center gap-1"
    >
      <div className="text-2xl font-black" style={{ color: '#FFD700', textShadow: '0 0 20px #FFD700' }}>
        +{xp} XP
      </div>
      {vlg > 0 && (
        <div className="text-lg font-black" style={{ color: '#60A5FA', textShadow: '0 0 15px #1877F2' }}>
          +{vlg} $VLG
        </div>
      )}
    </motion.div>
  );
}

// ─── Goal Selection Screen ────────────────────────────────────────────────────
function GoalSelectionScreen({ onSelect }: { onSelect: (id: GoalId) => void }) {
  const [hovered, setHovered] = useState<GoalId | null>(null);
  const [textDone, setTextDone] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0A0010 0%, #0D0020 50%, #0A0015 100%)' }}
    >
      {/* Particle dots background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: '#7C3AED',
              opacity: 0.2 + Math.random() * 0.3,
            }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-y-auto">
        {/* Spirit header */}
        <div className="flex items-center gap-3 px-5 pt-8 pb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(24,119,242,0.2)', border: '2px solid #1877F2' }}
          >
            🌀
          </motion.div>
          <div>
            <p className="font-black text-white text-sm">SPIRIT</p>
            <p className="text-xs" style={{ color: '#7C3AED' }}>Your Guide</p>
          </div>
          <div className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid #7C3AED' }}>
            CHOOSE MISSION
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="text-sm leading-relaxed" style={{ color: '#C4B5FD' }}>
            <TypewriterText
              text="Every journey in villa9e starts with intention. Three missions lie before you. Each one will take you through the whole village in about 10 minutes. Which path calls to you?"
              speed={22}
              onDone={() => setTextDone(true)}
            />
          </div>
        </div>

        <AnimatePresence>
          {textDone && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-3 pb-8">
              {(Object.values(STORY_GOALS) as typeof STORY_GOALS[GoalId][]).map((goal, i) => (
                <motion.button
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { VillageSound.tap(); onSelect(goal.id as GoalId); }}
                  onMouseEnter={() => setHovered(goal.id as GoalId)}
                  onMouseLeave={() => setHovered(null)}
                  className="w-full text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: hovered === goal.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${hovered === goal.id ? '#7C3AED' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: hovered === goal.id ? '0 0 30px rgba(124,58,237,0.3)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{goal.emoji}</span>
                    <div className="flex-1">
                      <p className="font-black text-white text-base">{goal.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#A78BFA' }}>{goal.tagline}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
                          +{goal.totalXP} XP
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                          +{goal.totalVLG} $VLG
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                          ~10 min
                        </span>
                      </div>
                    </div>
                    <span className="text-white/30 text-xl">›</span>
                  </div>

                  {/* SMART breakdown on hover */}
                  <AnimatePresence>
                    {hovered === goal.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3"
                        style={{ borderTop: '1px solid rgba(124,58,237,0.3)' }}
                      >
                        {(['S','M','A','R','T'] as const).map((key, j) => (
                          <div key={key} className="flex gap-2 text-xs mb-1">
                            <span className="font-black w-4 flex-shrink-0" style={{ color: '#7C3AED' }}>{key}</span>
                            <span style={{ color: '#C4B5FD' }}>{goal.smart[key]}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Step Panel (FF7 quest panel — bottom of screen) ─────────────────────────
function StepPanel() {
  const router = useRouter();
  const { completeStep, exitStoryMode, selectedGoal, completedSteps } = useStoryMode();
  const currentStep = useCurrentStep();
  const progress    = useStoryProgress();
  const [textDone, setTextDone]   = useState(false);
  const [showXP, setShowXP]       = useState(false);
  const [expanded, setExpanded]   = useState(true);
  const [completing, setCompleting] = useState(false);
  const prevStepId = useRef<string | null>(null);

  useEffect(() => {
    if (currentStep?.id !== prevStepId.current) {
      prevStepId.current = currentStep?.id ?? null;
      setTextDone(false);
      setExpanded(true);
    }
  }, [currentStep?.id]);

  if (!currentStep || currentStep.id === 'graduation') return null;

  const sprintLabel = currentStep.sprint
    ? selectedGoal ? STORY_GOALS[selectedGoal].sprints[currentStep.sprint - 1]?.title : null
    : null;

  async function handleComplete() {
    if (completing || !currentStep) return;
    setCompleting(true);
    VillageSound.stepComplete();
    setShowXP(true);
    setTimeout(() => setShowXP(false), 2000);
    completeStep(currentStep.id, currentStep.xp, currentStep.vlg);

    // Short delay then navigate
    setTimeout(() => {
      setCompleting(false);
      const nextStep = useCurrentStep();
      if (nextStep && nextStep.id !== 'graduation') {
        router.push(nextStep.route);
      }
    }, 1500);
  }

  function handleNavigate() {
    if (currentStep.autoComplete) {
      handleComplete();
    } else {
      router.push(currentStep.route);
    }
  }

  return (
    <>
      {/* XP float */}
      <AnimatePresence>
        {showXP && <XPFloat xp={currentStep.xp} vlg={currentStep.vlg} />}
      </AnimatePresence>

      {/* Main panel */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[100]"
        style={{
          background: 'linear-gradient(180deg, rgba(8,9,20,0.0) 0%, rgba(8,9,20,0.95) 15%)',
          paddingTop: '20px',
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-12 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(8,9,20,0.9)', border: '1px solid rgba(124,58,237,0.4)' }}
        >
          <span className="text-xs" style={{ color: '#7C3AED' }}>{expanded ? '▾' : '▴'}</span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-safe-bottom"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
            >
              <div className="max-w-2xl mx-auto">
                {/* Sprint label */}
                {sprintLabel && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.3)' }} />
                    <span className="text-xs font-bold px-2" style={{ color: '#7C3AED' }}>{sprintLabel}</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(124,58,237,0.3)' }} />
                  </div>
                )}

                {/* Progress dots */}
                {progress && (
                  <div className="flex gap-1.5 justify-center mb-3">
                    {Array.from({ length: progress.total }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 rounded-full"
                        style={{
                          width: i < progress.done ? '20px' : '6px',
                          background: i < progress.done ? '#7C3AED' : 'rgba(255,255,255,0.15)',
                        }}
                        animate={{ width: i < progress.done ? '20px' : '6px' }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                )}

                {/* Step card */}
                <div className="rounded-2xl p-4 mb-3"
                  style={{ background: 'rgba(15,12,35,0.92)', border: '1px solid rgba(124,58,237,0.35)' }}>

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{currentStep.emoji}</span>
                    <div className="flex-1">
                      <p className="font-black text-white text-sm">{currentStep.title}</p>
                    </div>
                    {currentStep.xp > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}>
                        +{currentStep.xp} XP
                      </span>
                    )}
                  </div>

                  {/* Spirit text — typewriter */}
                  <div className="text-sm leading-relaxed mb-3" style={{ color: '#C4B5FD' }}>
                    <TypewriterText text={currentStep.body} speed={24} onDone={() => setTextDone(true)} />
                  </div>

                  {/* Action cue */}
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <span className="text-xs font-black" style={{ color: '#7C3AED' }}>ACTION</span>
                    <span className="text-xs" style={{ color: '#A78BFA' }}>{currentStep.action}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <AnimatePresence>
                    {textDone && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleNavigate}
                        disabled={completing}
                        className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #7C3AED, #1877F2)',
                          boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                        }}
                      >
                        {completing ? '⟳ Completing…' : currentStep.routeLabel}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* "I did it" — manual complete if on the right page */}
                  {textDone && !currentStep.autoComplete && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleComplete}
                      disabled={completing}
                      className="px-4 py-3.5 rounded-2xl font-bold text-sm transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}
                    >
                      ✓ Done
                    </motion.button>
                  )}
                </div>

                {/* Exit story mode */}
                <button onClick={exitStoryMode}
                  className="w-full text-center text-xs mt-2 py-1.5 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Exit Story Mode
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ─── Graduation Screen ────────────────────────────────────────────────────────
function GraduationScreen() {
  const { selectedGoal, totalXPEarned, totalVLGEarned, reset } = useStoryMode();
  const router = useRouter();
  const goal = selectedGoal ? STORY_GOALS[selectedGoal] : null;
  const [done, setDone] = useState(false);

  useEffect(() => { VillageSound.goalAchieved(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(180deg, #0A0010 0%, #0D0020 100%)' }}
    >
      {/* Ring pulses */}
      {[0,1,2].map(i => (
        <motion.div key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: '#7C3AED' }}
          initial={{ width: 80, height: 80, opacity: 0.8 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ duration: 2.5, delay: i * 0.6, repeat: Infinity }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
        className="text-center relative z-10 max-w-sm w-full"
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-7xl mb-6"
        >
          {goal?.emoji ?? '🏆'}
        </motion.div>

        <div className="mb-2 text-xs font-black tracking-[3px]" style={{ color: '#7C3AED' }}>
          MISSION COMPLETE
        </div>
        <h1 className="text-3xl font-black text-white mb-3">{goal?.title}</h1>

        <div className="text-sm leading-relaxed mb-6" style={{ color: '#C4B5FD' }}>
          <TypewriterText
            text="You didn't just set up an app — you planted yourself in a living village. The village sees you. Now go build something real."
            speed={20}
            onDone={() => setDone(true)}
          />
        </div>

        {/* Rewards */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 mb-5"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
              <p className="text-xs font-black mb-2" style={{ color: '#7C3AED' }}>REWARDS EARNED</p>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#FFD700' }}>+{totalXPEarned}</p>
                  <p className="text-xs" style={{ color: '#A78BFA' }}>XP</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#60A5FA' }}>+{totalVLGEarned}</p>
                  <p className="text-xs" style={{ color: '#A78BFA' }}>$VLG</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black" style={{ color: '#4ADE80' }}>5</p>
                  <p className="text-xs" style={{ color: '#A78BFA' }}>Spaces Visited</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { reset(); router.push('/village/map'); }}
              className="w-full py-4 rounded-2xl font-black text-white text-base"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #1877F2)',
                boxShadow: '0 0 40px rgba(124,58,237,0.5)',
              }}
            >
              Enter the Village →
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Intro Screen (FF7 cinematic opening) ─────────────────────────────────────
function IntroScreen({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<'black'|'text'|'ready'>('black');
  const [line, setLine]   = useState(0);

  const LINES = [
    { text: 'The world moves fast.', delay: 500 },
    { text: 'Most people drift through it.', delay: 2200 },
    { text: 'A few decide to build.', delay: 4000 },
    { text: 'The village was made for those few.', delay: 5800 },
    { text: 'Welcome.', delay: 7600 },
  ];

  useEffect(() => {
    const t = setTimeout(() => setPhase('text'), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'text') return;
    const timers = LINES.map((l, i) =>
      setTimeout(() => setLine(i), l.delay)
    );
    const ready = setTimeout(() => setPhase('ready'), 9500);
    return () => { timers.forEach(clearTimeout); clearTimeout(ready); };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#000000' }}
      onClick={() => { if (phase === 'ready') onContinue(); }}
    >
      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)', backgroundSize: '100% 3px' }} />

      <div className="text-center px-8 max-w-sm">
        {LINES.map((l, i) => (
          <AnimatePresence key={i}>
            {line >= i && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: i === line ? 1 : 0.3, y: 0 }}
                className="text-lg font-medium mb-3"
                style={{ color: i === line ? '#FFFFFF' : '#555555', fontFamily: 'monospace' }}
              >
                {l.text}
              </motion.p>
            )}
          </AnimatePresence>
        ))}

        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs tracking-[4px] font-bold"
                style={{ color: '#7C3AED' }}
              >
                TAP TO BEGIN
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spirit orb in corner */}
      <div className="absolute bottom-8 right-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)' }}
        >
          🌀
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Story Mode Overlay (mounts on all pages) ────────────────────────────
export function StoryModeOverlay() {
  const { active, selectedGoal, currentStepIndex, selectGoal, startStoryMode } = useStoryMode();
  const currentStep = useCurrentStep();
  const [showIntro, setShowIntro] = useState(false);

  // Check if we should show the graduation screen
  const isGraduation = active && selectedGoal &&
    currentStepIndex >= (STORY_GOALS[selectedGoal]?.steps.length ?? 0);

  if (!active) return null;

  // Intro phase
  if (showIntro) {
    return <IntroScreen onContinue={() => setShowIntro(false)} />;
  }

  // Goal selection phase
  if (!selectedGoal) {
    return (
      <GoalSelectionScreen
        onSelect={goal => selectGoal(goal)}
      />
    );
  }

  // Graduation
  if (currentStep?.id === 'graduation') {
    return <GraduationScreen />;
  }

  // Active step panel
  return <StepPanel />;
}

// ─── Story Mode Trigger Button (shows on map) ─────────────────────────────────
export function StoryModeTrigger() {
  const { active, startStoryMode, selectGoal } = useStoryMode();
  const [showBadge, setShowBadge] = useState(true);

  if (active) return null;

  return (
    <AnimatePresence>
      {showBadge && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            VillageSound.tap();
            startStoryMode();
          }}
          className="flex items-center gap-2 rounded-full px-4 py-2.5 font-black text-white text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #1877F2)',
            boxShadow: '0 0 30px rgba(124,58,237,0.5)',
          }}
        >
          <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            🎮
          </motion.span>
          Story Mode
          <span className="text-xs opacity-80">NEW</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
