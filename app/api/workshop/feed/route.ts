import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Load user's active goals (for feed personalization) ─────────────────────
  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, category, progress_percentage')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  // ── Load active sprint + current action ──────────────────────────────────────
  const { data: activeSprint } = await supabase
    .from('sprints')
    .select('id, title, sprint_actions(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let activeAction: {
    sprintNum: number;
    actionNum: number;
    actionTotal: number;
    title: string;
    keyword: string;
  } | null = null;

  if (activeSprint) {
    const actions: any[] = activeSprint.sprint_actions ?? [];
    const pending = actions
      .filter((a: any) => !a.completed)
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

    const currentAction = pending[0] ?? null;
    if (currentAction) {
      activeAction = {
        sprintNum:   1,
        actionNum:   actions.indexOf(currentAction) + 1,
        actionTotal: actions.length,
        title:       currentAction.title,
        keyword:     currentAction.title,
      };
    }
  }

  // ── Fetch goal_templates (public, sorted by clone_count) ─────────────────────
  const { data: templates } = await supabase
    .from('goal_templates')
    .select('id, title, category, description, clone_count, thumbnail_url')
    .eq('is_public', true)
    .order('clone_count', { ascending: false })
    .limit(10);

  // ── Fetch studio_videos (published, sorted by watch_count) ───────────────────
  const { data: studioVideos } = await supabase
    .from('studio_videos')
    .select('id, title, thumbnail_url, watch_count, duration, user_id, profiles(username, avatar_url)')
    .eq('is_published', true)
    .order('watch_count', { ascending: false })
    .limit(8);

  // ── Fetch YouTube action-content ──────────────────────────────────────────────
  const actionKeyword = activeAction?.keyword ?? (goals?.[0]?.title ?? 'skills tutorial');
  let youtubeVideos: any[] = [];

  try {
    const ytRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/youtube/search?q=${encodeURIComponent(actionKeyword + ' how to')}&max=6`,
      { cache: 'no-store' }
    );
    if (ytRes.ok) {
      youtubeVideos = await ytRes.json();
    }
  } catch {
    // non-blocking — fallback to empty
  }

  // ── Build ordered feed array ──────────────────────────────────────────────────
  // Spec: first card = YouTube video matched to current sprint action,
  // then mix of templates/goals/videos

  const cards: any[] = [];

  // Card 1: hero video matched to current action (if available)
  if (youtubeVideos.length > 0 && activeAction) {
    cards.push({
      type:    'video_hero',
      source:  'youtube',
      id:      youtubeVideos[0].id,
      title:   youtubeVideos[0].title,
      channel: youtubeVideos[0].channel,
      thumbnail: youtubeVideos[0].thumbnail,
      matchedAction: activeAction.title,
    });
  }

  // Interleave: template, studio video, youtube, template, …
  const tplList  = templates   ?? [];
  const svList   = studioVideos ?? [];
  const ytList   = youtubeVideos.slice(1); // skip the hero video

  const maxLen = Math.max(tplList.length, svList.length, ytList.length);
  for (let i = 0; i < maxLen; i++) {
    if (tplList[i]) {
      cards.push({ type: 'goal_template', ...tplList[i] });
    }
    if (svList[i]) {
      cards.push({
        type:      'studio_video',
        source:    'studio',
        id:        svList[i].id,
        title:     svList[i].title,
        thumbnail: svList[i].thumbnail_url,
        watchCount: svList[i].watch_count,
        author:    svList[i].profiles,
      });
    }
    if (ytList[i]) {
      cards.push({
        type:    'video',
        source:  'youtube',
        id:      ytList[i].id,
        title:   ytList[i].title,
        channel: ytList[i].channel,
        thumbnail: ytList[i].thumbnail,
      });
    }
  }

  // Append goal cards at the end if user has active goals
  for (const goal of (goals ?? [])) {
    cards.push({
      type:     'active_goal',
      id:       goal.id,
      title:    goal.title,
      category: goal.category,
      progress: goal.progress_percentage,
    });
  }

  return NextResponse.json({
    cards,
    activeAction: activeAction
      ? {
          sprintNum:   activeAction.sprintNum,
          actionNum:   activeAction.actionNum,
          actionTotal: activeAction.actionTotal,
          title:       activeAction.title,
        }
      : null,
  });
}
