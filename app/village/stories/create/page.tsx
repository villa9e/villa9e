'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Post {
  id: string;
  media_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
}

export default function StoryCreatePage() {
  const router = useRouter();
  const [posts, setPosts]         = useState<Post[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [textOverlay, setTextOverlay] = useState('');
  const [mode, setMode]           = useState<'select' | 'upload'>('select');
  const [loading, setLoading]     = useState(false);
  const [posted, setPosted]       = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      // Load from dream_line_posts (primary) with media; fallback includes posts without media for text cards
      const { data } = await (supabase as any)
        .from('dream_line_posts')
        .select('id, media_url, thumbnail_url, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      // Map dream_line_posts shape to Post interface
      const mapped = (data ?? []).map((p: any) => ({
        id: p.id,
        media_url: p.media_url ?? null,
        thumbnail_url: p.thumbnail_url ?? null,
        caption: p.content ?? null,
        created_at: p.created_at,
      }));
      setPosts(mapped);
    });
  }, []);

  async function handlePost() {
    if (!selected && !uploadUrl) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        text_overlay: textOverlay || undefined,
      };
      if (selected) {
        payload.post_id = selected;
      } else {
        payload.media_url = uploadUrl;
        payload.media_type = mediaType;
      }
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPosted(true);
        setTimeout(() => router.push('/village/dreamline'), 1200);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    // Upload to 'stories' bucket (falls back to 'media' if stories bucket not configured)
    const storiesUpload = await (supabase as any).storage.from('stories').upload(path, file);
    let finalPath: string | null = null;
    let bucketName = 'stories';
    if (storiesUpload.error) {
      // Fallback to media bucket
      const fallback = await (supabase as any).storage.from('media').upload(`stories/${path}`, file);
      if (!fallback.error) {
        finalPath = `stories/${path}`;
        bucketName = 'media';
      }
    } else {
      finalPath = path;
    }
    if (finalPath) {
      const { data } = (supabase as any).storage.from(bucketName).getPublicUrl(finalPath);
      setUploadUrl(data.publicUrl);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      setSelected(null);
    }
  }

  if (posted) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth={2.5} strokeLinecap="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Story posted!</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#080E24', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        <h1 style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: 0 }}>Add to Story</h1>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: '20px 16px 120px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 }}>
          {(['select', 'upload'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: mode === m ? '#2952E8' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {m === 'select' ? 'From Posts' : 'Upload New'}
            </button>
          ))}
        </div>

        {mode === 'select' && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Choose from your content</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {posts.map(p => (
                <div key={p.id} onClick={() => { setSelected(p.id); setUploadUrl(''); }}
                  style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: selected === p.id ? '3px solid #2952E8' : '3px solid transparent', position: 'relative' }}>
                  {p.thumbnail_url || p.media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail_url ?? p.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(41,82,232,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 1.4, textAlign: 'center', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {p.caption ?? 'Text post'}
                      </span>
                    </div>
                  )}
                  {selected === p.id && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, background: '#2952E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No DreamLine posts yet — share one first
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'upload' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {!uploadUrl ? (
              <button onClick={() => fileRef.current?.click()}
                style={{ width: '100%', aspectRatio: '1', borderRadius: 16, border: '2px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(255,255,255,0.4)' }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Tap to upload photo or video</span>
              </button>
            ) : (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '1' }}>
                {mediaType === 'video' ? (
                  <video src={uploadUrl} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={uploadUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <button onClick={() => { setUploadUrl(''); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text overlay */}
        <div style={{ marginTop: 20 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' }}>Text overlay (optional)</label>
          <input
            value={textOverlay}
            onChange={e => setTextOverlay(e.target.value)}
            placeholder="Add text to your story..."
            maxLength={100}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Post button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))', background: 'rgba(8,14,36,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handlePost}
          disabled={loading || (!selected && !uploadUrl)}
          style={{ width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 15, color: '#fff', background: (!selected && !uploadUrl) ? 'rgba(41,82,232,0.3)' : '#2952E8', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Posting…' : 'Post as Story'}
        </button>
      </div>
    </div>
  );
}
