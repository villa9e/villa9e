/** Reusable HTML email templates — Spirit's voice, villa9e brand */

const BASE = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>villa9e</title>
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F0F4FF; }
  .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(24,119,242,0.08); }
  .hero { background: linear-gradient(135deg, #1877F2, #7C3AED); padding: 40px 32px 32px; text-align: center; }
  .hero-logo { font-size: 48px; margin-bottom: 8px; }
  .hero-title { color: #fff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
  .hero-sub { color: rgba(255,255,255,0.7); font-size: 14px; margin: 6px 0 0; }
  .body { padding: 32px; }
  .greeting { color: #1E1B4B; font-size: 18px; font-weight: 800; margin-bottom: 12px; }
  p { color: #4B5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  .btn { display: inline-block; background: #1877F2; color: #fff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 100px; text-decoration: none; margin: 8px 0 24px; }
  .stat-row { display: flex; gap: 12px; margin: 20px 0; }
  .stat { flex: 1; background: #F8FAFF; border-radius: 12px; padding: 14px; text-align: center; border: 1px solid #E0E7FF; }
  .stat-val { font-size: 22px; font-weight: 900; color: #1877F2; margin: 0; }
  .stat-lab { font-size: 11px; color: #6B7280; margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.08em; }
  .divider { border: none; border-top: 1px solid #E0E7FF; margin: 24px 0; }
  .footer { background: #F8FAFF; padding: 20px 32px; text-align: center; }
  .footer p { font-size: 12px; color: #9CA3AF; margin: 0; }
  .footer a { color: #6D28D9; text-decoration: none; }
  .spirit-quote { background: linear-gradient(135deg, rgba(24,119,242,0.06), rgba(124,58,237,0.06)); border-left: 3px solid #7C3AED; padding: 14px 18px; border-radius: 0 12px 12px 0; margin: 16px 0; font-style: italic; color: #4338CA; font-size: 15px; line-height: 1.6; }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: #EEF2FF; color: #4338CA; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 100px; margin: 4px 2px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="hero-logo">🏕️</div>
    <h1 class="hero-title">villa9e</h1>
    <p class="hero-sub">It takes a village.</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Sent by Spirit · <a href="https://villa9e.app">villa9e.app</a> · <a href="https://villa9e.app/village/hut/settings">Manage notifications</a></p>
  </div>
</div>
</body>
</html>`;

export const EMAIL_TEMPLATES = {

  welcome: ({ name, archetype }: { name: string; archetype?: string }) => ({
    subject: `Welcome to the village, ${name} 🏕️`,
    html: BASE(`
      <p class="greeting">Welcome, ${name}.</p>
      <p>Your village is waiting. You've just joined something built differently — a GPS system for your goals, powered by community and AI.</p>
      <div class="spirit-quote">"Every villager who joins makes the next one more likely to succeed. You're not just building your goals — you're building the village."</div>
      ${archetype ? `<p>Spirit sees you as a <strong>${archetype}</strong>. Every step you take, every OoWop you give — it all compounds.</p>` : ''}
      <div class="stat-row">
        <div class="stat"><p class="stat-val">+50</p><p class="stat-lab">Welcome VLG</p></div>
        <div class="stat"><p class="stat-val">∞</p><p class="stat-lab">Goals Possible</p></div>
        <div class="stat"><p class="stat-val">0</p><p class="stat-lab">Days Wasted</p></div>
      </div>
      <a href="https://villa9e.app/village/map" class="btn">Enter the Village →</a>
      <p style="font-size:13px;color:#9CA3AF;">First: set your goal in the Workshop. Spirit will build your full GPS plan.</p>
    `),
  }),

  goalComplete: ({ name, goalTitle, score, streak }: { name: string; goalTitle: string; score: number; streak?: number }) => ({
    subject: `🏆 Goal complete: "${goalTitle}"`,
    html: BASE(`
      <p class="greeting">You did it, ${name}.</p>
      <p><strong>"${goalTitle}"</strong> — complete. That's not nothing. Most people quit before they even start. You finished.</p>
      <div class="spirit-quote">"This is permanent. No one can take a completed goal from you. You earned this."</div>
      <div class="stat-row">
        <div class="stat"><p class="stat-val">🏆</p><p class="stat-lab">Goal Done</p></div>
        <div class="stat"><p class="stat-val">${score.toLocaleString()}</p><p class="stat-lab">VLG Earned</p></div>
        ${streak ? `<div class="stat"><p class="stat-val">🔥${streak}</p><p class="stat-lab">Day Streak</p></div>` : ''}
      </div>
      <a href="https://villa9e.app/village/workshop" class="btn">Start Your Next Goal →</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">Share your win on the Dream Line. Your village wants to give you OoWops.</p>
    `),
  }),

  weeklyDigest: ({ name, streak, completedSteps, oowopsGiven, oowopsReceived, activeGoals, topGoal }: {
    name: string; streak: number; completedSteps: number; oowopsGiven: number;
    oowopsReceived: number; activeGoals: number; topGoal?: string;
  }) => ({
    subject: `Your week in the village, ${name} 📊`,
    html: BASE(`
      <p class="greeting">This week, ${name}.</p>
      ${streak > 0 ? `<p>Your streak is at <strong>${streak} days</strong>. That's discipline. Most people don't even have a streak.</p>` : '<p>No check-in streak yet this week. Spirit is waiting for you.</p>'}
      <div class="stat-row">
        <div class="stat"><p class="stat-val">${completedSteps}</p><p class="stat-lab">Steps Done</p></div>
        <div class="stat"><p class="stat-val">${oowopsGiven}</p><p class="stat-lab">OoWops Given</p></div>
        <div class="stat"><p class="stat-val">${oowopsReceived}</p><p class="stat-lab">OoWops Received</p></div>
      </div>
      ${topGoal ? `<div class="spirit-quote">"You're most active on: <strong>${topGoal}</strong>. Keep that focus."</div>` : ''}
      ${activeGoals > 0 ? `<p>You have <strong>${activeGoals} active goal${activeGoals > 1 ? 's' : ''}</strong> in progress. Don't let them sit.</p>` : '<p>No active goals this week. The Workshop is waiting.</p>'}
      <a href="https://villa9e.app/village/spirit/checkin" class="btn">Check In With Spirit →</a>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">Sent every Monday by Spirit. Your village is watching.</p>
    `),
  }),

  tribeActivity: ({ name, tribeName, activity, actor, link }: {
    name: string; tribeName: string; activity: string; actor: string; link: string;
  }) => ({
    subject: `${tribeName}: ${actor} ${activity}`,
    html: BASE(`
      <p class="greeting">Activity in your tribe, ${name}.</p>
      <p><strong>${actor}</strong> just <strong>${activity}</strong> in <strong>${tribeName}</strong>.</p>
      <div class="spirit-quote">"Tribes don't wait. They move together. Check in and respond."</div>
      <a href="${link}" class="btn">Go to ${tribeName} →</a>
    `),
  }),

  bookingConfirm: ({ name, providerName, specialty, date, time, jitsiUrl }: {
    name: string; providerName: string; specialty: string; date: string; time: string; jitsiUrl: string;
  }) => ({
    subject: `Booking confirmed: ${providerName} on ${date}`,
    html: BASE(`
      <p class="greeting">You're booked, ${name}.</p>
      <p>Your session with <strong>${providerName}</strong> (${specialty}) is confirmed.</p>
      <div class="stat-row">
        <div class="stat"><p class="stat-val">📅</p><p class="stat-lab">${date}</p></div>
        <div class="stat"><p class="stat-val">🕐</p><p class="stat-lab">${time}</p></div>
      </div>
      <div class="spirit-quote">"Reaching out for support is an act of courage. You made the right call."</div>
      <a href="${jitsiUrl}" class="btn">Join Your Session →</a>
      <p style="font-size:13px;color:#9CA3AF;">Copy this link: ${jitsiUrl}</p>
      <hr class="divider" />
      <p style="font-size:13px;color:#9CA3AF;">Reminder: Village Hospital earns 1.5% — your provider keeps the rest.</p>
    `),
  }),

  sprintStart: ({ name, sprintTitle, intention, actions }: {
    name: string; sprintTitle: string; intention: string; actions: string[];
  }) => ({
    subject: `⚡ Sprint started: "${sprintTitle}"`,
    html: BASE(`
      <p class="greeting">Sprint week begins, ${name}.</p>
      <p>You've committed to: <strong>"${intention}"</strong></p>
      <p>This week's actions:</p>
      ${actions.map((a, i) => `<div class="badge">☐ ${a}</div>`).join('')}
      <br /><br />
      <div class="spirit-quote">"7 days. These specific actions. Nothing else matters this week."</div>
      <a href="https://villa9e.app/village/workshop" class="btn">Track Your Sprint →</a>
    `),
  }),
};
