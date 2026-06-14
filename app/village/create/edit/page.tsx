'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/create/session';
import { useCreateStore, CSS_FILTERS, buildCSSFilter, tintOverlay, type TextOverlay, type Clip, type TransitionType } from '@/lib/create/store';
import { buildSegments, getTotalDuration, getActiveSegment, interpolateKeyframes } from '@/lib/create/composition';
import { VILLAGE_SONGS } from '@/lib/music/useVillageMusic';
import { trackFaceZoom, trackObjectZoom } from '@/lib/create/tracking';

type EditTool = 'adjust' | 'filter' | 'effects' | 'text' | 'trim' | 'timeline' | 'audio' | 'stickers' | 'captions';

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'none',          label: 'Cut' },
  { id: 'crossfade',     label: 'Crossfade' },
  { id: 'fade-to-black', label: 'Fade to black' },
  { id: 'wipe',          label: 'Wipe' },
];

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
  { key: 'brilliance',  label: 'Brilliance',  min: -100, max: 100 },
  { key: 'shadow',      label: 'Shadow',      min: -100, max: 100 },
  { key: 'hue',         label: 'Hue',         min: -180, max: 180 },
  { key: 'warmth',      label: 'Temp',        min: -100, max: 100 },
  { key: 'tint',        label: 'Tint',        min: -100, max: 100 },
  { key: 'sharpness',   label: 'Sharpness',   min: 0,    max: 100 },
  { key: 'vignette',    label: 'Vignette',    min: 0,    max: 100 },
  { key: 'fade',        label: 'Fade',        min: 0,    max: 100 },
  { key: 'grain',       label: 'Grain',       min: 0,    max: 100 },
];

const TOOLS: { id: EditTool; label: string; icon: React.ReactNode }[] = [
  { id: 'adjust',   label: 'Adjust',   icon: <AdjustIcon /> },
  { id: 'filter',   label: 'Filter',   icon: <FilterIcon /> },
  { id: 'effects',  label: 'Effects',  icon: <EffectsIcon /> },
  { id: 'text',     label: 'Text',     icon: <TextIcon /> },
  { id: 'stickers', label: 'Stickers', icon: <StickerIcon /> },
  { id: 'audio',    label: 'Audio',    icon: <AudioIcon /> },
  { id: 'trim',     label: 'Trim',     icon: <TrimIcon /> },
  { id: 'timeline', label: 'Tracks',   icon: <TracksIcon /> },
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
function TracksIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="5" rx="1"/><rect x="3" y="11" width="12" height="5" rx="1"/><rect x="3" y="18" width="18" height="3" rx="1"/></svg>; }
function EffectsIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>; }

export default function EditPage() {
  const router = useRouter();
  const session = getSession();
  const { selectedFilter, adjustments, textOverlays, captions, trimStart, trimEnd, soundTitle, clips, zoomKeyframes,
          setFilter, setAdjustment, resetAdjustments, addTextOverlay, updateTextOverlay,
          removeTextOverlay, addCaption, updateCaption, removeCaption,
          setTrim, setSound, clearSound, addClip, updateClip, removeClip, insertClip, reorderClip,
          addOverlayKeyframe, removeOverlayKeyframe, clearOverlayKeyframes,
          addZoomKeyframe, removeZoomKeyframe, clearZoomKeyframes, setZoomKeyframes } = useCreateStore();

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
  const audioInputRef = useRef<HTMLInputElement>(null);
  const clipInputRef  = useRef<HTMLInputElement>(null);
  const compVideoRef  = useRef<HTMLVideoElement>(null);
  const compStripRef  = useRef<HTMLDivElement>(null);

  const [showSoundLibrary, setShowSoundLibrary] = useState(false);

  // Video playback state (for trim tool)
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [keyMarkers,   setKeyMarkers]   = useState<number[]>([]);
  const [trimHistory,  setTrimHistory]  = useState<[number, number | null][]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  // Composition (multi-clip) preview playback state
  const [compTime,    setCompTime]    = useState(0);
  const [compPlaying, setCompPlaying] = useState(false);

  // Zoom & pan effect (manual keyframes + auto face/object tracking)
  const [zoomLevel,    setZoomLevel]    = useState(1.5);
  const [panX,         setPanX]         = useState(0);
  const [panY,         setPanY]         = useState(0);
  const [tracking,     setTracking]     = useState<'face' | 'object' | null>(null);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackError,   setTrackError]   = useState<string | null>(null);

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
    // Chrome reports duration=Infinity for MediaRecorder blobs until the video
    // is seeked once. Force that seek so trim math never divides by Infinity
    // (which throws "non-finite currentTime" when later passed back in).
    let fixingDuration = false;
    const onTime  = () => {
      if (fixingDuration) {
        if (Number.isFinite(v.duration)) setDuration(v.duration);
        v.currentTime = 0;
        fixingDuration = false;
        return;
      }
      setCurrentTime(v.currentTime);
    };
    const onMeta  = () => {
      if (!Number.isFinite(v.duration)) {
        fixingDuration = true;
        v.currentTime = 1e101;
      } else {
        setDuration(v.duration);
      }
    };
    const onDurationChange = () => {
      if (Number.isFinite(v.duration)) setDuration(v.duration);
    };
    const onEnded = () => setIsPlaying(false);
    v.addEventListener('timeupdate',       onTime);
    v.addEventListener('loadedmetadata',   onMeta);
    v.addEventListener('durationchange',   onDurationChange);
    v.addEventListener('ended',            onEnded);
    return () => {
      v.removeEventListener('timeupdate',       onTime);
      v.removeEventListener('loadedmetadata',   onMeta);
      v.removeEventListener('durationchange',   onDurationChange);
      v.removeEventListener('ended',            onEnded);
    };
  }, []);

  // ── Multi-track composition (primary clip + appended clips) ─────────────
  const segments = useMemo(() => {
    if (!session.objectURL || session.mediaType === 'text') return [];
    return buildSegments({
      mediaURL: session.objectURL,
      mediaType: session.mediaType === 'photo' ? 'photo' : 'video',
      trimStart, trimEnd,
      sourceDuration: session.mediaType === 'photo' ? (duration || 5) : duration,
    }, clips);
  }, [session.objectURL, session.mediaType, trimStart, trimEnd, duration, clips]);

  const compDuration = useMemo(() => getTotalDuration(segments), [segments]);
  const activeSeg = useMemo(() => getActiveSegment(segments, compTime), [segments, compTime]);

  // Composition clock — advances in real time while playing, loops at the end.
  useEffect(() => {
    if (!compPlaying) return;
    let last = performance.now();
    let raf = 0;
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      setCompTime(t => {
        if (compDuration <= 0) return 0;
        const nt = t + dt;
        return nt >= compDuration ? 0 : nt;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [compPlaying, compDuration]);

  // Seek/sync the composition video element when the active segment changes.
  useEffect(() => {
    const v = compVideoRef.current;
    if (!v || !activeSeg || activeSeg.segment.mediaType !== 'video') return;
    if (v.src !== activeSeg.segment.mediaURL) v.src = activeSeg.segment.mediaURL;
    v.currentTime = activeSeg.localTime;
    if (compPlaying) v.play().catch(() => {});
  }, [activeSeg?.segment.id]);

  // Keep composition video playing/paused in sync with the play button.
  useEffect(() => {
    const v = compVideoRef.current;
    if (!v || !activeSeg || activeSeg.segment.mediaType !== 'video') return;
    if (compPlaying) v.play().catch(() => {}); else v.pause();
  }, [compPlaying]);

  function seekComp(t: number) {
    const clamped = Math.max(0, Math.min(t, compDuration || t));
    setCompTime(clamped);
    const act = getActiveSegment(segments, clamped);
    const v = compVideoRef.current;
    if (act && act.segment.mediaType === 'video' && v) {
      if (v.src !== act.segment.mediaURL) v.src = act.segment.mediaURL;
      v.currentTime = act.localTime;
    }
  }

  function toggleCompPlay() {
    setCompPlaying(p => !p);
  }

  // Brief dip-to-black at any segment boundary that has a transition set
  // (all transition types render the same way in this single-element
  // preview; the chosen type is stored for the feed-side compositor).
  const compFlashOpacity = useMemo(() => {
    if (!activeSeg) return 1;
    const { segment, segStart } = activeSeg;
    const segEnd = segStart + segment.duration;
    let opacity = 1;
    if (segment.transitionIn !== 'none' && segment.transitionDuration > 0) {
      const t = (compTime - segStart) / segment.transitionDuration;
      if (t < 1) opacity = Math.min(opacity, Math.max(0, t));
    }
    const next = segments[activeSeg.index + 1];
    if (next && next.transitionIn !== 'none' && next.transitionDuration > 0) {
      const t = (segEnd - compTime) / next.transitionDuration;
      if (t < 1) opacity = Math.min(opacity, Math.max(0, t));
    }
    return opacity;
  }, [activeSeg, compTime, segments]);

  function addClipFromFile(file: File) {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const base: Clip = {
      id: Math.random().toString(36).slice(2),
      mediaURL: url,
      mediaType: isVideo ? 'video' : 'photo',
      sourceDuration: isVideo ? 0 : 5,
      inPoint: 0,
      outPoint: isVideo ? 0 : 5,
      transitionIn: 'none',
      transitionDuration: 0.5,
    };
    if (!isVideo) { addClip(base); return; }
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.src = url;
    probe.onloadedmetadata = () => {
      const d = Number.isFinite(probe.duration) ? probe.duration : 0;
      addClip({ ...base, sourceDuration: d, outPoint: d });
    };
  }

  function handleClipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    addClipFromFile(file);
    e.target.value = '';
  }

  function cycleTransition(clipId: string, current: TransitionType) {
    const idx = TRANSITIONS.findIndex(t => t.id === current);
    const next = TRANSITIONS[(idx + 1) % TRANSITIONS.length];
    updateClip(clipId, { transitionIn: next.id });
  }

  // Split whichever segment contains the composition playhead into two clips.
  function splitAtPlayhead() {
    if (!activeSeg) return;
    const { segment, index, localTime } = activeSeg;
    if (segment.outPoint - localTime < 0.3 || localTime - segment.inPoint < 0.3) return;

    if (index === 0) {
      // Splitting the primary clip: shorten it, and insert the remainder
      // as a new first entry in `clips`.
      const remainder: Clip = {
        id: Math.random().toString(36).slice(2),
        mediaURL: segment.mediaURL,
        mediaType: segment.mediaType,
        sourceDuration: session.mediaType === 'photo' ? (duration || 5) : duration,
        inPoint: localTime,
        outPoint: segment.outPoint,
        transitionIn: 'none',
        transitionDuration: 0.5,
      };
      setTrim(trimStart, localTime);
      insertClip(0, remainder);
    } else {
      const clip = clips[index - 1];
      const remainder: Clip = {
        id: Math.random().toString(36).slice(2),
        mediaURL: clip.mediaURL,
        mediaType: clip.mediaType,
        sourceDuration: clip.sourceDuration,
        inPoint: localTime,
        outPoint: clip.outPoint,
        transitionIn: 'none',
        transitionDuration: clip.transitionDuration,
      };
      updateClip(clip.id, { outPoint: localTime });
      insertClip(index, remainder);
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else           { v.play().catch(() => {}); setIsPlaying(true); }
  }

  function seekTo(t: number) {
    const v = videoRef.current;
    if (!v || !Number.isFinite(t)) return;
    const clamped = Math.max(0, Math.min(t, duration || t));
    v.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function addKeyMarker() {
    setKeyMarkers(m => [...m, currentTime]);
    if (!selectedOverlayId) return;
    const overlay = textOverlays.find(o => o.id === selectedOverlayId);
    if (!overlay) return;
    const cur = interpolateKeyframes(overlay.keyframes, currentTime);
    addOverlayKeyframe(selectedOverlayId, {
      time: currentTime,
      x: cur ? cur.x : overlay.x,
      y: cur ? cur.y : overlay.y,
      scale: cur ? cur.scale : 1,
      opacity: cur ? cur.opacity : 1,
    });
  }

  function applyTrim(start: number, end: number | null) {
    if (!Number.isFinite(start) || (end !== null && !Number.isFinite(end))) return;
    const clampedStart = Math.max(0, start);
    const clampedEnd   = end === null ? null : Math.max(clampedStart + 0.1, end);
    setTrimHistory(h => [...h, [trimStart, trimEnd]]);
    setTrim(clampedStart, clampedEnd);
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
  const zoomState = interpolateKeyframes(zoomKeyframes, currentTime);
  const zoomTransform = zoomState ? `scale(${zoomState.scale}) translate(${zoomState.x}%, ${zoomState.y}%)` : undefined;

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

  function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSound(file.name, URL.createObjectURL(file), 'device');
    e.target.value = '';
  }

  function addCaptionAtCurrentTime() {
    const start = currentTime;
    const end = Math.min(start + 3, duration || start + 3);
    addCaption({ id: Math.random().toString(36).slice(2), start, end, text: '' });
  }

  const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);

  function addZoomKeyframeAtPlayhead() {
    addZoomKeyframe({ time: currentTime, x: panX, y: panY, scale: zoomLevel, opacity: 1 });
  }

  async function runAutoTrack(kind: 'face' | 'object') {
    const v = videoRef.current;
    if (!v || duration <= 0) return;
    setTracking(kind);
    setTrackError(null);
    setTrackProgress(0);
    try {
      const kfs = kind === 'face'
        ? await trackFaceZoom(v, duration, zoomLevel, setTrackProgress)
        : await trackObjectZoom(v, duration, zoomLevel, setTrackProgress);
      setZoomKeyframes(kfs);
    } catch (err) {
      console.error(`${kind} tracking failed:`, err);
      setTrackError('Tracking failed to load. Check your connection and try again.');
    } finally {
      setTracking(null);
    }
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

      {/* ── MEDIA PREVIEW — top 60% ───────────────────────────────────────────── */}
      <div ref={previewRef} className="relative overflow-hidden flex-shrink-0" style={{ height: '60%' }}>
        {session.mediaType === 'text' ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--v-bg)' }}>
            <p className="text-white text-2xl font-black text-center px-8">{session.textContent}</p>
          </div>
        ) : session.mediaType === 'photo' ? (
          <img src={session.objectURL!} alt="edit" className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: cssFilter }} />
        ) : (
          <video ref={videoRef} src={session.objectURL!} className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: cssFilter, transform: zoomTransform, transition: tracking ? undefined : 'transform 0.1s linear' }} autoPlay loop playsInline muted />
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

        {/* Tint overlay */}
        {tintOverlay(adjustments) && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: tintOverlay(adjustments)!.color, opacity: tintOverlay(adjustments)!.opacity, mixBlendMode: 'soft-light' }} />
        )}

        {/* Grain overlay */}
        {adjustments.grain > 0 && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: adjustments.grain / 100,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }} />
        )}

        {/* Text overlays */}
        {textOverlays.map(overlay => {
          const kf = interpolateKeyframes(overlay.keyframes, currentTime);
          const x = kf ? kf.x : overlay.x;
          const y = kf ? kf.y : overlay.y;
          return (
            <motion.div key={`${overlay.id}-${overlay.x.toFixed(2)}-${overlay.y.toFixed(2)}`} drag dragMomentum={false}
              onDragEnd={(_, info) => {
                const el = previewRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                updateTextOverlay(overlay.id, {
                  x: Math.max(0, Math.min(90, overlay.x + (info.offset.x / rect.width) * 100)),
                  y: Math.max(0, Math.min(90, overlay.y + (info.offset.y / rect.height) * 100)),
                });
              }}
              onTap={() => setSelectedOverlayId(overlay.id)}
              style={{
                position: 'absolute',
                left: `${x}%`, top: `${y}%`,
                opacity: kf ? kf.opacity : 1,
                scale: kf ? kf.scale : 1,
                cursor: 'grab', touchAction: 'none', zIndex: 10,
                outline: selectedOverlayId === overlay.id ? '2px dashed #F59E0B' : 'none',
                outlineOffset: 2,
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
          );
        })}

        {/* Burned-in caption */}
        {activeCaption?.text && (
          <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ bottom: '8%', padding: '0 16px' }}>
            <span style={{
              fontSize: 16, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.6)',
              padding: '6px 14px', borderRadius: 8, textAlign: 'center', maxWidth: '90%',
            }}>
              {activeCaption.text}
            </span>
          </div>
        )}
      </div>

      {/* ── TOOL RAIL — below media ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 overflow-x-auto py-2 px-3"
        style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.6)' }}>
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

      {/* ── TOOL PANEL — fills remaining 40% below rail ──────────────────────── */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="flex-1 overflow-y-auto"
            style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.1)', minHeight: 0 }}>

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

            {/* ── EFFECTS (zoom/pan + auto face/object tracking) ── */}
            {activeTool === 'effects' && (
              <div className="p-4 space-y-4">
                <p className="text-white text-sm font-black">Effects</p>

                {session.mediaType !== 'video' ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    Zoom, pan, and auto-tracking effects are available for video clips.
                  </p>
                ) : (
                  <>
                    {/* Zoom level */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Zoom</span>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{zoomLevel.toFixed(1)}x</span>
                      </div>
                      <input type="range" min={1} max={3} step={0.1} value={zoomLevel}
                        onChange={e => setZoomLevel(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#1877F2' }} />
                    </div>

                    {/* Pan X/Y */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Pan X</span>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{panX}%</span>
                      </div>
                      <input type="range" min={-50} max={50} value={panX}
                        onChange={e => setPanX(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#1877F2' }} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Pan Y</span>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{panY}%</span>
                      </div>
                      <input type="range" min={-50} max={50} value={panY}
                        onChange={e => setPanY(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#1877F2' }} />
                    </div>

                    <button onClick={addZoomKeyframeAtPlayhead}
                      className="w-full py-2.5 rounded-2xl text-white font-black text-sm"
                      style={{ background: '#1877F2', border: 'none', cursor: 'pointer' }}>
                      Add keyframe at {fmt(currentTime)}
                    </button>

                    {/* Keyframe list */}
                    {zoomKeyframes.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{zoomKeyframes.length} keyframe{zoomKeyframes.length === 1 ? '' : 's'} {zoomKeyframes.length < 2 ? '(add 1 more to animate)' : ''}</span>
                          <button onClick={clearZoomKeyframes}
                            style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                            Clear all
                          </button>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {zoomKeyframes.map(k => (
                            <button key={k.time} onClick={() => removeZoomKeyframe(k.time)}
                              style={{ background: 'rgba(24,119,242,0.15)', color: '#1877F2', border: '1px solid rgba(24,119,242,0.4)', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                              {fmt(k.time)} · {k.scale.toFixed(1)}x ×
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-track */}
                    <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-white text-sm font-black">Auto Track</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        Automatically generate zoom &amp; pan keyframes that follow a face or object through the clip (replaces existing keyframes).
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => runAutoTrack('face')} disabled={!!tracking}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-black"
                          style={{ background: tracking === 'face' ? 'rgba(24,119,242,0.3)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: tracking ? 'default' : 'pointer', opacity: tracking && tracking !== 'face' ? 0.5 : 1 }}>
                          {tracking === 'face' ? `Tracking… ${trackProgress}%` : 'Track Face'}
                        </button>
                        <button onClick={() => runAutoTrack('object')} disabled={!!tracking}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-black"
                          style={{ background: tracking === 'object' ? 'rgba(24,119,242,0.3)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: tracking ? 'default' : 'pointer', opacity: tracking && tracking !== 'object' ? 0.5 : 1 }}>
                          {tracking === 'object' ? `Tracking… ${trackProgress}%` : 'Track Object'}
                        </button>
                      </div>
                      {trackError && (
                        <p style={{ color: '#EF4444', fontSize: 11 }}>{trackError}</p>
                      )}
                    </div>
                  </>
                )}
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

                {/* Animate (keyframes) */}
                {textOverlays.length > 0 && (
                  <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-white text-sm font-black">Animate</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      Tap a text layer to select it, drag it to where it should appear, then tap the star on the Trim tab to drop a keyframe. Add 2+ keyframes to animate it.
                    </p>
                    {textOverlays.map(o => (
                      <div key={o.id} className="p-2.5 rounded-xl space-y-1.5"
                        style={{ background: selectedOverlayId === o.id ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)', border: selectedOverlayId === o.id ? '1px solid #F59E0B' : '1px solid transparent' }}>
                        <div className="flex items-center justify-between gap-2">
                          <button onClick={() => setSelectedOverlayId(o.id)}
                            className="flex-1 text-left truncate"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                            "{o.text}"
                          </button>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{(o.keyframes?.length ?? 0)} keyframes</span>
                          {o.keyframes && o.keyframes.length > 0 && (
                            <button onClick={() => clearOverlayKeyframes(o.id)}
                              style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                              Clear
                            </button>
                          )}
                        </div>
                        {o.keyframes && o.keyframes.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {o.keyframes.map(k => (
                              <button key={k.time} onClick={() => removeOverlayKeyframe(o.id, k.time)}
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                {fmt(k.time)} ×
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioFile} style={{ display: 'none' }} />
                {soundTitle ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">{soundTitle}</p>
                    </div>
                    <button onClick={clearSound} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
                  </div>
                ) : showSoundLibrary ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setShowSoundLibrary(false)}
                      className="flex items-center gap-2 px-1 py-1 text-left w-full"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>
                      ← Back
                    </button>
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {VILLAGE_SONGS.map(song => (
                        <button key={song.id}
                          onClick={() => { setSound(song.title, song.file, 'library'); setShowSoundLibrary(false); }}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full"
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                          <span style={{ fontSize: 18 }}>🎼</span>
                          <span className="text-sm font-bold">{song.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => audioInputRef.current?.click()}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full"
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                      <span style={{ fontSize: 20 }}>🎙</span>
                      <span className="text-sm font-bold">My Sounds</span>
                    </button>
                    <button onClick={() => setShowSoundLibrary(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left w-full"
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#fff' }}>
                      <span style={{ fontSize: 20 }}>🎼</span>
                      <span className="text-sm font-bold">Sound Library</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TRIM ── */}
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

            {/* ── TIMELINE (multi-clip tracks) ── */}
            {activeTool === 'timeline' && session.mediaType !== 'text' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-black">Timeline</p>
                  <input ref={clipInputRef} type="file" accept="video/*,image/*" onChange={handleClipFile} style={{ display: 'none' }} />
                  <button onClick={() => clipInputRef.current?.click()}
                    style={{ color: '#1877F2', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    + Add clip
                  </button>
                </div>

                {/* Composition preview */}
                <div className="relative rounded-xl overflow-hidden" style={{ height: 140, background: '#000' }}>
                  {activeSeg?.segment.mediaType === 'video' ? (
                    <video ref={compVideoRef} className="absolute inset-0 w-full h-full object-contain"
                      style={{ opacity: compFlashOpacity }} playsInline muted />
                  ) : activeSeg ? (
                    <img src={activeSeg.segment.mediaURL} alt="clip" className="absolute inset-0 w-full h-full object-contain"
                      style={{ opacity: compFlashOpacity }} />
                  ) : null}
                  <button onClick={toggleCompPlay}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        {compPlaying
                          ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                          : <polygon points="5 3 19 12 5 21 5 3"/>}
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Position + split */}
                <div className="flex items-center justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(compTime)} / {fmt(compDuration)}
                  </span>
                  <button onClick={splitAtPlayhead}
                    style={{ color: '#1877F2', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Split at playhead
                  </button>
                </div>

                {/* Segment strip */}
                <div ref={compStripRef} className="relative rounded-lg overflow-hidden flex select-none"
                  style={{ height: 44, background: 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  onClick={e => {
                    const rect = compStripRef.current!.getBoundingClientRect();
                    seekComp(((e.clientX - rect.left) / rect.width) * (compDuration || 0));
                  }}>
                  {segments.map((seg, i) => (
                    <div key={seg.id} className="relative h-full flex items-center justify-center"
                      style={{
                        width: `${(seg.duration / (compDuration || 1)) * 100}%`,
                        background: i === activeSeg?.index ? 'rgba(24,119,242,0.35)' : 'rgba(124,58,237,0.25)',
                        borderRight: i < segments.length - 1 ? '2px solid #0a0a14' : 'none',
                      }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>
                        {i === 0 ? 'Main' : `Clip ${i + 1}`}
                      </span>
                      {seg.transitionIn !== 'none' && (
                        <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ background: '#F59E0B' }} />
                      )}
                    </div>
                  ))}
                  {/* Playhead */}
                  {compDuration > 0 && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${(compTime / compDuration) * 100}%`, boxShadow: '0 0 4px rgba(255,255,255,0.8)' }}>
                      <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                {/* Primary clip note */}
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Main clip — {fmt((trimEnd ?? duration) - trimStart)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 'auto' }}>Edit trim in the Trim tab</span>
                </div>

                {/* Additional clips */}
                {clips.map((c, i) => (
                  <div key={c.id} className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Clip {i + 2} · {c.mediaType === 'video' ? 'Video' : 'Photo'}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => reorderClip(c.id, -1)} disabled={i === 0}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', opacity: i === 0 ? 0.3 : 1, fontSize: 14 }}>↑</button>
                        <button onClick={() => reorderClip(c.id, 1)} disabled={i === clips.length - 1}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', opacity: i === clips.length - 1 ? 0.3 : 1, fontSize: 14 }}>↓</button>
                        <button onClick={() => removeClip(c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 16 }}>×</button>
                      </div>
                    </div>

                    {c.mediaType === 'video' && c.sourceDuration > 0 && (
                      <>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Start</span>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{fmt(c.inPoint)}</span>
                          </div>
                          <input type="range" min={0} max={c.sourceDuration} step={0.1} value={c.inPoint}
                            onChange={e => updateClip(c.id, { inPoint: Math.min(Number(e.target.value), c.outPoint - 0.1) })}
                            className="w-full" style={{ accentColor: '#1877F2' }} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>End</span>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{fmt(c.outPoint)}</span>
                          </div>
                          <input type="range" min={0} max={c.sourceDuration} step={0.1} value={c.outPoint}
                            onChange={e => updateClip(c.id, { outPoint: Math.max(Number(e.target.value), c.inPoint + 0.1) })}
                            className="w-full" style={{ accentColor: '#1877F2' }} />
                        </div>
                      </>
                    )}

                    {/* Transition into this clip */}
                    <button onClick={() => cycleTransition(c.id, c.transitionIn)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}>
                      <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>Transition in</span>
                      <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>{TRANSITIONS.find(t => t.id === c.transitionIn)?.label}</span>
                    </button>
                  </div>
                ))}

                {clips.length === 0 && (
                  <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      Add another clip to build a multi-clip sequence with cuts and transitions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── CAPTIONS ── */}
            {activeTool === 'captions' && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-white text-sm font-black">Captions</p>
                  {session.mediaType === 'video' && (
                    <button onClick={addCaptionAtCurrentTime}
                      style={{ color: '#1877F2', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      + Add at {fmt(currentTime)}
                    </button>
                  )}
                </div>

                {session.mediaType !== 'video' ? (
                  <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Captions are available for video posts.</p>
                  </div>
                ) : captions.length === 0 ? (
                  <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      No captions yet. Play the video, pause where you want a caption, and tap "Add at …".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {captions.map(c => (
                      <div key={c.id} className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <button onClick={() => seekTo(c.start)}
                            style={{ color: '#1877F2', fontSize: 11, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(c.start)} – {fmt(c.end)}
                          </button>
                          <button onClick={() => removeCaption(c.id)}
                            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                        </div>
                        <input value={c.text} onChange={e => updateCaption(c.id, { text: e.target.value })}
                          placeholder="Caption text…"
                          className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                )}
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
