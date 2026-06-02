'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';

// ─── Types ────────────────────────────────────────────────────────────────────
type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: '400' | '700' | '900';
  align: 'left' | 'center' | 'right';
};

type AudioTrack = { id: string; name: string; duration: string; category: string };
type ActiveTool = 'text' | 'audio' | 'captions' | 'trim' | null;
type StudioTab  = 'create' | 'tips' | 'affiliates' | 'my-content';
type AR         = '9:16' | '1:1' | '16:9';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_DIMS: Record<AR, { w: number; h: number }> = {
  '9:16': { w: 252, h: 448 },
  '1:1':  { w: 330, h: 330 },
  '16:9': { w: 360, h: 202 },
};

const BG_PRESETS = [
  'var(--v-bg)',
  'linear-gradient(135deg,#4C1D95,#7C3AED)',
  'linear-gradient(135deg,#1E3A5F,#1877F2)',
  'linear-gradient(135deg,#052E16,#059669)',
  'linear-gradient(135deg,#78350F,#D97706)',
  'linear-gradient(135deg,#881337,#F43F5E)',
];

const TEXT_COLORS = ['#FFFFFF', '#F59E0B', '#34D399', '#60A5FA', '#F472B6', '#1a1a1a'];

const AUDIO_LIBRARY: Record<string, AudioTrack[]> = {
  Hype:  [
    { id: 'h1', name: 'Power Up',   duration: '2:34', category: 'Hype' },
    { id: 'h2', name: 'Champions',  duration: '3:12', category: 'Hype' },
    { id: 'h3', name: 'Rise Up',    duration: '2:58', category: 'Hype' },
  ],
  Focus: [
    { id: 'f1', name: 'Deep Work',  duration: '4:20', category: 'Focus' },
    { id: 'f2', name: 'Flow State', duration: '3:45', category: 'Focus' },
    { id: 'f3', name: 'Clarity',    duration: '5:00', category: 'Focus' },
  ],
  Calm:  [
    { id: 'c1', name: 'Morning Ritual', duration: '3:30', category: 'Calm' },
    { id: 'c2', name: 'Mindful Space',  duration: '4:15', category: 'Calm' },
    { id: 'c3', name: 'Serenity',       duration: '6:00', category: 'Calm' },
  ],
  Vibe:  [
    { id: 'v1', name: 'Community', duration: '2:48', category: 'Vibe' },
    { id: 'v2', name: 'Together',  duration: '3:20', category: 'Vibe' },
    { id: 'v3', name: 'Grateful',  duration: '3:55', category: 'Vibe' },
  ],
};

function uid() { return Math.random().toString(36).slice(2, 9); }

const ACCENT = '#7C3AED';

// ─── Single draggable text layer on canvas ───────────────────────────────────
function DraggableText({
  layer, dims, selected, onSelect, onMoved,
}: {
  layer: TextLayer;
  dims: { w: number; h: number };
  selected: boolean;
  onSelect: () => void;
  onMoved: (x: number, y: number) => void;
}) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <motion.div
      key={resetKey}
      drag
      dragConstraints={{
        left:   -layer.x,
        right:  dims.w - layer.x - 8,
        top:    -layer.y,
        bottom: dims.h - layer.y - 8,
      }}
      dragMomentum={false}
      dragElastic={0}
      onTap={onSelect}
      onDragEnd={(_, info) => {
        onMoved(
          Math.max(0, Math.min(dims.w - 8, layer.x + info.offset.x)),
          Math.max(0, Math.min(dims.h - 8, layer.y + info.offset.y)),
        );
        setResetKey(k => k + 1);
      }}
      style={{
        position: 'absolute',
        top: layer.y,
        left: layer.x,
        cursor: 'grab',
        touchAction: 'none',
        outline: selected ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
        outlineOffset: 4,
        borderRadius: 4,
        padding: '2px 4px',
        maxWidth: dims.w - layer.x - 4,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <p style={{
        color: layer.color,
        fontSize: layer.fontSize,
        fontWeight: parseInt(layer.fontWeight) as any,
        textAlign: layer.align,
        lineHeight: 1.25,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textShadow: '0 1px 8px rgba(0,0,0,0.7)',
        margin: 0,
        pointerEvents: 'none',
      }}>
        {layer.text || '…'}
      </p>
    </motion.div>
  );
}

// ─── Canvas preview ───────────────────────────────────────────────────────────
function EditorCanvas({
  ratio, bg, layers, selectedId, captions, audio,
  onSelectLayer, onLayerMoved, onDeselectAll,
}: {
  ratio: AR;
  bg: string;
  layers: TextLayer[];
  selectedId: string | null;
  captions: string;
  audio: AudioTrack | null;
  onSelectLayer: (id: string) => void;
  onLayerMoved: (id: string, x: number, y: number) => void;
  onDeselectAll: () => void;
}) {
  const dims = CANVAS_DIMS[ratio];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <div
        onClick={e => { if (e.target === e.currentTarget) onDeselectAll(); }}
        style={{
          position: 'relative',
          width: dims.w,
          height: dims.h,
          background: bg,
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 10px 48px rgba(0,0,0,0.6)',
          flexShrink: 0,
        }}
      >
        {/* Scanline texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px)',
        }} />

        {/* Text layers */}
        {layers.map(layer => (
          <DraggableText
            key={layer.id}
            layer={layer}
            dims={dims}
            selected={selectedId === layer.id}
            onSelect={() => onSelectLayer(layer.id)}
            onMoved={(x, y) => onLayerMoved(layer.id, x, y)}
          />
        ))}

        {/* Captions bar */}
        {captions.trim() && (
          <div style={{
            position: 'absolute', bottom: 28, left: 8, right: 8,
            background: 'rgba(0,0,0,0.72)', borderRadius: 8,
            padding: '5px 10px',
          }}>
            <p style={{
              color: '#fff', fontSize: 11, fontWeight: 700,
              textAlign: 'center', margin: 0, lineHeight: 1.4,
            }}>
              {captions.split('\n').filter(Boolean)[0]}
            </p>
          </div>
        )}

        {/* Audio now-playing badge */}
        {audio && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.65)', borderRadius: 20,
            padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{ width: 6, height: 6, borderRadius: 3, background: '#34D399', flexShrink: 0 }}
            />
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{audio.name}</span>
          </div>
        )}

        {/* Brand bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.5)', padding: '4px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700 }}>villa9e</span>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: 5, height: 5, borderRadius: 3, background: '#EF4444' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Text tool panel ──────────────────────────────────────────────────────────
function TextPanel({
  layer, onChange, onDelete, onAdd,
}: {
  layer: TextLayer | null;
  onChange: (patch: Partial<TextLayer>) => void;
  onDelete: () => void;
  onAdd: () => void;
}) {
  return (
    <div style={{ padding: '12px 16px', background: 'var(--v-card-bg)', borderTop: '1px solid var(--v-card-border)' }}>
      {layer ? (
        <>
          {/* Inline text editor */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>EDIT TEXT</p>
            <textarea
              value={layer.text}
              onChange={e => onChange({ text: e.target.value })}
              placeholder="Type your message..."
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--v-card-bg)', border: '1px solid #2D2F4A', borderRadius: 10,
                padding: '9px 12px', color: '#F0EBE0', fontSize: 14,
                resize: 'none', outline: 'none', lineHeight: 1.5,
              }}
            />
          </div>

          {/* Font size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, width: 36 }}>SIZE</span>
            <input type="range" min={10} max={52} value={layer.fontSize}
              onChange={e => onChange({ fontSize: Number(e.target.value) })}
              style={{ flex: 1, accentColor: ACCENT }} />
            <span style={{ color: '#F0EBE0', fontSize: 12, width: 24 }}>{layer.fontSize}</span>
          </div>

          {/* Weight */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['400', '700', '900'] as const).map(w => (
              <button key={w} onClick={() => onChange({ fontWeight: w })}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: layer.fontWeight === w ? ACCENT : 'var(--v-card-border)',
                  color: '#fff', fontSize: 11,
                  fontWeight: w === '400' ? 400 : w === '700' ? 700 : 900,
                }}>
                {w === '400' ? 'Regular' : w === '700' ? 'Bold' : 'Black'}
              </button>
            ))}
          </div>

          {/* Color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700 }}>COLOR</span>
            {TEXT_COLORS.map(c => (
              <button key={c} onClick={() => onChange({ color: c })}
                style={{
                  width: 26, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: c,
                  outline: layer.color === c ? '2px solid #fff' : '2px solid transparent',
                  outlineOffset: 2,
                }} />
            ))}
          </div>

          {/* Align + delete */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onChange({ align: a })}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: layer.align === a ? ACCENT : 'var(--v-card-border)',
                  color: '#fff', fontSize: 13,
                }}>
                {a === 'left' ? '≡' : a === 'center' ? '≡' : '≡'}
              </button>
            ))}
            <button onClick={onDelete}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 11, fontWeight: 700,
              }}>
              Delete
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ color: '#6D6E8A', fontSize: 12, marginBottom: 10 }}>
            Tap a text layer on the canvas to edit it, or add a new one.
          </p>
          <button onClick={onAdd}
            style={{
              padding: '8px 24px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
            + Add Text Layer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Audio tool panel ─────────────────────────────────────────────────────────
function AudioPanel({
  audio, onSelect,
}: {
  audio: AudioTrack | null;
  onSelect: (t: AudioTrack | null) => void;
}) {
  const [cat, setCat] = useState('Hype');

  return (
    <div style={{ padding: '12px 16px', background: 'var(--v-card-bg)', borderTop: '1px solid var(--v-card-border)', maxHeight: 240, overflowY: 'auto' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
        {Object.keys(AUDIO_LIBRARY).map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: cat === c ? ACCENT : 'var(--v-card-border)',
              color: '#fff', fontSize: 11, fontWeight: 700,
            }}>
            {c}
          </button>
        ))}
        {audio && (
          <button onClick={() => onSelect(null)}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid #3D1515',
              cursor: 'pointer', flexShrink: 0, background: 'transparent',
              color: '#EF4444', fontSize: 11, fontWeight: 700,
            }}>
            Remove
          </button>
        )}
      </div>
      {/* Track list */}
      {AUDIO_LIBRARY[cat].map(track => {
        const active = audio?.id === track.id;
        return (
          <button key={track.id} onClick={() => onSelect(active ? null : track)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 12, marginBottom: 6, border: 'none', cursor: 'pointer',
              background: active ? `${ACCENT}22` : 'var(--v-card-bg)',
              outline: active ? `1px solid ${ACCENT}` : 'none',
            }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: active ? ACCENT : 'var(--v-card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>
              {active ? '⏸' : '▶'}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ color: '#F0EBE0', fontSize: 13, fontWeight: 700, margin: 0 }}>{track.name}</p>
              <p style={{ color: '#6D6E8A', fontSize: 10, margin: 0 }}>{track.category} · {track.duration}</p>
            </div>
            {active && (
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
                {[1, 1.6, 0.8, 1.3, 1].map((h, i) => (
                  <motion.div key={i}
                    animate={{ scaleY: [1, h * 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.4 + i * 0.07, delay: i * 0.05 }}
                    style={{ width: 3, height: 16, borderRadius: 2, background: '#34D399', transformOrigin: 'bottom' }}
                  />
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Captions panel ───────────────────────────────────────────────────────────
function CaptionsPanel({ captions, onChange }: { captions: string; onChange: (v: string) => void }) {
  return (
    <div style={{ padding: '12px 16px', background: 'var(--v-card-bg)', borderTop: '1px solid var(--v-card-border)' }}>
      <p style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
        CAPTIONS — one line = one caption card shown at bottom of video
      </p>
      <textarea
        value={captions}
        onChange={e => onChange(e.target.value)}
        placeholder={'Line one of captions\nLine two\nLine three...'}
        rows={5}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--v-card-bg)', border: '1px solid #2D2F4A', borderRadius: 10,
          padding: '10px 12px', color: '#F0EBE0', fontSize: 13, lineHeight: 1.7,
          resize: 'none', outline: 'none',
        }}
      />
      <p style={{ color: '#4A4F72', fontSize: 10, marginTop: 6 }}>
        Edit captions here before posting. Each line will be timed to the clip.
      </p>
    </div>
  );
}

// ─── Trim panel ───────────────────────────────────────────────────────────────
function TrimPanel({
  trimStart, trimEnd, onStart, onEnd,
}: {
  trimStart: number;
  trimEnd: number;
  onStart: (v: number) => void;
  onEnd: (v: number) => void;
}) {
  // Fake waveform heights that stay stable
  const bars = Array.from({ length: 44 }, (_, i) =>
    20 + Math.abs(Math.sin(i * 0.55) * 60) + Math.abs(Math.cos(i * 0.3) * 20)
  );

  return (
    <div style={{ padding: '12px 16px', background: 'var(--v-card-bg)', borderTop: '1px solid var(--v-card-border)' }}>
      <p style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, marginBottom: 10 }}>
        TRIM — set start and end of your clip
      </p>

      {/* Waveform timeline */}
      <div style={{ position: 'relative', height: 48, background: 'var(--v-card-bg)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1.5, padding: '4px 6px' }}>
          {bars.map((h, i) => {
            const pct = i / bars.length;
            const inRange = pct >= trimStart / 100 && pct <= trimEnd / 100;
            return (
              <div key={i} style={{
                flex: 1, borderRadius: 2,
                background: inRange ? ACCENT : '#2D2F4A',
                height: `${h}%`,
                transition: 'background 0.1s',
              }} />
            );
          })}
        </div>
        {/* Active range border */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${trimStart}%`, right: `${100 - trimEnd}%`,
          border: `2px solid ${ACCENT}`, borderRadius: 8,
          pointerEvents: 'none',
        }} />
      </div>

      {/* IN point */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, width: 30 }}>IN</span>
        <input type="range" min={0} max={trimEnd - 5} value={trimStart}
          onChange={e => onStart(Number(e.target.value))}
          style={{ flex: 1, accentColor: ACCENT }} />
        <span style={{ color: '#F0EBE0', fontSize: 11, width: 36 }}>
          {(trimStart * 0.3).toFixed(1)}s
        </span>
      </div>

      {/* OUT point */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#6D6E8A', fontSize: 10, fontWeight: 700, width: 30 }}>OUT</span>
        <input type="range" min={trimStart + 5} max={100} value={trimEnd}
          onChange={e => onEnd(Number(e.target.value))}
          style={{ flex: 1, accentColor: ACCENT }} />
        <span style={{ color: '#F0EBE0', fontSize: 11, width: 36 }}>
          {(trimEnd * 0.3).toFixed(1)}s
        </span>
      </div>

      <p style={{ color: '#4A4F72', fontSize: 10, marginTop: 8 }}>
        Duration: {((trimEnd - trimStart) * 0.3).toFixed(1)}s &nbsp;·&nbsp; Max: 30s
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CreatorStudioPage() {
  // Editor state
  const [layers, setLayers] = useState<TextLayer[]>([
    { id: uid(), text: 'Your message here', x: 20, y: 36, fontSize: 24, color: '#FFFFFF', fontWeight: '900', align: 'left' },
  ]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [bg, setBg]                   = useState(BG_PRESETS[1]);
  const [ratio, setRatio]             = useState<AR>('9:16');
  const [audio, setAudio]             = useState<AudioTrack | null>(null);
  const [captions, setCaptions]       = useState('');
  const [trimStart, setTrimStart]     = useState(0);
  const [trimEnd, setTrimEnd]         = useState(100);
  const [activeTool, setActiveTool]   = useState<ActiveTool>('text');
  const [tab, setTab]                 = useState<StudioTab>('create');
  const [posting, setPosting]         = useState(false);
  const [posted, setPosted]           = useState(false);
  const [myContent, setMyContent]     = useState<any[]>([]);
  const [myVideos, setMyVideos]       = useState<any[]>([]);
  const [tips, setTips]               = useState<any>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [affiliates, setAffiliates]   = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [profile, setProfile]         = useState<any>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const selectedLayer = layers.find(l => l.id === selectedId) ?? null;

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (tab === 'affiliates') loadAffiliates();
    if (tab === 'tips') loadTips();
    if (tab === 'my-content') loadData();
  }, [tab]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: p }, { data: posts }, { data: videos }] = await Promise.all([
      (supabase as any).from('profiles').select('username,personality_type,village_score').eq('id', user.id).single(),
      (supabase as any).from('dream_line_posts').select('oowop_count,comment_count,created_at,content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      (supabase as any).from('studio_videos').select('id,title,video_url,thumbnail_url,duration_seconds,watch_count,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setProfile(p);
    setMyContent(posts ?? []);
    setMyVideos(videos ?? []);
    if (posts?.length) {
      setEngagementData({
        posts: posts.length,
        avg_oowops: (posts.reduce((a: number, p: any) => a + (p.oowop_count || 0), 0) / posts.length).toFixed(1),
        avg_comments: (posts.reduce((a: number, p: any) => a + (p.comment_count || 0), 0) / posts.length).toFixed(1),
      });
    }
  }

  async function uploadVideo(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const ext = file.name.split('.').pop() ?? 'mp4';
      const path = `${user.id}/${Date.now()}.${ext}`;
      setUploadProgress(30);
      const { data: uploadData, error } = await (supabase as any).storage
        .from('studio-videos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setUploadProgress(75);
      const { data: { publicUrl } } = (supabase as any).storage.from('studio-videos').getPublicUrl(path);
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      await (supabase as any).from('studio_videos').insert({
        user_id: user.id,
        title,
        video_url: publicUrl,
        thumbnail_url: null,
        duration_seconds: 0,
        watch_count: 0,
        likes: 0,
        is_affiliate: false,
      });
      setUploadProgress(100);
      await loadData();
    } catch (e) {
      console.error('Upload failed', e);
    }
    setUploading(false);
    setUploadProgress(0);
  }

  async function loadTips() {
    setTipsLoading(true);
    try {
      const res = await fetch('/api/studio/content-tips', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype: profile?.personality_type, engagement_data: engagementData }),
      });
      setTips(await res.json());
    } catch { /* silent */ }
    setTipsLoading(false);
  }

  async function loadAffiliates() {
    const { data } = await (supabase as any).from('provider_profiles')
      .select('*,profiles(username)').eq('verification_status', 'approved').eq('is_active', true).limit(8);
    setAffiliates(data ?? []);
  }

  function addLayer() {
    const n: TextLayer = {
      id: uid(), text: 'New text',
      x: 20, y: 60 + layers.length * 50,
      fontSize: 18, color: '#FFFFFF', fontWeight: '700', align: 'center',
    };
    setLayers(ls => [...ls, n]);
    setSelectedId(n.id);
    setActiveTool('text');
  }

  function updateSelected(patch: Partial<TextLayer>) {
    if (!selectedId) return;
    setLayers(ls => ls.map(l => l.id === selectedId ? { ...l, ...patch } : l));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setLayers(ls => ls.filter(l => l.id !== selectedId));
    setSelectedId(null);
  }

  async function postToFeed() {
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('dream_line_posts').insert({
        user_id: user.id,
        content: captions || layers[0]?.text || 'New post from Creator Studio',
        visibility: 'public',
        audio_track: audio?.name ?? null,
      });
    }
    setPosting(false);
    setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  }

  const TABS: [StudioTab, string, string][] = [
    ['create', '🎬', 'Create'],
    ['tips', '💡', 'AI Tips'],
    ['affiliates', '🤝', 'Affiliates'],
    ['my-content', '📊', 'My Content'],
  ];

  const TOOLS: { id: ActiveTool; icon: string; label: string }[] = [
    { id: 'text',     icon: 'T',  label: 'Text' },
    { id: 'audio',    icon: '♪',  label: 'Audio' },
    { id: 'captions', icon: 'CC', label: 'Captions' },
    { id: 'trim',     icon: '✂',  label: 'Trim' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--v-bg)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top,0px)' }}>
      <BackButton />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'var(--v-card-bg)', borderBottom: '1px solid var(--v-card-border)',
      }}>
        <div style={{ width: 44, flexShrink: 0 }} />
        <span style={{ fontSize: 20 }}>🎬</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#F0EBE0', fontSize: 15, fontWeight: 900, margin: 0 }}>Creator Studio</p>
          <p style={{ color: '#4A4F72', fontSize: 11, margin: 0 }}>Build · Edit · Post</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--v-card-bg)', borderBottom: '1px solid var(--v-card-border)' }}>
        {TABS.map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', background: 'transparent',
              borderBottom: tab === id ? `2px solid ${ACCENT}` : '2px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ color: tab === id ? ACCENT : '#4A4F72', fontSize: 9, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── CREATE TAB ─────────────────────────────────────── */}
      {tab === 'create' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top toolbar: ratio + bg + add text */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
            background: 'var(--v-card-bg)', borderBottom: '1px solid var(--v-card-border)', overflowX: 'auto',
          }}>
            {(['9:16', '1:1', '16:9'] as AR[]).map(r => (
              <button key={r} onClick={() => setRatio(r)}
                style={{
                  padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: ratio === r ? ACCENT : 'var(--v-card-border)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                }}>
                {r}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: '#2D2F4A', flexShrink: 0 }} />
            {BG_PRESETS.map((b, i) => (
              <button key={i} onClick={() => setBg(b)}
                style={{
                  width: 26, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: b,
                  outline: bg === b ? '2px solid #fff' : '2px solid transparent',
                  outlineOffset: 2,
                }} />
            ))}
            <div style={{ width: 1, height: 20, background: '#2D2F4A', flexShrink: 0 }} />
            <button onClick={addLayer}
              style={{
                padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: 'var(--v-card-border)', color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
              + Text
            </button>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--v-bg)', minHeight: 0 }}
            onClick={e => { if (e.target === e.currentTarget) { setSelectedId(null); } }}>
            <EditorCanvas
              ratio={ratio} bg={bg} layers={layers}
              selectedId={selectedId} captions={captions} audio={audio}
              onSelectLayer={id => { setSelectedId(id); setActiveTool('text'); }}
              onLayerMoved={(id, x, y) => setLayers(ls => ls.map(l => l.id === id ? { ...l, x, y } : l))}
              onDeselectAll={() => setSelectedId(null)}
            />
          </div>

          {/* Tool panel — slides in/out */}
          <AnimatePresence initial={false}>
            {activeTool && (
              <motion.div key={activeTool}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', flexShrink: 0 }}>
                {activeTool === 'text' && (
                  <TextPanel
                    layer={selectedLayer}
                    onChange={updateSelected}
                    onDelete={deleteSelected}
                    onAdd={addLayer}
                  />
                )}
                {activeTool === 'audio' && (
                  <AudioPanel audio={audio} onSelect={setAudio} />
                )}
                {activeTool === 'captions' && (
                  <CaptionsPanel captions={captions} onChange={setCaptions} />
                )}
                {activeTool === 'trim' && (
                  <TrimPanel
                    trimStart={trimStart} trimEnd={trimEnd}
                    onStart={setTrimStart} onEnd={setTrimEnd}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor toolbar */}
          <div style={{ display: 'flex', background: 'var(--v-card-bg)', borderTop: '1px solid var(--v-card-border)', flexShrink: 0 }}>
            {TOOLS.map(tool => (
              <button key={tool.id}
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                  background: activeTool === tool.id ? `${ACCENT}18` : 'transparent',
                  borderTop: activeTool === tool.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                <span style={{
                  fontSize: 15, fontWeight: 900,
                  color: activeTool === tool.id ? ACCENT : '#6D6E8A',
                }}>
                  {tool.icon}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: activeTool === tool.id ? ACCENT : '#6D6E8A',
                }}>
                  {tool.label}
                </span>
              </button>
            ))}
          </div>

          {/* Post button */}
          <button onClick={postToFeed} disabled={posting}
            style={{
              margin: '10px 16px',
              marginBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              padding: '14px 0', borderRadius: 16, border: 'none',
              background: posted ? '#059669' : `linear-gradient(135deg,${ACCENT},#1877F2)`,
              color: '#fff', fontSize: 15, fontWeight: 900,
              cursor: posting ? 'default' : 'pointer', opacity: posting ? 0.7 : 1,
              transition: 'background 0.3s',
            }}>
            {posted ? '✅ Posted to Dream Line!' : posting ? '⏳ Posting…' : '🚀 Post to Dream Line'}
          </button>
        </div>
      )}

      {/* ── AI TIPS TAB ────────────────────────────────────── */}
      {tab === 'tips' && (
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 16, padding: 14, marginBottom: 12,
          }}>
            <p style={{ color: '#F0EBE0', fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>Your Engagement Stats</p>
            {engagementData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  { label: 'Posts', value: engagementData.posts },
                  { label: 'Avg OoWops', value: engagementData.avg_oowops },
                  { label: 'Avg Comments', value: engagementData.avg_comments },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: 'var(--v-card-bg)', borderRadius: 10, padding: '10px 0' }}>
                    <p style={{ color: ACCENT, fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
                    <p style={{ color: '#6D6E8A', fontSize: 10, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6D6E8A', fontSize: 12 }}>Post to Dream Line to see your stats.</p>
            )}
          </div>

          {tipsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6D6E8A' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }} className="animate-pulse">💡</div>
              <p style={{ fontSize: 12 }}>Spirit is analyzing your content…</p>
            </div>
          ) : tips ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(tips.tips ?? [tips]).map((tip: any, i: number) => (
                <div key={i} style={{ background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 14, padding: 14 }}>
                  <p style={{ color: ACCENT, fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>{tip.title ?? `Tip ${i + 1}`}</p>
                  <p style={{ color: '#C8C3B8', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{tip.body ?? tip}</p>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={loadTips}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg,${ACCENT},#1877F2)`, color: '#fff', fontSize: 14, fontWeight: 900,
              }}>
              💡 Get Spirit's Content Tips
            </button>
          )}
        </div>
      )}

      {/* ── AFFILIATES TAB ─────────────────────────────────── */}
      {tab === 'affiliates' && (
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <p style={{ color: '#F0EBE0', fontSize: 13, fontWeight: 800, margin: '0 0 6px' }}>Content + Service Recommendations</p>
            <p style={{ color: '#6D6E8A', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Based on your goals and engagement, these verified providers can accelerate your journey. Feature them and earn affiliate credits.
            </p>
          </div>
          {affiliates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6D6E8A' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🤝</p>
              <p style={{ fontSize: 12 }}>Loading recommendations…</p>
            </div>
          ) : affiliates.map((prov, i) => (
            <motion.div key={prov.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--v-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🩺
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#F0EBE0', fontSize: 13, fontWeight: 700, margin: 0 }}>{prov.display_name}</p>
                  <p style={{ color: '#6D6E8A', fontSize: 11, margin: 0 }}>{prov.specialty ?? prov.credential_type}</p>
                  {prov.session_rate && <p style={{ color: ACCENT, fontSize: 11, fontWeight: 700, margin: 0 }}>${prov.session_rate}/session</p>}
                </div>
                <div style={{
                  padding: '6px 12px', borderRadius: 20, background: ACCENT,
                  color: '#fff', fontSize: 11, fontWeight: 700,
                }}>
                  Feature
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── MY CONTENT TAB ─────────────────────────────────── */}
      {tab === 'my-content' && (
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {/* Video library */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ color: '#6D6E8A', fontSize: 11, fontWeight: 900, letterSpacing: '0.06em' }}>VIDEO LIBRARY</p>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: ACCENT, color: '#fff', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 900, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? `Uploading ${uploadProgress}%` : '+ Upload Video'}
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f); e.target.value = ''; }}
            />
          </div>

          {uploading && (
            <div style={{ background: 'var(--v-card-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#F0EBE0' }}>Uploading video…</span>
                <span style={{ fontSize: 12, color: ACCENT }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--v-card-border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: ACCENT, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {myVideos.length === 0 && !uploading ? (
            <div style={{ textAlign: 'center', padding: '24px 0 32px', color: '#6D6E8A', marginBottom: 16 }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🎬</p>
              <p style={{ fontSize: 12 }}>No videos yet. Upload your first.</p>
            </div>
          ) : myVideos.map((v: any) => (
            <div key={v.id} style={{ background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 12, padding: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--v-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎬'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#F0EBE0', fontSize: 13, fontWeight: 700, marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{v.title}</p>
                <div style={{ display: 'flex', gap: 10, color: '#6D6E8A', fontSize: 11 }}>
                  <span>{v.watch_count || 0} views</span>
                  {v.duration_seconds > 0 && <span>{Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, '0')}</span>}
                  <span style={{ marginLeft: 'auto' }}>{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Dream Line posts */}
          {myContent.length > 0 && (
            <>
              <p style={{ color: '#6D6E8A', fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 12, marginTop: 4 }}>DREAM LINE POSTS</p>
              {myContent.map((post: any, i: number) => (
                <div key={i} style={{ background: 'var(--v-card-bg)', border: '1px solid var(--v-card-border)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
                  <p style={{ color: '#F0EBE0', fontSize: 13, lineHeight: 1.5, margin: '0 0 8px', WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                    {post.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6D6E8A', fontSize: 11 }}>
                    <span>✊ {post.oowop_count || 0}</span>
                    <span>💬 {post.comment_count || 0}</span>
                    <span style={{ marginLeft: 'auto' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: 'var(--v-card-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: ACCENT, width: `${Math.min(100, ((post.oowop_count || 0) / 10) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {myContent.length === 0 && myVideos.length === 0 && !uploading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#6D6E8A' }}>
              <p style={{ fontSize: 12 }}>No posts yet. Create something and post it.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
