import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, voice_id } = await req.json();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = voice_id || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah (calm, warm)

  if (!apiKey) return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 });

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text: text.slice(0, 2500), // Stay within free tier
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err.slice(0, 200) }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(audio.byteLength) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
