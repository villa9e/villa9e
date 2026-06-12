import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { claude, CLAUDE_MODEL } from '@/lib/claude/client';
import { findProductsForGoal, findProductsForStep } from '@/lib/affiliate/products';

export const maxDuration = 120;

const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;

async function searchYouTube(query: string, maxResults = 3): Promise<{ title: string; videoId: string; thumbnail: string; channelTitle: string }[]> {
  if (!YOUTUBE_KEY) return [];
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&relevanceLanguage=en&key=${YOUTUBE_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const d = await r.json();
    return (d.items ?? []).map((item: any) => ({
      title:        item.snippet.title,
      videoId:      item.id.videoId,
      thumbnail:    item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin    = createAdminClient() as any;

  // Auth: cookie session first, then Authorization: Bearer token fallback
  // (the browser may not always send a readable session cookie to the route).
  let { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user: tokenUser } } = await supabase.auth.getUser(authHeader.slice(7));
      user = tokenUser;
    }
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gpsData, conversationSummary } = await req.json() as {
    gpsData: {
      goalTitle:          string;
      goalDescription:    string;
      category:           string;
      targetDate:         string;
      estimatedCost:      number;
      requiresFunding:    boolean;
      requiresTradeSkills:boolean;
      skills:             string[];
      resources:          string[];
      actions:            string[];
      successMetrics:     string[];
      startingPoint:      string;
      timeline:           string;
      probabilityScore:   number;
    };
    conversationSummary: string;
  };

  // ── 1. Generate detailed steps + sprints via Claude ───────────────────────
  let plan: any = { steps: [], sprints: [], keyMilestones: [], tribeRequirements: [], mentorProfile: '', affiliateSearchTerms: [] };
  try {
    const planResponse = await claude.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role:    'user',
        content: `Create a detailed goal action plan as JSON for this goal:

Title: ${gpsData.goalTitle}
Category: ${gpsData.category}
Timeline: ${gpsData.timeline}
Actions identified: ${gpsData.actions.join(', ')}
Starting point: ${gpsData.startingPoint}
Success metrics: ${gpsData.successMetrics.join(', ')}

Return ONLY valid JSON:
{
  "steps": [
    {
      "title": "Step title",
      "description": "What to do and why",
      "order": 1,
      "estimatedDays": 7,
      "week": 1,
      "category": "action|research|skill|connect|create",
      "searchQuery": "YouTube search query for this step",
      "milestoneType": "action|milestone|checkpoint"
    }
  ],
  "sprints": [
    {
      "title": "Sprint 1 focus",
      "weekStart": 1,
      "weekEnd": 2,
      "objective": "What gets done this sprint"
    }
  ],
  "keyMilestones": ["milestone 1", "milestone 2"],
  "riskFactors": ["potential blocker 1"],
  "tribeRequirements": ["skill/trait needed in teammates"],
  "mentorProfile": "Description of ideal mentor for this goal",
  "affiliateSearchTerms": ["product category 1", "product category 2"]
}

Generate 5-12 concrete steps. Be specific and actionable.`,
      }],
    });
    const txt = planResponse.content[0].type === 'text' ? planResponse.content[0].text : '{}';
    plan = JSON.parse(txt.match(/\{[\s\S]+\}/)?.[0] ?? '{}');
  } catch { /* use fallback empty plan */ }

  // ── 2. Save goal to database ──────────────────────────────────────────────
  // Use the admin client for writes so the insert succeeds regardless of how
  // the user was authenticated (cookie vs Bearer token) — user_id is explicit.
  const { data: goal, error: goalErr } = await admin.from('goals').insert({
    user_id:            user.id,
    title:              gpsData.goalTitle,
    description:        gpsData.goalDescription,
    category:           gpsData.category,
    target_date:        gpsData.targetDate || null,
    status:             'active',
    probability_score:  gpsData.probabilityScore,
    estimated_cost:     gpsData.estimatedCost,
    requires_funding:   gpsData.requiresFunding,
    ai_analysis: {
      startingPoint:    gpsData.startingPoint,
      successMetrics:   gpsData.successMetrics,
      skills:           gpsData.skills,
      resources:        gpsData.resources,
      tribeRequirements: plan.tribeRequirements,
      mentorProfile:    plan.mentorProfile,
      riskFactors:      plan.riskFactors,
      conversationSummary,
    },
    estimated_weeks:    parseInt(gpsData.timeline) || 12,
    progress_percentage: 0,
  }).select().single();

  if (goalErr || !goal) {
    return NextResponse.json({ error: 'Failed to create goal', details: goalErr }, { status: 500 });
  }

  // ── 3. Save steps with videos ─────────────────────────────────────────────
  const steps = plan.steps ?? [];
  const stepInserts = await Promise.all(
    steps.map(async (step: any, idx: number) => {
      // Search YouTube for each step
      const videos = await searchYouTube(`${step.searchQuery || step.title} tutorial`, 3);

      // Find app content first (prioritize over YouTube)
      let appVideos: any[] = [];
      try {
        const { data } = await admin
          .from('studio_videos')
          .select('id, title, thumbnail_url, video_url, watch_count, likes, is_affiliate')
          .ilike('title', `%${step.title.split(' ')[0]}%`)
          .order('is_affiliate', { ascending: false })
          .order('watch_count', { ascending: false })
          .limit(2);
        appVideos = data ?? [];
      } catch { /* non-blocking */ }

      return {
        goal_id:       goal.id,
        user_id:       user.id,
        title:         step.title,
        description:   step.description,
        step_number:   idx + 1,
        week_number:   step.week || Math.ceil((idx + 1) / 2),
        estimated_days: step.estimatedDays || 7,
        milestone_type: step.milestoneType || 'action',
        status:            'pending',
        resource_category: step.resourceCategory || 'general',
        youtube_videos:    videos,
        app_videos:        appVideos ?? [],
      };
    })
  );

  if (stepInserts.length > 0) {
    try { await admin.from('goal_steps').insert(stepInserts); } catch { /* non-blocking */ }
  }

  // ── 4. Find affiliate products for this goal ──────────────────────────────
  const affiliateProducts = findProductsForGoal(gpsData.goalTitle, gpsData.category, 4);

  // ── 5. Create tribe-matching request (Trading Post) ───────────────────────
  if (gpsData.requiresTradeSkills && plan.tribeRequirements?.length > 0) {
    try {
      await admin.from('tribe_requests').insert({
        user_id:      user.id,
        goal_id:      goal.id,
        skills_needed: plan.tribeRequirements,
        goal_title:   gpsData.goalTitle,
        status:       'open',
      });
    } catch { /* non-blocking */ }
  }

  // ── 6. Create mentor-matching request (Dreamline) ─────────────────────────
  try {
    await admin.from('mentor_requests').insert({
      user_id:        user.id,
      goal_id:        goal.id,
      category:       gpsData.category,
      mentor_profile: plan.mentorProfile,
      status:         'seeking',
    });
  } catch { /* non-blocking */ }

  // ── 7. Award village score for goal creation ──────────────────────────────
  try {
    await admin.rpc('award_village_score', {
      p_user_id:      user.id,
      p_points:       25,
      p_vlg:          10,
      p_reason:       'CREATE_GOAL_GPS',
      p_reference_id: goal.id,
    });
  } catch { /* non-blocking */ }

  // ── 8. Save Spirit memory about this goal ────────────────────────────────
  try {
    await admin.from('spirit_memories').insert({
      user_id:     user.id,
      content:     `Started goal: "${gpsData.goalTitle}". ${conversationSummary}`,
      memory_type: 'goal_created',
      importance:  8,
      metadata:    { goal_id: goal.id },
    });
  } catch { /* non-blocking */ }

  // ── 9. First-time checks ─────────────────────────────────────────────────
  const { count: goalCount } = await admin
    .from('goals').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

  return NextResponse.json({
    goalId:             goal.id,
    goalTitle:          goal.title,
    steps:              stepInserts,
    sprints:            plan.sprints ?? [],
    affiliateProducts,
    requiresFunding:    gpsData.requiresFunding,
    requiresTradeSkills: gpsData.requiresTradeSkills,
    isFirstGoal:        (goalCount ?? 1) <= 1,
    firstTimeFeatures: {
      needsTradingPostTour: gpsData.requiresTradeSkills,
      needsBudgetSetup:     gpsData.requiresFunding && (goalCount ?? 1) <= 1,
    },
  });
}
