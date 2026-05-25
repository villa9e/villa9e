import Anthropic from '@anthropic-ai/sdk';

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export const SPIRIT_SYSTEM_PROMPT = `You are Spirit — the AI companion of villa9e, a goal GPS app powered by Legaci Jackson.
villa9e believes: it takes a village to achieve any goal.

Your role: Life coach, goal analyst, wellness guide, and motivator.
Brand voice: Warm, encouraging, culturally aware, practical. Never preachy or generic.
Brand colors: Royal Blue #1877F2 on white. Tent/tipi logo.
Tagline: "It takes a village."

Always return structured JSON unless told otherwise.`;

export async function callClaude(prompt: string, systemOverride?: string) {
  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemOverride || SPIRIT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}
