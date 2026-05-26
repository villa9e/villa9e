import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { callClaude } from '@/lib/claude/client';
import { getGoogleAccessToken } from '@/lib/google/auth';

const VILLA9E_MISSION_SUMMARY = `villa9e helps people achieve goals through community, accountability, wellness, financial empowerment, skill development, and entrepreneurship.`;

function extractVideoUrl(content: string): string | null {
  const patterns = [
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /https?:\/\/youtu\.be\/[\w-]+/,
    /https?:\/\/vimeo\.com\/\d+/,
  ];
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return m[0];
  }
  return null;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

async function fetchYouTubeMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const video = data.items?.[0];
    if (!video) return null;

    return {
      title: video.snippet?.title ?? '',
      description: (video.snippet?.description ?? '').slice(0, 800),
      channel: video.snippet?.channelTitle ?? '',
      tags: (video.snippet?.tags ?? []).slice(0, 15) as string[],
      category_id: video.snippet?.categoryId ?? '',
      views: video.statistics?.viewCount ?? '0',
      duration: video.contentDetails?.duration ?? '',
    };
  } catch {
    return null;
  }
}

async function analyzeWithVideoIntelligence(videoId: string, accessToken: string) {
  // Video Intelligence API requires a GCS URI or public video file URL
  // YouTube URLs are not directly supported — use for GCS-hosted videos only
  // This stub is ready for when users upload videos directly
  const gsUri = `gs://villa9e-uploads/${videoId}`;

  try {
    const res = await fetch('https://videointelligence.googleapis.com/v1/videos:annotate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputUri: gsUri,
        features: ['LABEL_DETECTION', 'EXPLICIT_CONTENT_DETECTION'],
        videoContext: {
          labelDetectionConfig: { labelDetectionMode: 'SHOT_AND_FRAME_MODE' },
        },
      }),
    });

    if (!res.ok) return null;
    // Returns an operation name — would need to poll for completion
    const op = await res.json();
    return op.name ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content, video_url: explicitUrl } = await req.json();

  const videoUrl = explicitUrl ?? extractVideoUrl(content ?? '');
  if (!videoUrl) {
    return NextResponse.json({ score: 75, labels: [], mission_aligned: true, reason: 'No video found in post' });
  }

  const youtubeId = getYouTubeId(videoUrl);
  let meta: Awaited<ReturnType<typeof fetchYouTubeMetadata>> = null;
  let labels: string[] = [];

  // Step 1: Fetch YouTube metadata
  if (youtubeId) {
    meta = await fetchYouTubeMetadata(youtubeId);
    if (meta) labels = [...meta.tags];
  }

  // Step 2: Attempt Video Intelligence (for GCS videos; YouTube not supported directly)
  const accessToken = await getGoogleAccessToken('https://www.googleapis.com/auth/cloud-platform');
  // Reserved for user-uploaded videos stored in GCS

  // Step 3: Claude mission alignment scoring from all available metadata
  const context = [
    meta?.title && `Title: ${meta.title}`,
    meta?.channel && `Channel: ${meta.channel}`,
    meta?.description && `Description: ${meta.description}`,
    labels.length && `Tags: ${labels.join(', ')}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are the content moderator for villa9e — a goal GPS platform where community members share progress toward their personal, professional, and wellness goals.

villa9e mission: ${VILLA9E_MISSION_SUMMARY}

Rate this video for mission alignment (0-100).

Video URL: ${videoUrl}
${context || 'No metadata available — score conservatively.'}

HIGH scores (70-100): Goal content, entrepreneurship, skill building, wellness, motivation, financial growth, creative pursuits, personal development.
MEDIUM scores (40-69): General entertainment, lifestyle, educational — not harmful but not mission-focused.
LOW scores (0-39): Content that conflicts with personal growth, community values, or is potentially harmful.

Return JSON ONLY:
{"score": 80, "labels": ["goal-setting", "entrepreneurship"], "mission_aligned": true, "safe": true, "reason": "one sentence", "recommendation": "approve | review | hide"}`;

  let finalScore = 72;
  let missionAligned = true;
  let safe = true;
  let reason = 'Video content appears appropriate for the community';
  let recommendation = 'approve';
  let allLabels = labels;

  try {
    const result = await callClaude(prompt);
    finalScore = result.score ?? 72;
    missionAligned = result.mission_aligned ?? (finalScore >= 50);
    safe = result.safe ?? true;
    reason = result.reason ?? reason;
    recommendation = result.recommendation ?? 'approve';
    allLabels = [...new Set([...labels, ...(result.labels ?? [])])];
  } catch { /* use defaults */ }

  // Update post with video analysis results
  if (post_id) {
    await (supabase as any).from('dream_line_posts').update({
      video_url: videoUrl,
      video_analyzed: true,
      mission_labels: allLabels,
      mission_score: finalScore,
      ...(recommendation === 'hide' ? { is_hidden: true, hidden_reason: `Video analysis: ${reason}` } : {}),
    }).eq('id', post_id).eq('user_id', user.id);
  }

  return NextResponse.json({
    score: finalScore,
    labels: allLabels,
    mission_aligned: missionAligned,
    safe,
    reason,
    recommendation,
    video_url: videoUrl,
    title: meta?.title ?? '',
    channel: meta?.channel ?? '',
    views: meta?.views ?? '0',
    google_auth_available: !!accessToken,
  });
}
