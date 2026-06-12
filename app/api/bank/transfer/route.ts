import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createServerClient() as any;
  const admin = createAdminClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { to_username, amount, note, speed = 'standard' } = await req.json();
  if (!to_username || !amount || amount <= 0) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const amountNum = parseFloat(amount);

  // Find sender's primary account
  const { data: senderAcct } = await admin.from('bank_accounts').select('*').eq('user_id', user.id).eq('is_primary', true).single();
  if (!senderAcct) return NextResponse.json({ error: 'No account found' }, { status: 404 });
  if ((senderAcct.balance ?? 0) < amountNum) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });

  // Find recipient
  const { data: recipient } = await admin.from('profiles').select('id, username, display_name').ilike('username', to_username).maybeSingle();
  if (!recipient) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const status = speed === 'instant' ? 'posted' : 'pending';
  const fee = speed === 'instant' ? 0.25 : 0;

  // Debit sender
  await admin.from('bank_transactions').insert({
    user_id: user.id, account_id: senderAcct.id,
    transaction_type: 'transfer', category: 'Transfer',
    merchant_name: `@${recipient.username}`, description: note || `Transfer to @${recipient.username}`,
    amount: amountNum + fee, direction: 'debit', status, method: speed === 'instant' ? 'rtp' : 'ach',
    recipient_user_id: recipient.id,
  });

  // Update sender balance
  await admin.from('bank_accounts').update({ balance: senderAcct.balance - amountNum - fee, available_balance: senderAcct.available_balance - amountNum - fee }).eq('id', senderAcct.id);

  // Credit recipient if they have a bank account
  const { data: recipientAcct } = await admin.from('bank_accounts').select('*').eq('user_id', recipient.id).eq('is_primary', true).maybeSingle();
  if (recipientAcct) {
    await admin.from('bank_transactions').insert({
      user_id: recipient.id, account_id: recipientAcct.id,
      transaction_type: 'transfer', category: 'Transfer',
      merchant_name: `@${(await admin.from('profiles').select('username').eq('id', user.id).single()).data?.username}`,
      description: note || 'Transfer received',
      amount: amountNum, direction: 'credit', status, method: speed === 'instant' ? 'rtp' : 'ach',
    });
    await admin.from('bank_accounts').update({ balance: recipientAcct.balance + amountNum, available_balance: recipientAcct.available_balance + amountNum }).eq('id', recipientAcct.id);
  }

  // Notify recipient
  try {
    await admin.from('notifications').insert({ user_id: recipient.id, type: 'message', title: 'Money received', body: `You received $${amountNum.toFixed(2)} from a Village member` });
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true, amount: amountNum, fee, status, recipient: recipient.username });
}
