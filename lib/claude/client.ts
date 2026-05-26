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

interface CallClaudeOptions {
  system?: string;
  returnRaw?: boolean;
  maxTokens?: number;
}

export async function callClaude(prompt: string, options?: CallClaudeOptions | string): Promise<any> {
  // Support legacy callClaude(prompt, systemString) signature
  const system = typeof options === 'string' ? options : (options?.system ?? SPIRIT_SYSTEM_PROMPT);
  const returnRaw = typeof options === 'object' ? (options?.returnRaw ?? false) : false;
  const maxTokens = typeof options === 'object' ? (options?.maxTokens ?? 2048) : 2048;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  if (returnRaw) return text;

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}
