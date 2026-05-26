import { NextRequest, NextResponse } from 'next/server';

const MOOD_PARAMS: Record<string, { valence: number; energy: number; acousticness: number; tempo: number }> = {
  great:   { valence: 0.8, energy: 0.7, acousticness: 0.2, tempo: 120 },
  good:    { valence: 0.6, energy: 0.5, acousticness: 0.4, tempo: 100 },
  neutral: { valence: 0.5, energy: 0.4, acousticness: 0.5, tempo: 90 },
  low:     { valence: 0.3, energy: 0.3, acousticness: 0.7, tempo: 75 },
  very_low:{ valence: 0.15, energy: 0.15, acousticness: 0.9, tempo: 60 },
};

// Curated fallback playlists per mood (publicly embeddable Spotify playlists)
const FALLBACK_PLAYLISTS: Record<string, { name: string; url: string; embed: string }> = {
  great:    { name: 'High Energy Motivation', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP', embed: '37i9dQZF1DX76Wlfdnj7AP' },
  good:     { name: 'Feel Good Vibes', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0', embed: '37i9dQZF1DX3rxVfibe1L0' },
  neutral:  { name: 'Focus Flow', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', embed: '37i9dQZF1DWZeKCadgRdKQ' },
  low:      { name: 'Calm & Restore', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY', embed: '37i9dQZF1DX3Ogo9pFvBkY' },
  very_low: { name: 'Deep Sleep & Rest', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp', embed: '37i9dQZF1DWZd79rJ6a7lp' },
};

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood') ?? 'neutral';
  const params = MOOD_PARAMS[mood] ?? MOOD_PARAMS.neutral;
  const fallback = FALLBACK_PLAYLISTS[mood] ?? FALLBACK_PLAYLISTS.neutral;

  const token = await getSpotifyToken();

  if (!token) {
    // Return embeddable playlist as fallback
    return NextResponse.json({ type: 'playlist', ...fallback, mood });
  }

  try {
    // Get recommendations based on mood audio features
    const res = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_genres=ambient,chill,focus&target_valence=${params.valence}&target_energy=${params.energy}&target_acousticness=${params.acousticness}&target_tempo=${params.tempo}&limit=10`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!res.ok) return NextResponse.json({ type: 'playlist', ...fallback, mood });
    const data = await res.json();

    const tracks = (data.tracks ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name ?? '',
      album: t.album?.name ?? '',
      image: t.album?.images?.[1]?.url ?? '',
      preview_url: t.preview_url,
      spotify_url: t.external_urls?.spotify ?? '',
      duration_ms: t.duration_ms,
    }));

    return NextResponse.json({ type: 'tracks', tracks, mood });
  } catch {
    return NextResponse.json({ type: 'playlist', ...fallback, mood });
  }
}
