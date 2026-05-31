'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/create/session';
import { useCreateStore, CSS_FILTERS, buildCSSFilter, type TextOverlay } from '@/lib/create/store';

type EditTool = 'adjust' | 'filter' | 'text' | 'trim' | 'audio' | 'stickers' | 'captions';

const FONTS = [
  { label: 'Bold',       value: 'system-ui',   weight: 900 },
  { label: 'Clean',      value: 'sans-serif',  weight: 600 },
  { label: 'Handwritten',value: 'cursive',      weight: 600 },
  { label: 'Elegant',    value: 'Georgia, serif', weight: 600 },
  { label: 'Display',    value: '"Bebas Neue", "Arial Black", sans-serif', weight: 700 },
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#1877F2', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const TEXT_HIGHLIGHTS = ['transparent', 'rgba(0,0,0,0.6)', 'rgba(24,119,242,0.7)', 'rgba(239,68,68,0.7)', 'rgba(255,255,255,0.8)'];

const STICKERS = [
  { emoji: '🕐', type: 'time', label: 'Time' },
  { emoji: '📅', type: 'date', label: 'Date' },
  { emoji: '📍', type: 'location', label: 'Place' },
  { emoji: '🔥', type: 'static', label: 'Fire' },
  { emoji: '💯', type: 'static', label: '100' },
  { emoji: '⚡', type: 'static', label: 'Bolt' },
  { emoji: '🎯', type: 'static', label: 'Goal' },
  { emoji: '🏆', type: 'static', label: 'Win' },
  { emoji: '💪', type: 'static', label: 'Strong' },
  { emoji: '🌟', type: 'static', label: 'Star' },
  { emoji: '🚀', type: 'static', label: 'Launch' },
  { emoji: '✨', type: 'static', label: 'Sparkle' },
];

const ADJUST_PARAMS: { key: keyof ReturnType<typeof useCreateStore.getState>['adjustments']; label: string; min: number; max: number }[] = [
  { key: 'brightness',  label: 'Brightness',  min: -100, max: 100 },
  { key: 'contrast',    label: 'Contrast',    min: -100, max: 100 },
  { key: 'saturation',  label: 'Saturation',  min: -100, max: 100 },
  { key: 'warmth',      label: 'Warmth',      min: -100, max: 100 },
  { key: 'sharpness',   label: 'Sharpness',   min: 0,    max: 100 },
  { key: 'vignette',    label: 'Vignette',    min: 0,    max: 100 },
  { key: 'fade',        label: 'Fade',        min: 0,    max: 100 },
  { key: 'grain',       label: 'Grain',       min: 0,    max: 100 },
];

const TOOLS: { id: EditTool; label: string; icon: React.ReactNode }[] = [
  { id: 'adjust',   label: 'Adjust',   icon: <AdjustIcon /> },
  { id: 'filter',   label: 'Filter',   icon: <FilterIcon /> },
  { id: 'text',     label: 'Text',     icon: <TextIcon /> },
  { id: 'stickers', label: 'Stickers', icon: <StickerIcon /> },
  { id: 'audio',    label: 'Audio',    icon: <AudioIcon /> },
  { id: 'trim',     label: 'Trim',     icon: <TrimIcon /> },
  { id: 'captions', label: 'Captions', icon: <CaptionsIcon /> },
];

// ── SVG icons ─────────────────────────────────────────────────────────────────
function AdjustIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; }
function FilterIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>; }
function TextIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function StickerIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>; }
function AudioIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function TrimIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="6" y1="20" x2="18" y2="4"/><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/></svg>; }
function CaptionsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h3m4 0h3M7 11h10"/></svg>; }

export default function EditPage() {
  const router = useRouter();
  const session = getSession();
  const { selectedFilter, adjustments, textOverlays, trimStart, trimEnd, soundTitle,
          setFilter, setAdjustment, resetAdjustments, addTextOverlay, updateTextOverlay,
          removeTextOverlay, setTrim, setSound, clearSound } = useCreateStore();

  const [activeTool, setActiveTool]     = useState<EditTool | null>(null);
  const [draggingText, setDraggingText] = useState<string | null>(null);
  const [editingText, setEditingText]   = useState<TextOverlay | null>(null);

  // New text overlay draft
  const [newText, setNewText]           = useState('');
  const [newFont, setNewFont]           = useState(FONTS[0].value);
  const [newFontWeight, setNewFontWeight] = useState(900);
  const [newColor, setNewColor]         = useState('#FFFFFF');
  const [newBg, setNewBg]               = useState('transparent');
  const [newSize, setNewSize]           = useState(24);

  const videoRef     = useRef<HTMLVideoElement>(null);
  const previewRef   = useRef<HTMLDivElement>(null);
  const timelineRef  = useRef<HTMLDivElement>(null);

  // Video playback state (for trim tool)
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [keyMarkers,   setKeyMarkers]   = useState<number[]>([]);
  const [trimHistory,  setTrimHistory]  = useState<[number, number | null][]>([]);

  // Redirect if no session media
  useEffect(() => {
    if (!session.objectURL && session.mediaType !== 'text') {
      router.replace('/village/create');
    }
  }, []);

  // Sync video time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime  = () => setCurrentTime(v.currentTime);
    const onMeta  = () => setDuration(v.duration ?? 0);
    const onEnded = () => setIsPlaying(false);
    v.addEventListener('timeupdate',       onTime);
    v.addEventListener('loadedmetadata',   onMeta);
    v.addEventListener('ended',            onEnded);
    return () => {
      v.removeEventListener('timeupdate',     onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended',          onEnded);
    };
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else           { v.play(); setIsPlaying(true); }
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    setCurrentTime(t);
  }

  function addKeyMarker() {
    setKeyMarkers(m => [...m, currentTime]);
  }

  function applyTrim(start: number, end: number | null) {
    setTrimHistory(h => [...h, [trimStart, trimEnd]]);
    setTrim(start, end);
  }

  function undoTrim() {
    const prev = trimHistory[trimHistory.length - 1];
    if (!prev) return;
    setTrim(prev[0], prev[1]);
    setTrimHistory(h => h.slice(0, -1));
  }

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // Timeline drag for trim handles
  function handleTimelineDrag(e: React.MouseEvent | React.TouchEvent, handle: 'start' | 'end') {
    const el = timelineRef.current;
    if (!el || duration === 0) return;
    const rect = el.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const t = ratio * duration;
    if (handle === 'start') {
      applyTrim(Math.min(t, (trimEnd ?? duration) - 0.5), trimEnd);
    } else {
      applyTrim(trimStart, Math.max(t, trimStart + 0.5));
    }
  }

  const cssFilter = buildCSSFilter(adjustments, CSS_FILTERS[selectedFilter] ?? '');

  function addText() {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id:     Math.random().toString(36).slice(2),
      text:   newText,
      font:   newFont,
      size:   newSize,
      color:  newColor,
      bg:     newBg,
      bold:   newFontWeight >= 700,
      italic: false,
      x:      40, y: 40,
    };
    addTextOverlay(overlay);
    setNewText('');
    setActiveTool(null);
  }

  function addSticker(emoji: string, type: string) {
    const label = type === 'time' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : type === 'date' ? new Date().toLocaleDateString() : emoji;
    const overlay: TextOverlay = {
      id: Math.random().toString(36).slice(2),
      text: label, font: 'system-ui', size: 28, color: '#FFFFFF',
      bg: 'rgba(0,0,0,0.4)', bold: true, italic: false, x: 30, y: 30,
    };
    addTextOverlay(overlay);
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 100 }}>

      {/* ── TOP TOOL RAIL ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 overflow-x-auto py-3 px-3"
        style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2 min-w-max">
          {TOOLS.map(tool => (
            <button key={tool.id}
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl flex-shrink-0 transition-all"
              style={{
                background: activeTool === tool.id ? 'rgba(24,119,242,0.2)' : 'rgba(255,255,255,0.07)',
                border: activeTool === tool.id ? '1px solid #1877F2' : '1px solid transparent',
                cursor: 'pointer', color: activeTool === tool.id ? '#1877F2' : 'rgba(255,255,255,0.7)',
              }}>
              {tool.icon}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MEDIA PREVIEW ────────────────────────────────────────────────────── */}
      <div ref={previewRef} className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
        {session.mediaType === 'text' ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0A0B12' }}>
            <p className="text-white text-2xl font-black text-center px-8">{session.textContent}</p>
          </div>
        ) : session.mediaType === 'photo' ? (
          <img src={session.objectURL!} alt="edit" className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: cssFilter }} />
        ) : (
          <video ref={videoRef} src={session.objectURL!} className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: cssFilter }} autoPlay loop playsInline muted />
        )}

        {/* Vignette overlay */}
        {adjustments.vignette > 0 && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, transparent ${100 - adjustments.vignette}%, rgba(0,0,0,0.8) 100%)` }} />
        )}

        {/* Fade overlay */}
        {adjustments.fade > 0 && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `rgba(255,255,255,${adjustments.fade / 200})` }} />
        )}

        {/* Grain overlay */}
        {adjustments.grain > 0 && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: adjustments.grain / 100,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }} />
        )}

        {/* Text overlays */}
        {textOverlays.map(overlay => (
          <motion.div key={overlay.id} drag dragMomentum={false}
            onDragEnd={(_, info) => {
              const el = previewRef.current;
              if (!el) return;
              const rect = el.getBoundingClientRect();
              updateTextOverlay(overlay.id, {
                x: Math.max(0, Math.min(90, overlay.x + (info.offset.x / rect.width) * 100)),
                y: Math.max(0, Math.min(90, overlay.y + (info.offset.y / rect.height) * 100)),
              });
            }}
            style={{
              position: 'absolute',
              left: `${overlay.x}%`, top: `${overlay.y}%`,
              cursor: 'grab', touchAction: 'none', zIndex: 10,
            }}
            onDoubleClick={() => removeTextOverlay(overlay.id)}>
            <div style={{
              fontFamily: overlay.font, fontSize: overlay.size,
              fontWeight: overlay.bold ? 800 : 400,
              color: overlay.color, background: overlay.bg,
              padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap',
              userSelect: 'none',
            }}>
              {overlay.text}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── TOOL PANEL ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            key={activeTool}
            initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="flex-shrink-0 overflow-y-auto"
            style={{ maxHeight: '42%', background: '#0A0B12', borderTop: '1px solid rgba(255,255,255,0.1)' }}>

            {/* ── ADJUST ── */}
            {activeTool === 'adjust' && (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white text-sm font-black">Adjust</p>
                  <button onClick={resetAdjustments} style={{ color: '#1877F2', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Reset</button>
                </div>
                {ADJUST_PARAMS.map(param => (
                  <div key={param.key}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{param.label}</span>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{adjustments[param.key]}</span>
                    </div>
                    <input type="range" min={param.min} max={param.max}
                      value={adjustments[param.key]}
                      onChange={e => setAdjustment(param.key, Number(e.target.value))}
                      className="w-full" style={{ accentColor: '#1877F2' }} />
                  </div>
                ))}
              </div>
            )}

            {/* ── FILTER ── */}
            {activeTool === 'filter' && (
              <div className="p-4">
                <p className="text-white text-sm font-black mb-3">Filter</p>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {Object.entries(CSS_FILTERS).map(([name, css]) => (
                    <button key={name} onClick={() => setFilter(name)}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div style={{
                        width: 60, height: 80, borderRadius: 10, overflow: 'hidden',
                        border: selectedFilter === name ? '2.5px solid #1877F2' : '2px solid rgba(255,255,255,0.15)',
                        filter: css,
                      }}>
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
                      </div>
                      <span style={{ color: selectedFilter === name ? '#1877F2' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── TEXT ── */}
            {activeTool === 'text' && (
              <div className="p-4 space-y-3">
                <p className="text-white text-sm font-black">Add Text</p>
                <input value={newText} onChange={e => setNewText(e.target.value)}
                  placeholder="Type something…" autoFocus
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />

                {/* Font */}
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {FONTS.map(f => (
                    <button key={f.value} onClick={() => { setNewFont(f.value); setNewFontWeight(f.weight); }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: newFont === f.value ? '#1877F2' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: f.value, fontWeight: f.weight }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Color + highlight */}
                <div className="flex gap-2 items-center">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Color</span>
                  {TEXT_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)}
                      style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: newColor === c ? '2px solid #1877F2' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>BG</span>
                  {TEXT_HIGHLIGHTS.map(c => (
                    <button key={c} onClick={() => setNewBg(c)}
                      style={{ width: 22, height: 22, borderRadius: 4, background: c === 'transparent' ? 'rgba(255,255,255,0.1)' : c, border: newBg === c ? '2px solid #1877F2' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }} />
                  ))}
                </div>

                {/* Size */}
                <div className="flex items-center gap-3">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Size</span>
                  <input type="range" min={12} max={72} value={newSize}
                    onChange={e => setNewSize(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: '#1877F2' }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{newSize}px</span>
                </div>

                <button onClick={addText}
                  className="w-full py-3 rounded-2xl text-white font-black text-sm"
                  style={{ background: newText.trim() ? '#1877F2' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer' }}>
                  Add to Video
                </button>
              </div>
            )}

            {/* ── STICKERS ── */}
            {activeTool === 'stickers' && (
              <div className="p-4">
                <p className="text-white text-sm font-black mb-3">Stickers</p>
                <div className="grid grid-cols-6 gap-3">
                  {STICKERS.map(s => (
                    <button key={s.emoji} onClick={() => addSticker(s.emoji, s.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}>
                      <span style={{ fontSize: 26 }}>{s.emoji}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── AUDIO ── */}
            {activeTool === 'audio' && (
              <div className="p-4 space-y-3">
                <p className="text-white text-sm font-black">Audio</p>
                {soundTitle ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{soundTitle}</p>
                    </div>
                    <button onClick={clearSound} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[{ label: 'My Sounds', icon: '🎙' }, { label: 'Spotify', icon: '🎵' }, { label: 'Sound Library', icon: '🎼' }].map(opt => (
                      <button key={opt.label} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full"
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                        <span style={{ fontSize: 20 }}>{opt.icon}</span>
                        <span className="text-sm font-bold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TRIM / TIMELINE ── */}
            {activeTool === 'trim' && session.mediaType === 'video' && (
              <div className="p-4 space-y-3">

                {/* Position + controls row */}
                <div className="flex items-center justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(currentTime)} / {fmt(duration || 0)}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Undo */}
                    <button onClick={undoTrim} disabled={trimHistory.length === 0}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: trimHistory.length ? 1 : 0.3 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
                      </svg>
                    </button>
                    {/* Play/pause */}
                    <button onClick={togglePlay}
                      style={{ background: '#1877F2', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        {isPlaying
                          ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                          : <polygon points="5 3 19 12 5 21 5 3"/>}
                      </svg>
                    </button>
                    {/* Key marker */}
                    <button onClick={addKeyMarker}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                    {/* Next */}
                    <button onClick={() => router.push('/village/create/post-details')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1877F2', fontSize: 12, fontWeight: 700 }}>
                      Next →
                    </button>
                  </div>
                </div>

                {/* Timeline strip */}
                <div ref={timelineRef} className="relative rounded-lg overflow-hidden select-none"
                  style={{ height: 56, background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  onClick={e => {
                    const rect = timelineRef.current!.getBoundingClientRect();
                    seekTo(((e.clientX - rect.left) / rect.width) * (duration || 0));
                  }}>

                  {/* Trimmed-out region (start) */}
                  {trimStart > 0 && (
                    <div className="absolute inset-y-0 left-0 bg-black opacity-60"
                      style={{ width: `${(trimStart / (duration || 1)) * 100}%` }} />
                  )}
                  {/* Trimmed-out region (end) */}
                  {trimEnd !== null && (
                    <div className="absolute inset-y-0 right-0 bg-black opacity-60"
                      style={{ width: `${(1 - trimEnd / (duration || 1)) * 100}%` }} />
                  )}

                  {/* Active region highlight */}
                  <div className="absolute inset-y-0"
                    style={{
                      left:  `${(trimStart / (duration || 1)) * 100}%`,
                      right: trimEnd !== null ? `${(1 - trimEnd / (duration || 1)) * 100}%` : '0%',
                      border: '2px solid #1877F2',
                      borderRadius: 4,
                    }} />

                  {/* Gradient strip (faux waveform) */}
                  <div className="absolute inset-1 rounded opacity-40"
                    style={{ background: 'linear-gradient(90deg, #1877F2 0%, #7C3AED 50%, #1877F2 100%)' }} />

                  {/* Playhead */}
                  {duration > 0 && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${(currentTime / duration) * 100}%`, boxShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
                      <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}

                  {/* Key markers */}
                  {keyMarkers.map((m, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: `${(m / (duration || 1)) * 100}%`, background: '#F59E0B' }} />
                  ))}

                  {/* Start trim handle */}
                  <motion.div className="absolute top-0 bottom-0 w-3 flex items-center justify-center"
                    style={{ left: `${(trimStart / (duration || 1)) * 100}%`, background: '#1877F2', cursor: 'ew-resize', borderRadius: '4px 0 0 4px' }}
                    drag="x" dragMomentum={false} dragConstraints={timelineRef}
                    onDrag={(e, info) => {
                      const el = timelineRef.current;
                      if (!el || duration === 0) return;
                      const rect = el.getBoundingClientRect();
                      const ratio = Math.max(0, Math.min(0.98, (info.point.x - rect.left) / rect.width));
                      const t = ratio * duration;
                      applyTrim(Math.min(t, (trimEnd ?? duration) - 0.5), trimEnd);
                    }}>
                    <svg width="6" height="16" viewBox="0 0 6 16" fill="white"><rect x="1" y="1" width="1" height="14" rx="0.5"/><rect x="4" y="1" width="1" height="14" rx="0.5"/></svg>
                  </motion.div>

                  {/* End trim handle */}
                  <motion.div className="absolute top-0 bottom-0 w-3 flex items-center justify-center"
                    style={{ left: `${((trimEnd ?? duration) / (duration || 1)) * 100}%`, background: '#1877F2', cursor: 'ew-resize', borderRadius: '0 4px 4px 0', transform: 'translateX(-100%)' }}
                    drag="x" dragMomentum={false} dragConstraints={timelineRef}
                    onDrag={(e, info) => {
                      const el = timelineRef.current;
                      if (!el || duration === 0) return;
                      const rect = el.getBoundingClientRect();
                      const ratio = Math.max(0.02, Math.min(1, (info.point.x - rect.left) / rect.width));
                      const t = ratio * duration;
                      applyTrim(trimStart, Math.max(t, trimStart + 0.5));
                    }}>
                    <svg width="6" height="16" viewBox="0 0 6 16" fill="white"><rect x="1" y="1" width="1" height="14" rx="0.5"/><rect x="4" y="1" width="1" height="14" rx="0.5"/></svg>
                  </motion.div>
                </div>

                {/* Audio track label */}
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Audio track</span>
                  {trimStart > 0 || trimEnd !== null ? (
                    <span style={{ color: '#1877F2', fontSize: 11, marginLeft: 'auto', fontWeight: 700 }}>
                      {fmt(trimStart)} – {fmt(trimEnd ?? duration)}
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── CAPTIONS ── */}
            {activeTool === 'captions' && (
              <div className="p-4 space-y-3">
                <p className="text-white text-sm font-black">Captions</p>
                <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    Captions are auto-generated from your transcript after posting.
                    You can edit them on the published post.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <button onClick={() => router.back()}
          style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          ← Back
        </button>
        <button onClick={() => router.push('/village/create/post-details')}
          className="px-8 py-3 rounded-full text-white font-black text-sm"
          style={{ background: '#1877F2', border: 'none', cursor: 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  );
}
