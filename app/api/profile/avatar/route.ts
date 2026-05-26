import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate file type and size
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Must be an image' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });

  const fileExt = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Upload to Supabase Storage
  const bytes = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    // Fallback: if storage bucket doesn't exist, store via Cloudinary
    return NextResponse.json({ error: 'Upload failed — please set up Supabase storage bucket "avatars"' }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

  // Update profile
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

  return NextResponse.json({ url: publicUrl });
}
