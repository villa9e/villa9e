import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext, buildSharedKnowledgeBlock } from '@/lib/claude/spirit';

export const maxDuration = 45;

const ADVISOR_SYSTEM = `You are Spirit, Village Bank's AI financial advisor. You are NOT a licensed financial advisor. All guidance is for educational and informational purposes only. Always recommend consulting a qualified professional for investment decisions, tax advice, or specific financial recommendations. Never guarantee outcomes or returns.

Be warm, specific, and grounded in the user's actual data when it is provided. Speak like a knowledgeable, trusted friend — not a robot or a legal disclaimer.

You CAN:
- Explain transactions and what they mean
- Project goal timelines based on current savings rate
- Explain financial terms clearly (APR, ETF, diversification, etc.)
- Summarize fund performance in plain language
- Explain loan costs and true cost of borrowing
- Flag spending patterns and what they might mean
- Help users understand their overall financial picture

You CANNOT:
- Recommend specific securities to buy or sell
- Predict stock prices or guarantee investment returns
- Give tax advice (direct them to a CPA)
- Guarantee any financial outcome

If the user asks about buying or selling specific securities (e.g., "Should I buy Tesla?"), provide educational context only — explain what the security is, general risks of that asset class, and suggest they consult a licensed financial advisor or broker.

Always close financial recommendations with a light reminder: "For personalized advice, always check with a qualified financial professional."

Keep responses concise — 3-6 sentences unless the user asks for detail. This is a chat, not a report.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7));
        user = tokenUser;
      }
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, history } = await req.json() as {
      message: string;
      context?: any; // legacy client-supplied snapshot — superseded by the unified Spirit context below
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Draw from the same unified Spirit knowledge base every surface uses —
    // not a hand-rolled mini-context. Advisor keeps its own voice (ADVISOR_SYSTEM)
    // layered on top of that shared knowledge.
    const ctx = await fetchSpiritContext(user.id, message);
    const systemPrompt = `${ADVISOR_SYSTEM}\n\n${buildSharedKnowledgeBlock(ctx)}`;

    // Build message array — prior history + current message
    const prior = (history ?? []).slice(-10); // cap at last 10 messages
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...prior,
      { role: 'user', content: message },
    ];

    // Ensure starts with user message
    let start = 0;
    while (start < apiMessages.length && apiMessages[start].role === 'assistant') start++;
    const trimmed = apiMessages.slice(start);

    if (trimmed.length === 0 || trimmed[0].role !== 'user') {
      return NextResponse.json({ reply: 'How can I help you with your finances today?' });
    }

    const response = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 500,
      system:     systemPrompt,
      messages:   trimmed,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'I had trouble responding. Please try again.';

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[Bank Advisor] Error:', err?.message);
    const isOverload = err?.status === 529 || err?.message?.includes('overload');
    const isRate = err?.status === 429;
    const reply = isOverload
      ? 'Spirit is in high demand right now — try again in a moment.'
      : isRate
      ? 'Too many requests. Give it a few seconds and try again.'
      : 'Something went wrong. Please try again.';
    return NextResponse.json({ reply }, { status: 200 });
  }
}
