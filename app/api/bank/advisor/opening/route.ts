import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { fetchSpiritContext } from '@/lib/claude/spirit';

export const maxDuration = 30;

// Account/credit-card breakdown and budget estimate aren't part of the shared
// Spirit finance snapshot (those are Bank-specific framing, not cross-domain
// knowledge) — pulled directly here, layered on top of the shared snapshot.
async function getAccountBreakdown(supabase: any, userId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [accountsRes, txRes] = await Promise.all([
    supabase.from('bank_accounts').select('account_type, balance').eq('user_id', userId),
    supabase.from('bank_transactions').select('amount, direction')
      .eq('user_id', userId).gte('created_at', monthStart.toISOString()),
  ]);

  const accounts = accountsRes.data ?? [];
  const checkingBalance   = accounts.filter((a: any) => a.account_type === 'checking').reduce((s: number, a: any) => s + (parseFloat(a.balance) || 0), 0);
  const savingsBalance    = accounts.filter((a: any) => a.account_type === 'savings').reduce((s: number, a: any) => s + (parseFloat(a.balance) || 0), 0);
  const creditCardBalance = accounts.filter((a: any) => a.account_type === 'credit').reduce((s: number, a: any) => s + (parseFloat(a.balance) || 0), 0);

  const transactions = txRes.data ?? [];
  const monthlySpend = transactions
    .filter((t: any) => t.direction === 'debit')
    .reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

  // No dedicated budgets table yet — estimate a budget as spend rounded up
  const monthlyBudget = monthlySpend > 0 ? Math.ceil(monthlySpend * 1.15 / 100) * 100 : 0;
  const budgetPctUsed = monthlyBudget > 0 ? Math.round((monthlySpend / monthlyBudget) * 100) : 0;

  return { checkingBalance, savingsBalance, creditCardBalance, monthlyBudget, budgetPctUsed };
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

    // Pull the same unified Spirit context every surface draws from, plus
    // the Bank-specific account breakdown layered on top of it.
    const [ctx, breakdown] = await Promise.all([
      fetchSpiritContext(user.id),
      getAccountBreakdown(supabase, user.id),
    ]);
    const fin = ctx.finance;
    const displayName = ctx.displayName;

    const prompt = `Generate a personalized financial advisor opening message for ${displayName}.

Their financial data:
- Total balance: $${fin.totalBalance.toLocaleString()}
- Checking: $${breakdown.checkingBalance.toLocaleString()}, Savings: $${breakdown.savingsBalance.toLocaleString()}, Portfolio: $${fin.portfolioValue.toLocaleString()}
- Monthly spend: $${fin.monthlySpend.toLocaleString()} of $${breakdown.monthlyBudget.toLocaleString()} budget (${breakdown.budgetPctUsed}% used)
- Portfolio this month: ${fin.portfolioChange > 0 ? '+' : ''}${fin.portfolioChange}%
- Active goals: ${fin.activeGoals} (${fin.goalsOnTrack} on track)
- Credit card balance: $${breakdown.creditCardBalance.toLocaleString()}

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
        message: `Your total balance is $${fin.totalBalance.toLocaleString()} across all accounts. Budget is ${breakdown.budgetPctUsed}% used this month and your portfolio is ${fin.portfolioChange > 0 ? 'up' : 'down'} ${Math.abs(fin.portfolioChange)}%. What would you like to dig into?`,
        suggestedQuestions: [
          'How can I pay off my credit card faster?',
          'Am I on track for my savings goals?',
          'How is my portfolio performing?',
        ],
      };
    }

    return NextResponse.json({
      message:            parsed.message,
      suggestedQuestions: parsed.suggestedQuestions ?? [],
      summary:            { ...fin, ...breakdown },
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
