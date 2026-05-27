import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const JSON2VIDEO_KEY = process.env.JSON2VIDEO_API_KEY ?? 'Vcws7ddPvXaCCdVsflcbrcdIF9BKAACRBfGSdN8I';

// Generate a short video using JSON2Video API
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { template, content, template_id } = await req.json();

  // If template is a full JSON2Video payload object (from videoTemplates.ts), use directly
  if (template && typeof template === 'object' && template.scenes) {
    try {
      const res = await fetch('https://api.json2video.com/v2/movies', {
        method: 'POST',
        headers: { 'x-api-key': JSON2VIDEO_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: 'Video generation failed', details: err.slice(0, 300) }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json({ movie_id: data.movie, id: data.movie, status: 'processing' });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // String template name — build from content fields
  const duration = Math.min(content?.duration ?? 15, 60);
  const bgColor = '#1877F2';
  const textColor = '#FFFFFF';

  // Build JSON2Video project
  const scenes: any[] = [];

  if (template === 'goal_progress') {
    scenes.push({
      duration: duration,
      elements: [
        { type: 'shape', color: bgColor, width: '100%', height: '100%' },
        {
          type: 'text',
          text: '⛺ villa9e',
          font: { size: 24, color: '#FFFFFF80', weight: 'bold' },
          x: 'center', y: '5%',
        },
        {
          type: 'text',
          text: content.goal_title ?? 'My Goal',
          font: { size: 48, color: textColor, weight: 'bold' },
          x: 'center', y: 'center',
          animation: { name: 'fadeIn', duration: 0.5 },
        },
        {
          type: 'text',
          text: `${content.metric ?? '0'}% complete`,
          font: { size: 32, color: '#FFD700', weight: 'bold' },
          x: 'center', y: '65%',
          animation: { name: 'slideIn', duration: 0.5, delay: 0.3 },
        },
        {
          type: 'text',
          text: `@${content.username ?? 'villager'}`,
          font: { size: 22, color: '#FFFFFF80' },
          x: 'center', y: '85%',
        },
      ],
    });
  } else if (template === 'oowop_celebration') {
    scenes.push({
      duration: duration,
      elements: [
        { type: 'shape', color: '#0A0A0A', width: '100%', height: '100%' },
        {
          type: 'text', text: '✊',
          font: { size: 120 }, x: 'center', y: '35%',
          animation: { name: 'pulse', duration: 0.5, loop: true },
        },
        {
          type: 'text', text: 'Step Validated!',
          font: { size: 52, color: '#FFD700', weight: 'bold' },
          x: 'center', y: '60%',
          animation: { name: 'fadeIn', duration: 0.5, delay: 0.5 },
        },
        {
          type: 'text', text: 'The village believes in you',
          font: { size: 26, color: '#FFFFFF' },
          x: 'center', y: '72%',
          animation: { name: 'fadeIn', duration: 0.5, delay: 1 },
        },
      ],
    });
  } else {
    // Default quote reel
    scenes.push({
      duration: duration,
      elements: [
        { type: 'shape', color: bgColor, width: '100%', height: '100%' },
        {
          type: 'text', text: content.text ?? 'It takes a village.',
          font: { size: 44, color: textColor, weight: 'bold' },
          x: 'center', y: 'center',
          animation: { name: 'fadeIn', duration: 0.8 },
        },
        {
          type: 'text', text: `@${content.username ?? 'villager'} on villa9e`,
          font: { size: 20, color: '#FFFFFF60' },
          x: 'center', y: '80%',
        },
      ],
    });
  }

  try {
    const res = await fetch('https://api.json2video.com/v2/movies', {
      method: 'POST',
      headers: {
        'x-api-key': JSON2VIDEO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resolution: 'instagram-story',
        quality: 'high',
        draft: false,
        scenes,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Video generation failed', details: err.slice(0, 200) }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({
      movie_id: data.movie,
      status: 'processing',
      message: 'Video is being generated. Check status with GET /api/studio/video-status?id=<movie_id>',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
