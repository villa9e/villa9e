// Goal DNA templates — real completion-rate / avg-timeline stats.
// Aggregates `goals.source_template_id` rows (across all users, via the
// admin client) so the Templates page can show actual outcomes instead of
// the hardcoded MOCK_TEMPLATES numbers.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const admin = createAdminClient() as any;

  const { data, error } = await admin
    .from('goals')
    .select('source_template_id, status, created_at, completed_date')
    .not('source_template_id', 'is', null);

  if (error || !data) return NextResponse.json({ stats: {} });

  const byTemplate: Record<string, { total: number; completed: number; weeksSum: number; weeksCount: number }> = {};
  for (const g of data as any[]) {
    const id = g.source_template_id as string;
    if (!byTemplate[id]) byTemplate[id] = { total: 0, completed: 0, weeksSum: 0, weeksCount: 0 };
    byTemplate[id].total += 1;
    if (g.status === 'completed') {
      byTemplate[id].completed += 1;
      if (g.completed_date && g.created_at) {
        const weeks = (new Date(g.completed_date).getTime() - new Date(g.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7);
        if (weeks > 0) { byTemplate[id].weeksSum += weeks; byTemplate[id].weeksCount += 1; }
      }
    }
  }

  const stats: Record<string, { cloneTotal: number; completionRate: number; avgWeeks: number | null }> = {};
  for (const [id, v] of Object.entries(byTemplate)) {
    stats[id] = {
      cloneTotal: v.total,
      completionRate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
      avgWeeks: v.weeksCount > 0 ? Math.round((v.weeksSum / v.weeksCount) * 10) / 10 : null,
    };
  }

  return NextResponse.json({ stats });
}
