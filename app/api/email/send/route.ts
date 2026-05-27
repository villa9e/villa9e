import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { EMAIL_TEMPLATES } from '@/lib/email/templates';

type EmailType = 'welcome' | 'goalComplete' | 'weeklyDigest' | 'tribeActivity' | 'bookingConfirm' | 'sprintStart';

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, data: payload, to } = await req.json() as { type: EmailType; data: any; to?: string };

  // Fetch user email if not provided
  const recipientEmail = to ?? user.email;
  if (!recipientEmail) return NextResponse.json({ error: 'No email address' }, { status: 400 });

  let template: { subject: string; html: string } | null = null;

  switch (type) {
    case 'welcome':
      template = EMAIL_TEMPLATES.welcome(payload);
      break;
    case 'goalComplete':
      template = EMAIL_TEMPLATES.goalComplete(payload);
      break;
    case 'weeklyDigest':
      template = EMAIL_TEMPLATES.weeklyDigest(payload);
      break;
    case 'tribeActivity':
      template = EMAIL_TEMPLATES.tribeActivity(payload);
      break;
    case 'bookingConfirm':
      template = EMAIL_TEMPLATES.bookingConfirm(payload);
      break;
    case 'sprintStart':
      template = EMAIL_TEMPLATES.sprintStart(payload);
      break;
    default:
      return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
  }

  const result = await sendEmail(recipientEmail, template.subject, template.html);
  return NextResponse.json(result);
}
