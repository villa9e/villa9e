import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q   = searchParams.get('q') ?? 'skills tutorial';
  const max = searchParams.get('max') ?? '12';
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    // Return curated fallback videos for common skill topics
    return NextResponse.json(getFallback(q));
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=${max}&relevanceLanguage=en&videoDuration=medium&key=${key}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json(getFallback(q));
    const data = await res.json();
    const videos = (data.items ?? []).map((item: any) => ({
      id:        item.id.videoId,
      title:     item.snippet.title,
      channel:   item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      views:     '',
      duration:  '',
      published: item.snippet.publishedAt,
    }));
    return NextResponse.json(videos);
  } catch {
    return NextResponse.json(getFallback(q));
  }
}

function getFallback(q: string) {
  const topics = [
    { id: 'SzrETQdGzBM', title: 'How to Set SMART Goals That You Actually Achieve', channel: 'Thomas Frank', views: '2.1M' },
    { id: 'LYps5HMGvEs', title: 'The Secret to Building a Business From Scratch', channel: 'Y Combinator', views: '1.8M' },
    { id: 'mNeXuCYiE0U', title: 'Learn Graphic Design in 10 Minutes', channel: 'Envato Tuts+', views: '4.2M' },
    { id: 'qmNTJxHmPc4', title: 'How to Write a Business Plan', channel: 'Bplans.com', views: '892K' },
    { id: 'HAnw168huqA', title: 'Personal Finance 101: Everything You Need to Know', channel: 'Mark Tilbury', views: '3.1M' },
    { id: 'C2Zl_5gDNqY', title: 'How to Start a Record Label — Complete Guide', channel: 'Music Success Hub', views: '267K' },
  ];
  return topics.slice(0, 6).map(t => ({
    ...t,
    thumbnail: `https://img.youtube.com/vi/${t.id}/mqdefault.jpg`,
    duration: '12:00',
  }));
}
