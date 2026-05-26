import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-time admin setup endpoint
// Protected by setup secret to prevent unauthorized access
const SETUP_SECRET = process.env.CRON_SECRET ?? '';

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const ADMIN_EMAIL = 'admin@villa9e.app';
  const ADMIN_PASSWORD = 'Jupiter2433!';

  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    // Update password
    await supabaseAdmin.auth.admin.updateUserById(userId, { password: ADMIN_PASSWORD });
  } else {
    // Create user
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { username: 'villa9e_admin', full_name: 'Villa9e Admin' },
    });

    if (error) {
      // If trigger fails, try to create user with skip DB trigger workaround
      // by inserting directly into profile after
      return NextResponse.json({ error: error.message, step: 'create_user' }, { status: 500 });
    }
    userId = created.user.id;
  }

  // Ensure profile exists and is super admin
  const { error: profileError } = await (supabaseAdmin as any)
    .from('profiles')
    .upsert({
      id: userId,
      username: 'villa9e_admin',
      display_name: 'Villa9e Admin',
      onboarding_complete: true,
      is_super_admin: true,
      email_verified: true,
    }, { onConflict: 'id' });

  if (profileError) {
    return NextResponse.json({ error: profileError.message, step: 'profile_upsert' }, { status: 500 });
  }

  // Ensure supporting rows exist
  await (supabaseAdmin as any).from('village_wallets').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  await (supabaseAdmin as any).from('hut_configs').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  await (supabaseAdmin as any).from('spirit_configs').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  await (supabaseAdmin as any).from('data_locker_settings').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });
  await (supabaseAdmin as any).from('user_xp').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

  return NextResponse.json({
    ok: true,
    message: 'Admin user created/updated successfully',
    email: ADMIN_EMAIL,
    userId,
  });
}
