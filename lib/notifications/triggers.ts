/**
 * Personalized push notification triggers.
 * Call these server-side from API routes after key events.
 */

const ONESIGNAL_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ONESIGNAL_APP = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

async function push(userId: string, title: string, body: string, url: string, data?: any) {
  if (!ONESIGNAL_KEY || !ONESIGNAL_APP) return;
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${ONESIGNAL_KEY}` },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP,
        include_external_user_ids: [userId],
        headings:  { en: title },
        contents:  { en: body },
        url,
        data: data ?? {},
      }),
    });
  } catch { /* non-blocking */ }
}

export const PushTriggers = {

  // ── OoWop received ──────────────────────────────────────────────────────
  oowopReceived(receiverId: string, giverUsername: string, stepTitle: string, goalId: string) {
    return push(
      receiverId,
      '✊ You got an OoWop!',
      `@${giverUsername} validated your step: "${stepTitle.slice(0, 50)}"`,
      `https://villa9e.app/village/workshop/goal/${goalId}`,
      { type: 'oowop', goal_id: goalId }
    );
  },

  // ── Streak at risk (0 check-ins today, 11pm) ────────────────────────────
  streakAtRisk(userId: string, streakDays: number) {
    if (streakDays < 2) return;
    return push(
      userId,
      `🔥 Don't break your ${streakDays}-day streak`,
      'You haven\'t checked in with Spirit today. One minute keeps it alive.',
      'https://villa9e.app/village/spirit/checkin',
      { type: 'streak_risk', streak: streakDays }
    );
  },

  // ── Goal step completed by teammate ────────────────────────────────────
  teamStepComplete(receiverId: string, username: string, stepTitle: string, goalId: string) {
    return push(
      receiverId,
      '📍 Team progress!',
      `@${username} just completed: "${stepTitle.slice(0, 50)}"`,
      `https://villa9e.app/village/workshop/goal/${goalId}`,
      { type: 'team_step', goal_id: goalId }
    );
  },

  // ── Tribe mate posted ───────────────────────────────────────────────────
  tribePost(memberIds: string[], posterUsername: string, tribeName: string, tribeId: string) {
    return Promise.all(memberIds.map(id => push(
      id,
      `${tribeName} update`,
      `@${posterUsername} just posted in your tribe.`,
      `https://villa9e.app/village/tribes/${tribeId}`,
      { type: 'tribe_post', tribe_id: tribeId }
    )));
  },

  // ── Goal completed — celebrate ──────────────────────────────────────────
  goalCompleted(userId: string, goalTitle: string, medal: string) {
    return push(
      userId,
      `🏆 Goal complete: ${medal} medal!`,
      `"${goalTitle.slice(0, 60)}" — marked complete. Spirit is proud.`,
      'https://villa9e.app/village/workshop',
      { type: 'goal_complete' }
    );
  },

  // ── Connection request ──────────────────────────────────────────────────
  connectionRequest(receiverId: string, fromUsername: string) {
    return push(
      receiverId,
      '🤝 New connection request',
      `@${fromUsername} wants to connect with you in the village.`,
      'https://villa9e.app/village/discover/connections',
      { type: 'connection_request' }
    );
  },

  // ── Spirit check-in reminder (morning/evening) ──────────────────────────
  checkinReminder(userId: string, timeOfDay: 'morning' | 'evening', name: string) {
    const msgs = {
      morning: { title: `☀️ Good morning, ${name}`, body: 'Spirit is ready for your morning check-in. It takes 60 seconds.' },
      evening: { title: `🌙 Evening check-in, ${name}`, body: 'Reflect on your day with Spirit. Don\'t let tonight pass without it.' },
    };
    return push(userId, msgs[timeOfDay].title, msgs[timeOfDay].body, 'https://villa9e.app/village/spirit/checkin', { type: 'checkin_reminder' });
  },

  // ── Hospital booking reminder (1hr before) ─────────────────────────────
  sessionReminder(userId: string, providerName: string, jitsiUrl: string) {
    return push(
      userId,
      '🎥 Session starting in 1 hour',
      `Your session with ${providerName} is coming up. Video link ready.`,
      jitsiUrl,
      { type: 'session_reminder' }
    );
  },
};
