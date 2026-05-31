// Creator Studio — upload media to Cloudinary
// Accepts a multipart form with: file (Blob), type ('photo'|'video'), edit_state (JSON)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME  ?? 'dujx3efb7';
const API_KEY     = process.env.CLOUDINARY_API_KEY     ?? '936496726897399';
const API_SECRET  = process.env.CLOUDINARY_API_SECRET  ?? '8jAZMJNxMkZstZN37gHc7AyYwHk';

async function cloudinarySign(params: Record<string, string>) {
  const crypto = await import('crypto');
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha256').update(sorted + API_SECRET).digest('hex');
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const type = (form.get('type') as string) ?? 'video';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  // 200MB limit for video, 20MB for photos
  const limit = type === 'video' ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > limit) {
    return NextResponse.json({ error: `File too large (max ${type === 'video' ? '200MB' : '20MB'})` }, { status: 413 });
  }

  const timestamp  = String(Math.floor(Date.now() / 1000));
  const folder     = `villa9e/studio/${user.id}`;
  const resource   = type === 'video' ? 'video' : 'image';

  const params: Record<string, string> = { folder, timestamp };
  const signature = await cloudinarySign(params);

  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('api_key', API_KEY);
  uploadForm.append('timestamp', timestamp);
  uploadForm.append('folder', folder);
  uploadForm.append('signature', signature);

  // For videos, auto-generate thumbnail
  if (type === 'video') {
    uploadForm.append('eager', 'so_auto,f_jpg');
    uploadForm.append('eager_async', 'true');
  }

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource}/upload`,
      { method: 'POST', body: uploadForm }
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json({ error: data.error?.message ?? 'Upload failed' }, { status: 500 });
    }

    const thumbnailURL = type === 'video'
      ? data.url?.replace('/upload/', '/upload/so_auto,f_jpg,w_400/')
      : data.url;

    return NextResponse.json({
      url:         data.secure_url,
      cloudinaryId: data.public_id,
      thumbnail:   thumbnailURL,
      duration:    data.duration ?? null,
      width:       data.width,
      height:      data.height,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Upload error' }, { status: 500 });
  }
}
