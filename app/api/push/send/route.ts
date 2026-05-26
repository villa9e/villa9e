import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId  = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!apiKey || !appId) {
    return NextResponse.json({ ok: false, reason: 'OneSignal not configured' });
  }

  const { external_user_ids, title, body, url, data } = await req.json();
  if (!external_user_ids?.length || !title || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payload: Record<string, any> = {
    app_id: appId,
    include_external_user_ids: external_user_ids,
    headings: { en: title },
    contents: { en: body },
    url: url ?? 'https://villa9e.app/notifications',
    data: data ?? {},
  };

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  return NextResponse.json({ ok: res.ok, result });
}
