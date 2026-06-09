'use client';
import { useState, useEffect } from 'react';

interface CuratedItem {
  id: string; source_type: string; source_url: string;
  title?: string; author_name?: string; thumbnail_url?: string;
  video_id?: string; created_at: string;
}

export default function CuratedFeedAdmin() {
  const [url, setUrl]         = useState('');
  const [items, setItems]     = useState<CuratedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus]   = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch('/api/admin/curated-feed');
    if (res.ok) { const d = await res.json(); setItems(d.items ?? []); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setStatus(null);
    try {
      const res = await fetch('/api/admin/curated-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ msg: `Added: ${data.item?.title ?? url}`, ok: true });
        setUrl(''); fetchItems();
      } else {
        setStatus({ msg: data.error ?? 'Failed', ok: false });
      }
    } catch { setStatus({ msg: 'Network error', ok: false }); }
    finally { setLoading(false); }
  }

  async function handleSeed() {
    setSeeding(true); setStatus(null);
    try {
      const res = await fetch('/api/admin/seed-feed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatus({ msg: `Seeded ${data.inserted} new videos (${data.goalQueriesRan} goal queries ran)`, ok: true });
        fetchItems();
      } else {
        setStatus({ msg: data.error ?? 'Seed failed', ok: false });
      }
    } catch { setStatus({ msg: 'Network error', ok: false }); }
    finally { setSeeding(false); }
  }

  async function handleRemove(id: string) {
    await fetch('/api/admin/curated-feed', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  }

  const SOURCE_COLOR: Record<string, string> = { tiktok: '#69C9D0', youtube: '#FF0000' };
  const ytCount = items.filter(i => i.source_type === 'youtube').length;
  const ttCount = items.filter(i => i.source_type === 'tiktok').length;

  return (
    <div style={{ minHeight: '100vh', background: '#080E24', padding: '24px 16px', paddingBottom: 120 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Curated Feed</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
          Auto-seeds from YouTube via goal context + 6 theme buckets. Daily cron at 3 AM. Run manually below.
        </p>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total', val: items.length, color: '#4D72FF' },
            { label: 'YouTube', val: ytCount, color: '#FF0000' },
            { label: 'TikTok', val: ttCount, color: '#69C9D0' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#0E1630', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Auto-seed button */}
        <button
          onClick={handleSeed} disabled={seeding}
          style={{ width: '100%', background: seeding ? 'rgba(77,114,255,0.4)' : '#4D72FF', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontWeight: 900, fontSize: 15, cursor: seeding ? 'default' : 'pointer', marginBottom: 16, letterSpacing: '0.02em' }}>
          {seeding ? 'Seeding YouTube…' : 'Auto-Seed from YouTube'}
        </button>

        {/* Manual URL add */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            value={url} onChange={e => setUrl(e.target.value)} disabled={loading}
            placeholder="Or paste a TikTok / YouTube URL manually…"
            style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <button type="submit" disabled={loading || !url.trim()}
            style={{ background: '#4D72FF', border: 'none', borderRadius: 12, padding: '12px 20px', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
            {loading ? '…' : '+ Add'}
          </button>
        </form>

        {status && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: status.ok ? 'rgba(29,158,117,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${status.ok ? 'rgba(29,158,117,0.4)' : 'rgba(239,68,68,0.4)'}`, color: status.ok ? '#1D9E75' : '#EF4444', fontSize: 13, fontWeight: 700 }}>
            {status.msg}
          </div>
        )}

        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No curated items yet. Hit Auto-Seed above.
            </div>
          )}
          {items.map(item => (
            <div key={item.id} style={{ background: '#0E1630', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.06em', color: SOURCE_COLOR[item.source_type] ?? '#fff', background: (SOURCE_COLOR[item.source_type] ?? '#fff') + '20', padding: '2px 7px', borderRadius: 6 }}>
                    {item.source_type.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title ?? 'Untitled'}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>@{item.author_name ?? '—'}</p>
              </div>
              <button onClick={() => handleRemove(item.id)}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 12px', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
