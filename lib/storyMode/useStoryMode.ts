'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Story Mode Quest Definitions ─────────────────────────────────────────────

export type StepId =
  // Shared
  | 'intro' | 'choose_goal' | 'graduation'
  // Goal 1 — Plant Your Seed
  | 'g1_zen_checkin' | 'g1_dreamline_post' | 'g1_oowop' | 'g1_discover' | 'g1_trading_post'
  // Goal 2 — Set Your GPS
  | 'g2_workshop_goal' | 'g2_read_steps' | 'g2_dreamline_share' | 'g2_zen_checkin' | 'g2_bank_visit'
  // Goal 3 — Build Your Tribe
  | 'g3_create_tribe' | 'g3_tribe_task' | 'g3_dreamline_tribe' | 'g3_discover_recruit' | 'g3_spirit_checkin';

export interface StoryStep {
  id:          StepId;
  title:       string;
  body:        string;           // Spirit's narration
  emoji:       string;
  route:       string;           // where to navigate
  routeLabel:  string;          // button label
  sprint:      1 | 2 | null;   // which sprint this belongs to
  action:      string;          // what the user needs to DO on that page
  xp:          number;          // XP reward on completion
  vlg:         number;          // $VLG reward
  autoComplete?: boolean;       // completes automatically when navigated to (just visiting)
}

export type GoalId = 'seed' | 'gps' | 'tribe';

export interface StoryGoal {
  id:          GoalId;
  emoji:       string;
  title:       string;
  tagline:     string;
  description: string;
  sprints:     { title: string; milestone: string }[];
  steps:       StepId[];
  totalXP:     number;
  totalVLG:    number;
  smart:       { S: string; M: string; A: string; R: string; T: string };
}

export const STORY_GOALS: Record<GoalId, StoryGoal> = {
  seed: {
    id:       'seed',
    emoji:    '🌱',
    title:    'Plant Your Seed',
    tagline:  'Establish your presence in the village.',
    description: 'In the next 10 minutes, you\'ll introduce yourself to the village — check in with your spirit, share your first update, validate a fellow villager, find your people, and offer what you bring.',
    sprints:  [
      { title: 'Sprint 1 — Arrive',  milestone: 'You\'ve shown up fully. The village sees you.' },
      { title: 'Sprint 2 — Connect', milestone: 'You\'ve made your mark and offered your gift.' },
    ],
    steps:   ['g1_zen_checkin', 'g1_dreamline_post', 'g1_oowop', 'g1_discover', 'g1_trading_post'],
    totalXP:  150,
    totalVLG: 65,
    smart: {
      S: 'Show up in the village across 5 key spaces in one session',
      M: '5 actions completed — each one visible and logged',
      A: 'Every action takes 1–2 minutes, no prior experience needed',
      R: 'Presence is the foundation of everything in villa9e',
      T: 'Complete within this session (about 10 minutes)',
    },
  },
  gps: {
    id:       'gps',
    emoji:    '🗺️',
    title:    'Set Your GPS',
    tagline:  'Activate your first real goal with an AI plan.',
    description: 'In the next 10 minutes, Spirit will build your first GPS plan — real steps, a probability score, and a timeline. You\'ll share it, center yourself, and know exactly what to do next.',
    sprints:  [
      { title: 'Sprint 1 — Plan',   milestone: 'Your GPS is live. Spirit has your back.' },
      { title: 'Sprint 2 — Launch', milestone: 'You\'re grounded, funded, and ready to move.' },
    ],
    steps:   ['g2_workshop_goal', 'g2_read_steps', 'g2_dreamline_share', 'g2_zen_checkin', 'g2_bank_visit'],
    totalXP:  180,
    totalVLG: 80,
    smart: {
      S: 'Set one specific goal in Workshop, get a full GPS plan from Spirit',
      M: 'Probability score generated, 3+ steps created, goal saved',
      A: 'Spirit builds the plan — you just tell it what you want',
      R: 'This is exactly why villa9e exists',
      T: 'GPS plan created within 10 minutes',
    },
  },
  tribe: {
    id:       'tribe',
    emoji:    '👥',
    title:    'Build Your Tribe',
    tagline:  'Create a crew. No one achieves alone.',
    description: 'In the next 10 minutes, you\'ll create a tribe around a shared purpose, set your first collective task, announce it to the Dream Line, recruit potential members, and check in with Spirit about your tribe\'s direction.',
    sprints:  [
      { title: 'Sprint 1 — Form',  milestone: 'Your tribe exists. It has a name, a task, and a voice.' },
      { title: 'Sprint 2 — Grow',  milestone: 'You\'ve recruited and Spirit has blessed the direction.' },
    ],
    steps:   ['g3_create_tribe', 'g3_tribe_task', 'g3_dreamline_tribe', 'g3_discover_recruit', 'g3_spirit_checkin'],
    totalXP:  160,
    totalVLG: 70,
    smart: {
      S: 'Create 1 tribe, add 1 task, recruit 1 member, announce to the village',
      M: 'Tribe created with name + task, 1 Dream Line post, 1 connection made',
      A: 'Takes 4 taps and a tribe name — Spirit guides the rest',
      R: 'Community is the core of villa9e\'s mission',
      T: 'Tribe formed and active within 10 minutes',
    },
  },
};

// Step definitions — what Spirit says at each moment
export const STORY_STEPS: Record<StepId, StoryStep> = {
  intro: {
    id: 'intro', title: 'Welcome to villa9e', sprint: null,
    emoji: '🌀',
    body: 'I\'m Spirit — your guide through this village. I\'m about to show you everything this place can do for you. It takes about 10 minutes. Ready to begin?',
    route: '/village/map', routeLabel: 'Enter the Village →',
    action: 'Tap to begin', xp: 0, vlg: 0, autoComplete: true,
  },
  choose_goal: {
    id: 'choose_goal', title: 'Choose Your Mission', sprint: null,
    emoji: '🎯',
    body: 'Every journey in villa9e starts with intention. Pick the mission that calls to you — you can pursue all three eventually, but start with one.',
    route: '/village/map', routeLabel: 'Choose a Mission',
    action: 'Select your goal below', xp: 0, vlg: 0, autoComplete: false,
  },
  // ── Goal 1: Plant Your Seed ──────────────────────────────────────
  g1_zen_checkin: {
    id: 'g1_zen_checkin', title: 'Check In With Yourself', sprint: 1,
    emoji: '🧘',
    body: 'Before you do anything in the village, check in. How are you feeling right now? Spirit needs to know so it can walk beside you, not ahead of you.',
    route: '/village/zen', routeLabel: 'Go to Zen Space',
    action: 'Complete the morning or evening check-in with Spirit',
    xp: 20, vlg: 10,
  },
  g1_dreamline_post: {
    id: 'g1_dreamline_post', title: 'Share Your First Update', sprint: 1,
    emoji: '✨',
    body: 'The Dream Line is the village square. Share one thing — a win, a thought, an intention. Don\'t overthink it. The village is listening.',
    route: '/village/dreamline', routeLabel: 'Go to Dream Line',
    action: 'Write and post something to the Dream Line',
    xp: 20, vlg: 10,
  },
  g1_oowop: {
    id: 'g1_oowop', title: 'Give Your First OoWop', sprint: 1,
    emoji: '✊',
    body: 'An OoWop is how this village validates each other. Find someone\'s post on the Dream Line that resonates with you. Give them your fist. It matters.',
    route: '/village/dreamline', routeLabel: 'Back to Dream Line',
    action: 'Tap OoWop on any post in the Dream Line',
    xp: 15, vlg: 5,
  },
  g1_discover: {
    id: 'g1_discover', title: 'Find Your People', sprint: 2,
    emoji: '🔍',
    body: 'You don\'t build alone in this village. Discover is where you find villagers who share your goals, your skills, and your energy. Connect with at least one.',
    route: '/village/discover', routeLabel: 'Go to Discover',
    action: 'Follow or connect with at least 1 villager',
    xp: 25, vlg: 15,
  },
  g1_trading_post: {
    id: 'g1_trading_post', title: 'Offer Your Gift', sprint: 2,
    emoji: '🏪',
    body: 'Every person in this village has something to offer. What skill do you bring? List it at the Trading Post — even just one thing. That\'s how the economy of this village works.',
    route: '/village/trading-post', routeLabel: 'Go to Trading Post',
    action: 'List at least one skill you offer',
    xp: 30, vlg: 25,
  },
  // ── Goal 2: Set Your GPS ─────────────────────────────────────────
  g2_workshop_goal: {
    id: 'g2_workshop_goal', title: 'Tell Spirit Your Goal', sprint: 1,
    emoji: '📡',
    body: 'The Workshop is where goals become GPS plans. Tell me what you want to achieve — be specific. I\'ll calculate your probability, build your steps, and estimate the timeline.',
    route: '/village/workshop', routeLabel: 'Go to Workshop',
    action: 'Set a goal and get your GPS plan from Spirit',
    xp: 40, vlg: 20,
  },
  g2_read_steps: {
    id: 'g2_read_steps', title: 'Read Your GPS Steps', sprint: 1,
    emoji: '📍',
    body: 'Your GPS is live. Read through every step Spirit gave you. These aren\'t suggestions — they\'re a calculated path. Sit with them for 60 seconds before you move on.',
    route: '/village/workshop', routeLabel: 'View Your GPS Plan',
    action: 'Save the goal and open the goal detail page',
    xp: 20, vlg: 10, autoComplete: true,
  },
  g2_dreamline_share: {
    id: 'g2_dreamline_share', title: 'Announce Your Goal', sprint: 1,
    emoji: '✨',
    body: 'Announcing a goal makes it real. Share it with the Dream Line. Tell the village what you\'re pursuing. They\'ll OoWop you into motion.',
    route: '/village/dreamline', routeLabel: 'Go to Dream Line',
    action: 'Post about your new goal to the Dream Line',
    xp: 20, vlg: 10,
  },
  g2_zen_checkin: {
    id: 'g2_zen_checkin', title: 'Ground Yourself', sprint: 2,
    emoji: '🌿',
    body: 'Before you run, breathe. The Zen Space is where you recalibrate. Go let Spirit speak to you about this goal. It knows something about your energy right now.',
    route: '/village/zen', routeLabel: 'Go to Zen Space',
    action: 'Complete a Spirit check-in in Zen',
    xp: 20, vlg: 10,
  },
  g2_bank_visit: {
    id: 'g2_bank_visit', title: 'Know Your Resources', sprint: 2,
    emoji: '🏦',
    body: 'Every goal has a cost. Visit the Bank and look at your wallet, your tier, and what financing options you have. You might be able to fund your GPS steps.',
    route: '/village/bank', routeLabel: 'Go to Bank',
    action: 'Check your VLG balance and review financing options',
    xp: 20, vlg: 15, autoComplete: true,
  },
  // ── Goal 3: Build Your Tribe ─────────────────────────────────────
  g3_create_tribe: {
    id: 'g3_create_tribe', title: 'Name Your Tribe', sprint: 1,
    emoji: '🔥',
    body: 'Every movement starts with a name. Go to Tribes and create your crew. Give it a name that means something. What are you building together?',
    route: '/village/tribes', routeLabel: 'Go to Tribes',
    action: 'Create a new tribe with a name and description',
    xp: 35, vlg: 20,
  },
  g3_tribe_task: {
    id: 'g3_tribe_task', title: 'Set the First Mission', sprint: 1,
    emoji: '✅',
    body: 'A tribe without a task is just a group chat. Go into your tribe and add the first task — what is the ONE thing your tribe needs to do this week?',
    route: '/village/tribes', routeLabel: 'Open Your Tribe',
    action: 'Add 1 task inside your new tribe',
    xp: 20, vlg: 10,
  },
  g3_dreamline_tribe: {
    id: 'g3_dreamline_tribe', title: 'Announce the Tribe', sprint: 1,
    emoji: '📣',
    body: 'The village needs to know your tribe exists. Go to the Dream Line and announce it. Tell people what you\'re building and why they should join.',
    route: '/village/dreamline', routeLabel: 'Go to Dream Line',
    action: 'Post about your tribe to the Dream Line',
    xp: 20, vlg: 10,
  },
  g3_discover_recruit: {
    id: 'g3_discover_recruit', title: 'Recruit Your First Member', sprint: 2,
    emoji: '🤝',
    body: 'A tribe of one is still just you. Go to Discover, find someone whose skills or goals align with your tribe\'s mission. Connect with them — the village starts here.',
    route: '/village/discover', routeLabel: 'Go to Discover',
    action: 'Connect with 1 villager in Discover',
    xp: 25, vlg: 15,
  },
  g3_spirit_checkin: {
    id: 'g3_spirit_checkin', title: 'Talk to Spirit About the Tribe', sprint: 2,
    emoji: '🌀',
    body: 'Before you go, I want to hear from you. Come to Spirit and tell me about your tribe\'s purpose. I\'ll help you see the ripple effect — who benefits, what you\'re really building.',
    route: '/village/spirit', routeLabel: 'Talk to Spirit',
    action: 'Ask Spirit about your tribe\'s purpose and impact',
    xp: 25, vlg: 15,
  },
  graduation: {
    id: 'graduation', title: 'Mission Complete', sprint: null,
    emoji: '🏆',
    body: 'You did it. You didn\'t just set up an app — you planted yourself in a village, made moves, and proved that your becoming is real. The village sees you.',
    route: '/village/map', routeLabel: 'Enter the Village',
    action: 'Celebrate', xp: 50, vlg: 0, autoComplete: true,
  },
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface StoryModeState {
  active:           boolean;
  selectedGoal:     GoalId | null;
  currentStepIndex: number;
  completedSteps:   StepId[];
  totalXPEarned:    number;
  totalVLGEarned:   number;
  startedAt:        string | null;
  // Actions
  startStoryMode:   () => void;
  selectGoal:       (goal: GoalId) => void;
  completeStep:     (stepId: StepId, xp?: number, vlg?: number) => void;
  exitStoryMode:    () => void;
  reset:            () => void;
}

export const useStoryMode = create<StoryModeState>()(
  persist(
    (set, get) => ({
      active:           false,
      selectedGoal:     null,
      currentStepIndex: 0,
      completedSteps:   [],
      totalXPEarned:    0,
      totalVLGEarned:   0,
      startedAt:        null,

      startStoryMode: () => set({ active: true, currentStepIndex: 0, startedAt: new Date().toISOString() }),

      selectGoal: (goal) => {
        const goalDef = STORY_GOALS[goal];
        set({ selectedGoal: goal, currentStepIndex: 0, completedSteps: [], totalXPEarned: 0, totalVLGEarned: 0 });
      },

      completeStep: (stepId, xp = 0, vlg = 0) => {
        const { completedSteps, selectedGoal, currentStepIndex } = get();
        if (completedSteps.includes(stepId)) return;

        const goalDef = selectedGoal ? STORY_GOALS[selectedGoal] : null;
        const steps = goalDef?.steps ?? [];
        const nextIndex = Math.min(currentStepIndex + 1, steps.length);

        set(s => ({
          completedSteps:  [...s.completedSteps, stepId],
          currentStepIndex: nextIndex,
          totalXPEarned:   s.totalXPEarned + xp,
          totalVLGEarned:  s.totalVLGEarned + vlg,
        }));
      },

      exitStoryMode: () => set({ active: false }),

      reset: () => set({
        active: false, selectedGoal: null, currentStepIndex: 0,
        completedSteps: [], totalXPEarned: 0, totalVLGEarned: 0, startedAt: null,
      }),
    }),
    { name: 'villa9e-story-mode' }
  )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function useCurrentStep(): StoryStep | null {
  const { active, selectedGoal, currentStepIndex, completedSteps } = useStoryMode();
  if (!active) return null;
  if (!selectedGoal) return STORY_STEPS['choose_goal'];
  const goal = STORY_GOALS[selectedGoal];
  if (currentStepIndex >= goal.steps.length) return STORY_STEPS['graduation'];
  return STORY_STEPS[goal.steps[currentStepIndex]];
}

export function useStoryProgress() {
  const { selectedGoal, currentStepIndex, completedSteps, totalXPEarned, totalVLGEarned } = useStoryMode();
  if (!selectedGoal) return null;
  const goal = STORY_GOALS[selectedGoal];
  const total = goal.steps.length;
  const done  = completedSteps.filter(s => goal.steps.includes(s)).length;
  const pct   = Math.round((done / total) * 100);
  return { goal, done, total, pct, totalXPEarned, totalVLGEarned };
}
