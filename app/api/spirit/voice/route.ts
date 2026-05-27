import { NextRequest, NextResponse } from 'next/server';

const VOICE_IDS = {
  female: process.env.ELEVENLABS_VOICE_ID || 'G40NZ7BIc4PWMSVbe7MH',  // Spirit Female
  male:   'VJW9VaYW06JmSxg1TzmB',                                        // Spirit Male
};

// ── Detect message tone from content ──────────────────────────────────────
function detectTone(text: string): 'casual' | 'serious' | 'neutral' {
  const t = text.toLowerCase();
  const serious = [
    'struggle', 'struggling', 'hard time', 'difficult', 'lost', 'pain',
    'hurt', 'sad', 'depressed', 'anxiety', 'anxious', 'stress', 'stressed',
    'fail', 'failed', 'fear', 'afraid', 'alone', 'lonely', 'overwhelm',
    'breaking', "can't", 'cannot', 'hopeless', 'give up', 'quit', 'worth it',
  ];
  const casual = [
    'congrat', 'amazing', 'awesome', 'incredible', 'proud', 'nailed',
    'crushed', 'celebrate', 'love', 'great job', 'well done', 'fantastic',
    'excited', 'ready', 'let\'s go', 'let\'s do', 'haha', 'fun',
    'morning', 'afternoon', 'evening', 'check-in',
  ];

  if (serious.some(k => t.includes(k))) return 'serious';
  if (casual.some(k => t.includes(k))) return 'casual';
  return 'neutral';
}

// ── Add natural personality markers to text ───────────────────────────────
function addPersonality(text: string, tone: 'casual' | 'serious' | 'neutral'): string {
  if (tone !== 'casual') return text;

  // For casual/celebratory messages, occasionally add a warm laugh marker
  // that ElevenLabs will read naturally
  const laughMarkers = ['Ha! ', 'Haha, ', '(chuckles) ', ''];
  const marker = laughMarkers[Math.floor(Math.random() * laughMarkers.length)];

  // Only prepend laugh to shorter messages to avoid being overbearing
  if (text.length < 200 && marker) {
    return marker + text;
  }
  return text;
}

// ── ElevenLabs voice settings by tone ────────────────────────────────────
const VOICE_SETTINGS = {
  casual:  { stability: 0.28, similarity_boost: 0.72, style: 0.78, use_speaker_boost: true },
  serious: { stability: 0.72, similarity_boost: 0.88, style: 0.08, use_speaker_boost: true },
  neutral: { stability: 0.48, similarity_boost: 0.80, style: 0.38, use_speaker_boost: true },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, gender = 'female', tone: forcedTone } = body as {
    text: string;
    gender?: 'female' | 'male';
    tone?: 'casual' | 'serious' | 'neutral';
  };

  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 500 });

  const voiceId  = VOICE_IDS[gender] ?? VOICE_IDS.female;
  const tone     = forcedTone ?? detectTone(text);
  const enhanced = addPersonality(text.slice(0, 2500), tone);
  const settings = VOICE_SETTINGS[tone];

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method:  'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text:           enhanced,
        model_id:       'eleven_multilingual_v2',
        voice_settings: settings,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err.slice(0, 200) }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        'Content-Type':   'audio/mpeg',
        'Content-Length': String(audio.byteLength),
        'Cache-Control':  'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
