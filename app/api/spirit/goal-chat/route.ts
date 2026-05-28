import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext } from '@/lib/claude/spirit';

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, context: prevContext } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[];
    context: Record<string, any>;
  };

  // Load user's Spirit context (archetype, spiritual system, communication style)
  const spiritCtx = await fetchSpiritContext(user.id);
  const userName  = spiritCtx.displayName;

  const systemPrompt = `You are Spirit — ${userName}'s personal AI goal coach. You are having a CONVERSATIONAL chat to help them build a complete Goal GPS.

You guide the conversation through these phases naturally — don't announce phases, just flow through them:

PHASE 1 — GOAL DISCOVERY
Understand exactly what the goal is. Ask clarifying questions until you're crystal clear on:
- What specifically they want to achieve
- Why this goal matters to them (the emotional driver)
- What success looks like precisely (measurable outcomes)
- Their timeframe

PHASE 2 — PROXIMITY ASSESSMENT
Understand where they are RIGHT NOW relative to the goal:
- Their current skill level
- Resources they already have
- Experience they bring
- Support system in place

PHASE 3 — RESOURCE MAPPING
Understand what's needed to close the gap:
- Skills to acquire
- People needed (mentors, partners, teammates)
- Tools/equipment/software needed
- Budget/funding required (get a realistic number)
- Timeline to achieve it

PHASE 4 — ACTION PLANNING
You now have enough to start building. Ask 1-2 final questions to nail down the sprint structure.

CONVERSATION RULES:
- Ask ONE question at a time. NEVER ask multiple questions in one message.
- Be warm, real, celebratory of their ambition.
- Mirror their energy — if they're excited, be excited. If they're uncertain, be steady.
- Use their name occasionally.
- When you have enough context (typically 8-15 exchanges), generate the GPS.
- Keep messages SHORT — 2-4 sentences max. This is a CHAT, not an essay.

DETECTING WHEN YOU HAVE ENOUGH:
You're ready to generate the GPS when you know:
✓ The specific goal + success metrics
✓ Their starting point
✓ Rough timeline
✓ At least 3-5 concrete actions needed
✓ Any budget/funding requirements

When ready, end your message with exactly:
[GPS_READY: {"goalTitle": "...", "goalDescription": "...", "category": "...", "targetDate": "YYYY-MM-DD", "estimatedCost": 0, "requiresFunding": false, "requiresTradeSkills": false, "skills": ["..."], "resources": ["..."], "actions": ["action 1", "action 2", "..."], "successMetrics": ["..."], "startingPoint": "...", "timeline": "...", "probabilityScore": 75}]

Return ONLY valid JSON after [GPS_READY: — no extra text after the closing ]

${spiritCtx.archetype ? `This person's archetype is ${spiritCtx.archetype} — speak accordingly.` : ''}
${spiritCtx.communicationStyle ? `Their preferred communication style: ${spiritCtx.communicationStyle}` : ''}`;

  // Claude API requires messages[0].role === 'user'
  // The Spirit greeting is an assistant message — skip it, reconstruct from user messages onward
  const apiMessages = messages
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    .filter((m, i) => {
      // Drop leading assistant messages
      if (i === 0 && m.role === 'assistant') return false;
      return true;
    });

  // Ensure we always have at least one user message (safety)
  if (apiMessages.length === 0 || apiMessages[0].role !== 'user') {
    return NextResponse.json({ message: 'What goal are we building today?', phase: 'discovery', gpsReady: false });
  }

  const response = await claude.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 600,
    system:     systemPrompt,
    messages:   apiMessages,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';

  // Check if GPS data is embedded in the response
  const gpsMatch = raw.match(/\[GPS_READY:\s*({[\s\S]+?})\]/);
  let gpsData: Record<string, any> | null = null;
  let cleanMessage = raw;

  if (gpsMatch) {
    try {
      gpsData = JSON.parse(gpsMatch[1]);
      // Remove the GPS_READY block from the visible message
      cleanMessage = raw.replace(/\[GPS_READY:[\s\S]+?\]/, '').trim();
      if (!cleanMessage) {
        cleanMessage = `I've mapped everything out, ${userName}. Here's your Goal GPS — take a look and when you're ready, press **Start** to launch. Spirit counts you in. 🚀`;
      }
    } catch {
      gpsData = null;
    }
  }

  // Determine current phase from conversation length
  const msgCount = messages.filter(m => m.role === 'user').length;
  const phase = msgCount < 3 ? 'discovery' : msgCount < 6 ? 'success' : msgCount < 9 ? 'proximity' : msgCount < 12 ? 'resources' : 'generating';

  return NextResponse.json({
    message:   cleanMessage,
    phase,
    gpsReady:  !!gpsData,
    gpsData,
    msgCount,
  });
}
