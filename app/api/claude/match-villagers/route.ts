import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const admin    = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal_id } = await req.json();

  // Get current user's profile + skills
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
  const { data: skills }  = await admin.from('user_skills').select('*').eq('user_id', user.id);
  const { data: goal }    = goal_id ? await admin.from('goals').select('*, goal_steps(required_skill)').eq('id', goal_id).single() : { data: null };

  const userContext = {
    skills: skills?.map((s: any) => `${s.skill_name} (${s.rating}/9 — ${s.rating_category})`).join(', ') ?? 'none',
    goal: goal?.title ?? 'finding general matches',
    rolesNeeded: goal?.ai_analysis?.roles_needed?.join(', ') ?? 'any',
    stepSkills: goal?.goal_steps?.map((s: any) => s.required_skill).filter(Boolean).join(', ') ?? 'any',
  };

  // pgvector semantic search — find villagers with complementary skills
  const { data: candidates } = await admin.from('profiles')
    .select('id, username, display_name, village_score, score_tier, personality_type')
    .neq('id', user.id).gt('village_score', 0).limit(50);

  if (!candidates?.length) return NextResponse.json({ matches: [] });

  // Use Claude to score the top candidates
  const prompt = `You are Spirit, the matching engine of villa9e.

Current villager context:
- Skills: ${userContext.skills}
- Working on: ${userContext.goal}
- Roles needed: ${userContext.rolesNeeded}
- Skills needed for goal steps: ${userContext.stepSkills}

Candidates (${candidates.length} villagers):
${candidates.slice(0, 20).map((c, i) => `${i+1}. @${c.username} | Score: ${c.village_score} | Tier: ${c.score_tier} | Personality: ${c.personality_type ?? 'unknown'}`).join('\n')}

Return JSON array of the top 5 matches:
[{"username": "...", "match_score": 85, "match_reason": "One sentence why they're a great match", "role_match": "The role they'd fill"}]

Prioritize: complementary skills, high village_score, and good personality fit.`;

  const message = await claude.messages.create({
    model: CLAUDE_MODEL, max_tokens: 512,
    system: 'You are Spirit, villa9e AI matching engine. Return only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let aiMatches = [];
  try { aiMatches = JSON.parse(text); } catch { aiMatches = []; }

  // Enrich with full profile data
  const matches = aiMatches.map((m: any) => {
    const cand = candidates.find(c => c.username === m.username);
    return { ...m, ...cand };
  }).filter((m: any) => m.id);

  // Save matches to DB
  for (const match of matches) {
    await admin.from('villager_matches').upsert({
      user_id:       user.id,
      matched_user_id: match.id,
      goal_id:       goal_id ?? null,
      match_score:   match.match_score,
      match_reason:  match.match_reason,
      roles_matched: { role: match.role_match },
    }, { onConflict: 'user_id,matched_user_id,goal_id' });
  }

  return NextResponse.json({ matches });
}
