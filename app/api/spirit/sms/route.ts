import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { callSpirit } from '@/lib/claude/spirit';

// Handles inbound SMS to the Twilio number — Spirit responds via SMS
export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const from    = params.get('From') ?? '';
  const msgBody = params.get('Body') ?? '';

  const admin = createAdminClient();

  // Find the user by phone number
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('id, username, display_name')
    .eq('phone_number', from)
    .single();

  let replyText: string;

  if (!profile) {
    replyText = `Hey! I'm Spirit, your AI guide from villa9e. Sign up at villa9e.app to unlock your full village experience. 🌀`;
  } else {
    try {
      const { text } = await callSpirit(
        profile.id,
        `[SMS from ${from}]: ${msgBody}`
      );
      replyText = text.slice(0, 1600); // SMS limit
    } catch {
      replyText = `Spirit here. I received your message but hit a snag. Open the app to chat with me directly. 🌀 villa9e.app`;
    }
  }

  // Respond with TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Message>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
