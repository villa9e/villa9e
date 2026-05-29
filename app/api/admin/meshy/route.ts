import { NextRequest, NextResponse } from 'next/server';

const MESHY_API = 'https://api.meshy.ai/v1';
const KEY = process.env.MESHY_API_KEY;

// POST  /api/admin/meshy  — submit a text-to-3D task
// GET   /api/admin/meshy?task_id=xxx — poll task status
export async function POST(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'MESHY_API_KEY not configured' }, { status: 500 });

  const { prompt, negative_prompt, style } = await req.json();
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const res = await fetch(`${MESHY_API}/text-to-3d`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      negative_prompt: negative_prompt || 'low quality, noisy, ugly',
      art_style: style || 'realistic',
      should_remesh: true,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'MESHY_API_KEY not configured' }, { status: 500 });

  const task_id = req.nextUrl.searchParams.get('task_id');
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 });

  const res = await fetch(`${MESHY_API}/text-to-3d/${task_id}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
