import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export const maxDuration = 30;

// Mock financial summary — replace with real Supabase/Unit queries when live
function getMockFinancialSummary() {
  return {
    totalBalance:   24487,
    checkingBalance: 8240,
    savingsBalance:  4607,
    portfolioValue:  12840,
    monthlySpend:    3715,
    monthlyBudget:   4200,
    budgetPctUsed:   Math.round((3715 / 4200) * 100),
    portfolioChange: 3.4,   // % change this month
    activeGoals:     3,
    goalsOnTrack:    2,
    creditCardBalance: 1200,
  };
}

const OPENING_SYSTEM = `You are Spirit, Village Bank's AI financial advisor. NOT a licensed financial advisor — educational purposes only.

Generate a warm, personalized 2-3 sentence opening message for the user's financial chat session. Use their actual data. Be specific with numbers. Be encouraging but honest. End with an open question inviting them to dig into anything specific.

Examples of good tone:
- "Your total balance is $24,487 — solid footing. Your budget is 88% used this month, mostly driven by housing and food. Portfolio is up 3.4% this month. Is there anything specific you want to dig into?"
- "You're at $24,487 across all accounts. Budget is 88% used this cycle and you've got 2 of 3 goals on track. What's on your mind today?"

Keep it under 60 words. No disclaimers in the opening — just the data summary and invitation.

Also return 3 suggested follow-up questions relevant to their current financial state. Questions should be specific to their data, not generic. Return as JSON: { "message": "...", "suggestedQuestions": ["...", "...", "..."] }`;

export async function GET(req: NextRequest) {
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

    // Load user display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, full_name, vlg_balance')
      .eq('id', user.id)
      .single();

    const displayName = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there';
    const fin = getMockFinancialSummary();

    const prompt = `Generate a personalized financial advisor opening message for ${displayName}.

Their financial data:
- Total balance: $${fin.totalBalance.toLocaleString()}
- Checking: $${fin.checkingBalance.toLocaleString()}, Savings: $${fin.savingsBalance.toLocaleString()}, Portfolio: $${fin.portfolioValue.toLocaleString()}
- Monthly spend: $${fin.monthlySpend.toLocaleString()} of $${fin.monthlyBudget.toLocaleString()} budget (${fin.budgetPctUsed}% used)
- Portfolio this month: ${fin.portfolioChange > 0 ? '+' : ''}${fin.portfolioChange}%
- Active goals: ${fin.activeGoals} (${fin.goalsOnTrack} on track)
- Credit card balance: $${fin.creditCardBalance.toLocaleString()}

Return JSON only: { "message": "...", "suggestedQuestions": ["...", "...", "..."] }`;

    const response = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 400,
      system:     OPENING_SYSTEM,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: { message: string; suggestedQuestions: string[] };
    try {
      // Strip markdown code fences if present
      const clean = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        message: `Your total balance is $${fin.totalBalance.toLocaleString()} across all accounts. Budget is ${fin.budgetPctUsed}% used this month and your portfolio is ${fin.portfolioChange > 0 ? 'up' : 'down'} ${Math.abs(fin.portfolioChange)}%. What would you like to dig into?`,
        suggestedQuestions: [
          'How can I pay off my credit card faster?',
          'Am I on track for my savings goals?',
          'How is my portfolio performing?',
        ],
      };
    }

    return NextResponse.json({
      message:           parsed.message,
      suggestedQuestions: parsed.suggestedQuestions ?? [],
    });
  } catch (err: any) {
    console.error('[Bank Advisor Opening] Error:', err?.message);
    // Graceful fallback — never block the page load
    return NextResponse.json({
      message: 'Your finances are ready for review. What would you like to talk through today?',
      suggestedQuestions: [
        'Where am I spending the most this month?',
        'Am I on track for my savings goals?',
        'How is my investment portfolio performing?',
      ],
    });
  }
}
export const dynamic = 'force-dynamic';
