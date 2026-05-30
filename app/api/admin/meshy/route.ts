import { NextRequest, NextResponse } from 'next/server';

const MESHY_BASE = 'https://api.meshy.ai';
const KEY = process.env.MESHY_API_KEY;

// POST — submit a text-to-3D task (tries v2, falls back to v1)
export async function POST(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'MESHY_API_KEY not set' }, { status: 500 });

  const { prompt, negative_prompt, style } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const body = {
    mode: 'preview',
    prompt,
    negative_prompt: negative_prompt || 'low quality, noisy, blurry',
    art_style: style || 'realistic',
    should_remesh: true,
  };

  // Try v2 first, then v1
  for (const ver of ['v2', 'v1']) {
    const res = await fetch(`${MESHY_BASE}/${ver}/text-to-3d`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && (data.result || data.id)) {
      return NextResponse.json({ result: data.result ?? data.id, version: ver }, { status: 200 });
    }
    if (ver === 'v1') return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ error: 'unknown' }, { status: 500 });
}

// GET — poll task status
export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'MESHY_API_KEY not set' }, { status: 500 });

  const task_id = req.nextUrl.searchParams.get('task_id');
  const ver     = req.nextUrl.searchParams.get('ver') ?? 'v2';
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 });

  // Try requested version, then fallback
  for (const v of [ver, ver === 'v2' ? 'v1' : 'v2']) {
    const res = await fetch(`${MESHY_BASE}/${v}/text-to-3d/${task_id}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    if (res.ok) return NextResponse.json({ ...(await res.json()), _ver: v });
  }
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}
