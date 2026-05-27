'use client';
/**
 * PostHog custom event tracking — village9e funnel analytics.
 * Import and call these from client components.
 */

declare const window: Window & { posthog?: any };

function track(event: string, props?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.posthog) return;
  window.posthog.capture(event, props ?? {});
}

export const Analytics = {
  // ── Onboarding funnel ────────────────────────────────────────────────────
  onboardingStart:         () => track('onboarding_start'),
  onboardingStepComplete:  (step: string) => track('onboarding_step_complete', { step }),
  onboardingDropOff:       (step: string) => track('onboarding_drop_off', { step }),
  onboardingComplete:      (archetype?: string) => track('onboarding_complete', { archetype }),

  // ── Goals ────────────────────────────────────────────────────────────────
  goalCreated:    (category?: string) => track('goal_created', { category }),
  goalAnalyzed:   (score?: number)    => track('goal_analyzed', { probability_score: score }),
  goalSaved:      (isFirst?: boolean) => track('goal_saved', { is_first_goal: isFirst }),
  goalStepDone:   (goalId: string)    => track('goal_step_completed', { goal_id: goalId }),
  goalCompleted:  (medal?: string)    => track('goal_completed', { medal }),
  goalShared:     (platform: string)  => track('goal_shared', { platform }),

  // ── Spirit ───────────────────────────────────────────────────────────────
  spiritMessage:  () => track('spirit_message_sent'),
  spiritCheckin:  (mood: string, streak: number) => track('spirit_checkin', { mood, streak }),
  spiritVoiceOn:  (gender: string) => track('spirit_voice_enabled', { gender }),

  // ── OoWops ───────────────────────────────────────────────────────────────
  oowopGiven:     (fromPage: string) => track('oowop_given', { from_page: fromPage }),
  oowopReceived:  () => track('oowop_received'),

  // ── Social ───────────────────────────────────────────────────────────────
  tribeJoined:    (tribeId: string) => track('tribe_joined', { tribe_id: tribeId }),
  connectionMade: () => track('connection_made'),
  referralSent:   () => track('referral_link_shared'),

  // ── Engagement ───────────────────────────────────────────────────────────
  sprintStarted:  () => track('sprint_started'),
  sprintCompleted: () => track('sprint_completed'),
  mapModeChange:  (mode: string) => track('map_mode_changed', { mode }),
  voiceToggle:    (on: boolean) => track('voice_toggled', { enabled: on }),

  // ── Monetisation ─────────────────────────────────────────────────────────
  hospitalBooked: (specialty: string) => track('hospital_session_booked', { specialty }),
  skillHired:     (category: string) => track('skill_hired', { category }),
  vlgRedeemed:    (amount: number) => track('vlg_redeemed', { amount }),
};
