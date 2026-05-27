import { NextRequest, NextResponse } from 'next/server';

// Handles inbound voice calls — Spirit greets and redirects to app
export async function POST(req: NextRequest) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" rate="95%">
    Hello, this is Spirit — your AI guide from villa9e.
    I work best through text and the app.
    Send me an SMS or open villa9e dot app to chat with me directly.
    Have a great day, Villager.
  </Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
