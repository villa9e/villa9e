import { NextRequest, NextResponse } from 'next/server';

const JSON2VIDEO_KEY = process.env.JSON2VIDEO_API_KEY ?? 'Vcws7ddPvXaCCdVsflcbrcdIF9BKAACRBfGSdN8I';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get('id');
  if (!movieId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const res = await fetch(`https://api.json2video.com/v2/movies?project=${movieId}`, {
    headers: { 'x-api-key': JSON2VIDEO_KEY },
  });

  if (!res.ok) return NextResponse.json({ error: 'Status check failed' }, { status: 500 });

  const data = await res.json();
  const movie = data.movie ?? {};

  return NextResponse.json({
    status: movie.status ?? 'processing',
    url: movie.url ?? null,
    download_url: movie.url ?? null,
    thumbnail: movie.poster ?? null,
    duration: movie.duration ?? null,
  });
}
