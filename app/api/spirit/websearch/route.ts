import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext, buildSpiritSystemPrompt } from '@/lib/claude/spirit';

export const maxDuration = 60;

const DAILY_SEARCH_LIMIT = 20;
const MAX_USES_PER_CALL  = 5;

async function getDailySearchCount(admin: any, userId: string): Promise<number> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { count } = await admin
    .from('data_access_audit')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('accessor_type', 'platform')
    .eq('data_category', 'spirit_web_search')
    .gte('accessed_at', dayStart.toISOString());
  return count ?? 0;
}

async function logSearchAudit(admin: any, userId: string, query: string) {
  try {
    await admin.from('data_access_audit').insert({
      user_id:        userId,
      accessor_type:  'platform',
      accessor_name:  'Spirit AI (web search)',
      data_category:  'spirit_web_search',
      access_purpose: `Spirit searched the web: "${query.slice(0, 120)}"`,
      legal_basis:    'platform_operation',
    });
  } catch { /* non-blocking */ }
}

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
      history?: { role: 'user' | 'assistant'; content: string }[];
    };
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const admin = createAdminClient();

    // Rate-limit: 20 web searches per user per day
    const todayCount = await getDailySearchCount(admin, user.id);
    if (todayCount >= DAILY_SEARCH_LIMIT) {
      return NextResponse.json({
        reply: `I've done ${DAILY_SEARCH_LIMIT} web searches for you today — that's my daily limit. I can still answer from what I know. Ask me tomorrow to search again, or rephrase your question and I'll do my best without searching.`,
        webSearchUsed: false,
        searchQueries: [],
        rateLimited: true,
      });
    }

    // Build unified Spirit context + system prompt (same knowledge base as everywhere)
    const ctx          = await fetchSpiritContext(user.id, message);
    const systemPrompt = buildSpiritSystemPrompt(ctx);

    const prior = (history ?? []).slice(-8);
    let start = 0;
    while (start < prior.length && prior[start].role === 'assistant') start++;
    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...prior.slice(start),
      { role: 'user', content: message },
    ];

    // Call Claude with web_search_20250305 built-in tool.
    // Anthropic handles the search server-side; we read the final text block.
    const response = await (claude.messages.create as any)(
      {
        model:      CLAUDE_MODEL,
        max_tokens: 1024,
        system:     systemPrompt,
        tools:      [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_USES_PER_CALL }],
        messages:   apiMessages,
      },
      { headers: { 'anthropic-beta': 'web-search-2025-03-05' } }
    );

    // Extract final text reply and any search queries that were made
    let reply = '';
    const searchQueries: string[] = [];
    let webSearchUsed = false;

    for (const block of response.content ?? []) {
      if (block.type === 'text') {
        reply = block.text;
      } else if (block.type === 'tool_use' && block.name === 'web_search') {
        webSearchUsed = true;
        const q = (block.input as any)?.query ?? '';
        if (q) searchQueries.push(q);
      }
    }

    if (!reply) {
      reply = 'I searched but couldn\'t find a clean answer. Let me try reasoning from what I know instead.';
    }

    // Log each search query to the audit trail (non-blocking)
    if (webSearchUsed) {
      for (const q of searchQueries) {
        logSearchAudit(admin, user.id, q);
      }
      // If no specific queries extracted, log the user's message as the query
      if (searchQueries.length === 0) {
        logSearchAudit(admin, user.id, message);
      }
    }

    return NextResponse.json({ reply, webSearchUsed, searchQueries });
  } catch (err: any) {
    console.error('[Spirit WebSearch] Error:', err?.message);
    const isOverload = err?.status === 529 || err?.message?.includes('overload');
    const isRate     = err?.status === 429;
    return NextResponse.json({
      reply: isOverload
        ? 'Spirit is in high demand right now — try again in a moment.'
        : isRate
        ? 'Too many requests. Give it a few seconds.'
        : 'I had trouble searching the web. Let me answer from what I know instead.',
      webSearchUsed: false,
      searchQueries: [],
    }, { status: 200 });
  }
}
