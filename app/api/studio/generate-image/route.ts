import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const IMGIX_API_KEY = process.env.IMGIX_API_KEY ?? 'ak_d68b2a09c90e0b2ca9122d51ada061ac6ab8fc142ae711431017645b470a7721';
const JSON2VIDEO_KEY = process.env.JSON2VIDEO_API_KEY ?? 'Vcws7ddPvXaCCdVsflcbrcdIF9BKAACRBfGSdN8I';

// Generate a content image card (post thumbnail, story card, etc.)
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, content } = await req.json();
  // type: 'quote' | 'milestone' | 'goal_card' | 'oowop_celebration'
  // content: { text, username, avatar_url, goal_title, metric, background }

  // Use imgix to compose image from a base template
  // imgix can apply text overlays, color filters, and transformations via URL params
  const imgixBase = `https://villa9e.imgix.net`;

  if (type === 'quote' || type === 'milestone') {
    // Build imgix URL with text overlay
    const bgColor = content.background ?? '1877F2';
    const text = encodeURIComponent(content.text ?? '');
    const sub = encodeURIComponent(content.username ?? '');

    // imgix txt overlay parameters
    const imageUrl = `${imgixBase}/templates/card-base.png?bg=${bgColor}&txt=${text}&txt-align=center,middle&txt-size=48&txt-color=ffffff&txt-font=Helvetica-Bold&txt64-align=center,bottom&txt64=${btoa(sub)}&txt64-color=ffffff80&txt64-size=24&w=1080&h=1080&fit=fillmax`;

    return NextResponse.json({ url: imageUrl, type: 'image' });
  }

  if (type === 'goal_card') {
    const params = new URLSearchParams({
      'txt': content.goal_title ?? 'My Goal',
      'txt-size': '40',
      'txt-color': 'ffffff',
      'txt-align': 'center,middle',
      'txt-font': 'Helvetica-Bold',
      'w': '1080',
      'h': '1920',
      'bg': '1877F2',
      'fit': 'fillmax',
    });

    const imageUrl = `${imgixBase}/templates/goal-card.png?${params.toString()}`;
    return NextResponse.json({ url: imageUrl, type: 'image' });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
