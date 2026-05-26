const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'spirit@villa9e.app';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function welcomeEmail(username: string, isFoundingVillager: boolean, foundingNumber?: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #F8F9FF; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1877F2 0%, #42A5F5 100%); padding: 40px; text-align: center; }
  .logo { font-size: 48px; margin-bottom: 8px; }
  .header h1 { color: white; margin: 0; font-size: 28px; }
  .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
  .body { padding: 40px; }
  .badge { display: inline-block; background: #FEF3C7; color: #92400E; border-radius: 20px; padding: 8px 16px; font-size: 13px; font-weight: bold; margin-bottom: 24px; }
  h2 { color: #1a1a2e; font-size: 22px; margin: 0 0 12px; }
  p { color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #1877F2; color: white; text-decoration: none; border-radius: 50px; padding: 16px 32px; font-weight: bold; font-size: 16px; margin: 8px 0 24px; }
  .features { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
  .feature { background: #F8F9FF; border-radius: 12px; padding: 16px; }
  .feature-icon { font-size: 24px; margin-bottom: 8px; }
  .feature-title { font-weight: bold; color: #1a1a2e; font-size: 14px; }
  .feature-desc { color: #6B7280; font-size: 12px; margin: 4px 0 0; }
  .footer { background: #F8F9FF; padding: 24px 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">⛺</div>
    <h1>Welcome to villa9e</h1>
    <p>It takes a village.</p>
  </div>
  <div class="body">
    ${isFoundingVillager ? `<div class="badge">👑 Founding Villager #${foundingNumber}</div>` : ''}
    <h2>Hey @${username}! Your village is ready. 🎉</h2>
    <p>Spirit is excited to guide you. villa9e is your GPS for any goal — powered by AI and validated by your community.</p>
    ${isFoundingVillager ? `<p><strong>You're one of the first 1,000 villagers.</strong> You've earned the Founding Villager badge, 500 $VLG bonus at Phase 3, a permanent OoWop multiplier, and a direct line to Legaci Jackson.</p>` : ''}
    <a href="https://villa9e.app/village/workshop" class="cta">Set Your First Goal →</a>
    <div class="features">
      <div class="feature"><div class="feature-icon">📡</div><div class="feature-title">Goal GPS</div><div class="feature-desc">AI builds your step-by-step plan</div></div>
      <div class="feature"><div class="feature-icon">✊</div><div class="feature-title">OoWops</div><div class="feature-desc">Village validates your progress</div></div>
      <div class="feature"><div class="feature-icon">💰</div><div class="feature-title">$VLG Wallet</div><div class="feature-desc">Earn as you achieve</div></div>
      <div class="feature"><div class="feature-icon">🏥</div><div class="feature-title">Hospital</div><div class="feature-desc">Licensed providers when you need them</div></div>
    </div>
    <p style="font-size: 13px; color: #9CA3AF;">Questions? Reply to this email or message Spirit in the Zen Space.</p>
  </div>
  <div class="footer">
    <p>© 2026 Legaci Jackson LLC · villa9e.app · <a href="https://villa9e.app/privacy" style="color: #1877F2;">Privacy</a> · <a href="https://villa9e.app/terms" style="color: #1877F2;">Terms</a></p>
  </div>
</div>
</body>
</html>`;
}
