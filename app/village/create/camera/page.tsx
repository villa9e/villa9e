'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { setSessionMedia, setSessionText } from '@/lib/create/session';
import { useCreateStore, CSS_FILTERS } from '@/lib/create/store';

// ─── Types ────────────────────────────────────────────────────────────────────
type CaptureMode    = 'photo' | 'video' | 'text' | 'upload';
type VideoDuration  = 30 | 60 | 0;   // 0 = freeform (10 min max)
type VideoSpeed     = 0.5 | 1 | 2;
type ScreenFormat   = 'full' | 'split-top' | 'split-bottom';
type BgMode         = 'normal' | 'blur' | 'polish';
type MusicTab       = 'audio' | 'spotify' | 'sounds';

const TIMER_OPTIONS = [0, 3, 5, 10] as const;

const FILTER_LIST   = Object.keys(CSS_FILTERS);
const FILTER_LABELS: Record<string, string> = {
  normal: 'None', vivid: 'Vivid', fade: 'Fade', drama: 'Drama',
  warm: 'Warm', cool: 'Cool', noir: 'B&W', golden: 'Golden',
  matte: 'Matte', vivid2: 'Vivid+',
};

// Spotify mock track categories
const SPOTIFY_TRACKS = {
  Hype:  ["Run the World - Beyonce", "Power - Kanye West", "God's Plan - Drake"],
  Focus: ["Weightless - Marconi Union", "Experience - Ludovico Einaudi", "River Flows in You - Yiruma"],
  Calm:  ["Gymnopedie No. 1 - Satie", "Holocene - Bon Iver", "Skinny Love - Bon Iver"],
};

function cssFilter(name: string): string {
  return CSS_FILTERS[name] ?? '';
}

// ─── SVG Icons (white, no emojis) ─────────────────────────────────────────────
function MusicNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function TeepeeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21L12 5l7 16M9 21v-6a3 3 0 016 0v6"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l3 3"/><path d="M9 2h6M12 2v2"/>
    </svg>
  );
}

function FormatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function BgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M4 4l3 3M17 4l-3 3M4 20l3-3M17 20l-3-3"/>
    </svg>
  );
}

function CameraFlipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M1 4v6h6M23 20v-6h-6"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function SoundFileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

// ─── Pill selector sub-component ─────────────────────────────────────────────
function PillRow<T extends string | number>({
  options, value, onChange, labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string | number, string>;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(opt => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: value === opt ? 'white' : 'rgba(255,255,255,0.18)',
            color: value === opt ? '#000' : '#fff',
            transition: 'background 0.15s',
          }}>
          {labels ? (labels[opt as string | number] ?? String(opt)) : String(opt)}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CameraPage() {
  const router    = useRouter();
  const resetAll  = useCreateStore(s => s.resetAll);

  // Camera refs
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdIntRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera settings
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraReady, setCameraReady]   = useState(false);
  const [cameraError, setCameraError]   = useState('');

  // Capture state
  const [mode, setMode]             = useState<CaptureMode>('video');
  const [duration, setDuration]     = useState<VideoDuration>(60);
  const [elapsed, setElapsed]       = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speed, setSpeed]           = useState<VideoSpeed>(1);
  const [capturedURL, setCapturedURL]   = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'photo' | 'video'>('photo');
  const [countdown, setCountdown]   = useState<number | null>(null);

  // Filter / format / bg
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [format, setFormat]     = useState<ScreenFormat>('full');
  const [bgMode, setBgMode]     = useState<BgMode>('normal');
  const [timerSecs, setTimerSecs] = useState<number>(0);

  // UI panel state
  const [showLogoMenu, setShowLogoMenu]     = useState(false);
  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [musicTab, setMusicTab]             = useState<MusicTab>('audio');
  const [spotifyQuery, setSpotifyQuery]     = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Text mode
  const [textContent, setTextContent] = useState('');
  const [textStyle, setTextStyle]     = useState('bold');
  const TEXT_STYLES = ['bold', 'handwritten', 'display', 'elegant', 'casual'];

  // ── Derived CSS filter for video ─────────────────────────────────────────
  function buildVideoStyle(): React.CSSProperties {
    let filter = cssFilter(selectedFilter);
    if (bgMode === 'blur')    filter = `${filter} blur(8px)`.trim();
    if (bgMode === 'polish')  filter = `${filter} brightness(1.08) contrast(1.05)`.trim();
    return {
      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
      filter: filter || undefined,
      ...(format === 'split-top'    ? { top: 0, height: '50%', position: 'absolute' as const }    : {}),
      ...(format === 'split-bottom' ? { bottom: 0, top: 'auto', height: '50%', position: 'absolute' as const } : {}),
    };
  }

  // ── Camera init ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') ||
          msg.toLowerCase().includes('notallowed')) {
        setCameraError('Camera access needed to record. Please enable in browser settings.');
      } else {
        setCameraError('Camera not available on this device.');
      }
    }
  }, []);

  useEffect(() => {
    resetAll();
    startCamera('user');
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerIntRef.current) clearInterval(timerIntRef.current);
      if (cdIntRef.current) clearInterval(cdIntRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flipCamera() {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
    setShowLogoMenu(false);
    haptic();
  }

  function haptic() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
  }

  // ── Photo capture ────────────────────────────────────────────────────────
  function capturePhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.filter = cssFilter(selectedFilter);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = setSessionMedia(blob, 'photo');
      useCreateStore.getState().setFilter(selectedFilter);
      router.push(`/village/create/edit?photoUrl=${encodeURIComponent(url)}`);
    }, 'image/jpeg', 0.92);
    haptic();
  }

  // ── Video recording ──────────────────────────────────────────────────────
  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];

    // Slow motion: request high framerate so playback at 0.5x is smooth
    const fps = speed === 0.5 ? 60 : 30;
    const constraints: MediaTrackConstraints = { frameRate: { ideal: fps } };
    stream.getVideoTracks().forEach(t => { t.applyConstraints(constraints).catch(() => {}); });

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url  = setSessionMedia(blob, 'video');
      // Attach playback metadata
      useCreateStore.getState().setFilter(selectedFilter);
      useCreateStore.getState().setPlaybackSpeed(speed === 0.5 ? 0.5 : speed === 2 ? 2 : 1);
      setIsRecording(false);
      if (timerIntRef.current) clearInterval(timerIntRef.current);
      router.push(`/village/create/edit?videoUrl=${encodeURIComponent(url)}`);
    };

    recorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
    setElapsed(0);

    timerIntRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        const maxSecs = duration === 0 ? 600 : duration;
        if (next >= maxSecs) {
          stopRecording();
          return prev;
        }
        return next;
      });
    }, 1000);
    haptic();
  }

  function stopRecording() {
    recorderRef.current?.stop();
    if (timerIntRef.current) clearInterval(timerIntRef.current);
    haptic();
  }

  // ── Record button press (with optional countdown) ────────────────────────
  function handleRecordPress() {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (mode === 'photo') {
      capturePhoto();
      return;
    }
    if (mode === 'text') {
      router.push('/village/create/post-details?mode=text');
      return;
    }

    if (timerSecs > 0) {
      let cd = timerSecs;
      setCountdown(cd);
      cdIntRef.current = setInterval(() => {
        cd -= 1;
        if (cd <= 0) {
          clearInterval(cdIntRef.current!);
          cdIntRef.current = null;
          setCountdown(null);
          startRecording();
        } else {
          setCountdown(cd);
        }
      }, 1000);
    } else {
      startRecording();
    }
  }

  // ── Upload from device ────────────────────────────────────────────────────
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video/');
    const url   = setSessionMedia(file, isVid ? 'video' : 'photo');
    useCreateStore.getState().setFilter(selectedFilter);
    router.push(`/village/create/edit?${isVid ? 'videoUrl' : 'photoUrl'}=${encodeURIComponent(url)}`);
  }

  function goToTextEdit() {
    setSessionText(textContent, textStyle);
    router.push('/village/create/post-details?mode=text');
  }

  // ── Progress ring ────────────────────────────────────────────────────────
  const maxSecs    = duration === 0 ? 600 : duration;
  const progress   = Math.min(elapsed / maxSecs, 1);
  const radius     = 32;
  const circ       = 2 * Math.PI * radius;
  const strokeDash = circ * (1 - progress);

  const speedLabel = speed === 0.5 ? '0.5×' : speed === 2 ? '2×' : '';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ zIndex: 100 }}>

      {/* ── CAMERA FEED ─────────────────────────────────────────────────────── */}
      {mode !== 'text' && (
        <video
          ref={videoRef}
          className={format === 'full' ? 'absolute inset-0 w-full h-full object-cover' : 'absolute w-full object-cover'}
          style={buildVideoStyle()}
          autoPlay playsInline muted
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── CAMERA ERROR ─────────────────────────────────────────────────────── */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-5 z-30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p className="text-white text-center text-sm font-medium leading-relaxed max-w-xs">
            Camera access needed to record.<br/>Please enable in browser settings.
          </p>
          <button
            onClick={() => { setCameraError(''); startCamera(facingMode); }}
            style={{
              padding: '10px 28px', borderRadius: 24, fontWeight: 700, fontSize: 14,
              background: '#2952E8', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
            Retry
          </button>
        </div>
      )}

      {/* ── TEXT MODE ──────────────────────────────────────────────────────── */}
      {mode === 'text' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-4"
          style={{ background: 'var(--v-bg, #080E24)' }}>
          <div className="flex gap-2 flex-wrap justify-center">
            {TEXT_STYLES.map(s => (
              <button key={s} onClick={() => setTextStyle(s)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: textStyle === s ? '#2952E8' : 'rgba(255,255,255,0.12)',
                  color: '#fff', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                }}>
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder="Write something meaningful…"
            autoFocus
            rows={6}
            className="w-full text-center text-white text-2xl font-bold resize-none focus:outline-none bg-transparent"
            style={{
              fontFamily: textStyle === 'handwritten' ? 'cursive' : textStyle === 'elegant' ? 'Georgia, serif' : 'system-ui',
              lineHeight: 1.4,
            }}
          />
          {textContent.trim() && (
            <button onClick={goToTextEdit}
              style={{ padding: '12px 32px', borderRadius: 28, background: '#2952E8', color: '#fff', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Next
            </button>
          )}
        </div>
      )}

      {/* ── COUNTDOWN OVERLAY ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span
              key={countdown}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ color: '#fff', fontSize: 128, fontWeight: 900, textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}>
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECORDING TIMER TOP-CENTER ─────────────────────────────────────── */}
      {isRecording && (
        <div
          className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full z-20"
          style={{
            top: 'max(env(safe-area-inset-top), 14px)',
            left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.5)',
          }}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
            {duration > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                /{String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}
              </span>
            )}
          </span>
          {speedLabel && (
            <span style={{ color: '#60A5FA', fontSize: 11, fontWeight: 800 }}>{speedLabel}</span>
          )}
        </div>
      )}

      {/* ── TOP BAR — hidden while actively recording ─────────────────────── */}
      {!isRecording && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-20"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>

          {/* Left: X close + music note */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <CloseIcon />
            </button>
            <button
              onClick={() => { setShowMusicSheet(true); setShowLogoMenu(false); haptic(); }}
              style={{
                background: 'rgba(0,0,0,0.38)', border: 'none', cursor: 'pointer',
                borderRadius: 20, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <MusicNoteIcon />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Sound</span>
            </button>
          </div>

          {/* Right: Teepee logo menu trigger */}
          <div style={{ position: 'relative' }}>
            <motion.button
              onClick={() => { setShowLogoMenu(m => !m); haptic(); }}
              whileTap={{ scale: 0.85 }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <TeepeeIcon />
            </motion.button>

            {/* Teepee dropdown */}
            <AnimatePresence>
              {showLogoMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 rounded-2xl overflow-hidden z-30"
                  style={{
                    top: 40, minWidth: 220,
                    background: 'rgba(14,20,40,0.96)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(16px)',
                  }}>

                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Countdown timer */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TimerIcon />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>TIMER</span>
                      </div>
                      <PillRow
                        options={[0, 3, 5, 10] as const}
                        value={timerSecs}
                        onChange={v => { setTimerSecs(v); haptic(); }}
                        labels={{ 0: 'Off', 3: '3s', 5: '5s', 10: '10s' }}
                      />
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                    {/* Format */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FormatIcon />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>FORMAT</span>
                      </div>
                      <PillRow
                        options={['full', 'split-top', 'split-bottom'] as const}
                        value={format}
                        onChange={v => { setFormat(v); haptic(); }}
                        labels={{ 'full': 'Full Screen', 'split-top': 'Split Top', 'split-bottom': 'Split Bottom' }}
                      />
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                    {/* Filter */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FilterIcon />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>FILTER</span>
                      </div>
                      <PillRow
                        options={['normal', 'warm', 'cool', 'noir', 'vivid'] as const}
                        value={selectedFilter}
                        onChange={v => { setSelectedFilter(v); haptic(); }}
                        labels={{ normal: 'None', warm: 'Warm', cool: 'Cool', noir: 'B&W', vivid: 'Vivid' }}
                      />
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                    {/* Background */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BgIcon />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>BACKGROUND</span>
                      </div>
                      <PillRow
                        options={['normal', 'blur', 'polish'] as const}
                        value={bgMode}
                        onChange={v => { setBgMode(v); haptic(); }}
                        labels={{ normal: 'Normal', blur: 'Blur', polish: 'Polish' }}
                      />
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                    {/* Camera flip */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CameraFlipIcon />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>CAMERA</span>
                      </div>
                      <PillRow
                        options={['user', 'environment'] as const}
                        value={facingMode}
                        onChange={v => {
                          setFacingMode(v);
                          startCamera(v);
                          setShowLogoMenu(false);
                          haptic();
                        }}
                        labels={{ user: 'Front', environment: 'Back' }}
                      />
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROLS — hidden while recording (except record btn) ───── */}
      {!capturedURL && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}>

          {/* Video duration — only in video mode, not recording */}
          {mode === 'video' && !isRecording && (
            <div className="flex justify-center gap-3 mb-3">
              {([30, 60, 0] as VideoDuration[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: duration === d ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                    color: duration === d ? '#000' : '#fff',
                    border: 'none', cursor: 'pointer',
                  }}>
                  {d === 0 ? 'Free (10min)' : `${d}s`}
                </button>
              ))}
            </div>
          )}

          {/* Mode switcher — hidden while recording */}
          {!isRecording && (
            <div
              className="flex justify-center gap-5 mb-5"
              style={{ overflowX: 'auto', scrollbarWidth: 'none', paddingLeft: 16, paddingRight: 16 }}>
              {(['photo', 'video', 'text'] as CaptureMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontSize: 14, fontWeight: 700,
                    borderBottom: mode === m ? '2px solid #fff' : '2px solid transparent',
                    paddingBottom: 3, textTransform: 'capitalize', flexShrink: 0,
                  }}>
                  {m}
                </button>
              ))}
              {/* Upload — label acts as the mode tab */}
              <label style={{ cursor: 'pointer', flexShrink: 0 }}>
                <span
                  style={{
                    color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontSize: 14, fontWeight: 700,
                    borderBottom: mode === 'upload' ? '2px solid #fff' : '2px solid transparent',
                    paddingBottom: 3, display: 'block',
                  }}>
                  Upload
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={handleUpload}
                  onClick={() => setMode('upload')}
                />
              </label>
            </div>
          )}

          {/* Record row — always shown (just stop btn during recording) */}
          <div className="flex items-center justify-center gap-10">

            {/* Slow motion — left of record, video mode */}
            {mode === 'video' ? (
              <button
                onClick={() => { setSpeed(s => s === 0.5 ? 1 : 0.5); haptic(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  opacity: speed === 0.5 ? 1 : 0.45,
                }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polygon points="19 20 9 12 19 4 19 20"/>
                  <line x1="5" y1="19" x2="5" y2="5"/>
                </svg>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>0.5×</span>
              </button>
            ) : (
              <div style={{ width: 36 }} />
            )}

            {/* Record / stop / photo button */}
            <button
              onClick={handleRecordPress}
              disabled={countdown !== null}
              style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: '4px solid white',
                background: 'none',
                cursor: countdown !== null ? 'default' : 'pointer',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>

              {/* SVG progress ring */}
              {mode === 'video' && (
                <svg
                  className="absolute inset-0"
                  width="80" height="80"
                  style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r={radius} fill="none"
                    stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  {isRecording && (
                    <circle cx="40" cy="40" r={radius} fill="none"
                      stroke="#EF4444" strokeWidth="4"
                      strokeDasharray={circ}
                      strokeDashoffset={strokeDash}
                      style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                    />
                  )}
                </svg>
              )}

              {/* Button inner */}
              {isRecording ? (
                /* Stop square */
                <div style={{ width: 28, height: 28, background: '#EF4444', borderRadius: 6 }} />
              ) : mode === 'photo' ? (
                /* White fill circle for photo */
                <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#fff' }} />
              ) : (
                /* Red circle for video/upload */
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#EF4444' }} />
              )}
            </button>

            {/* Fast motion — right of record, video mode */}
            {mode === 'video' ? (
              <button
                onClick={() => { setSpeed(s => s === 2 ? 1 : 2); haptic(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  opacity: speed === 2 ? 1 : 0.45,
                }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>Fast</span>
              </button>
            ) : (
              <div style={{ width: 36 }} />
            )}
          </div>
        </div>
      )}

      {/* ── MUSIC BOTTOM SHEET ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMusicSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.65)' }}
              onClick={() => setShowMusicSheet(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />

            {/* Sheet */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl z-50 flex flex-col"
              style={{ background: '#0E1428', maxHeight: '72%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-1 pb-3">
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 900 }}>Add Sound</p>
                <button
                  onClick={() => setShowMusicSheet(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 24, lineHeight: 1 }}>
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 px-5 mb-1"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {([
                  { key: 'audio' as MusicTab, label: 'Audio Overlay' },
                  { key: 'spotify' as MusicTab, label: 'Spotify Music' },
                  { key: 'sounds' as MusicTab, label: 'User Sounds' },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMusicTab(tab.key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 14px', fontSize: 13, fontWeight: 700,
                      color: musicTab === tab.key ? '#fff' : 'rgba(255,255,255,0.38)',
                      borderBottom: musicTab === tab.key ? '2px solid #2952E8' : '2px solid transparent',
                      marginBottom: -1, flexShrink: 0,
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>

                {/* Audio Overlay tab */}
                {musicTab === 'audio' && (
                  <div className="flex flex-col items-center gap-5 pt-4">
                    <div
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: isRecordingVoice ? 'rgba(239,68,68,0.18)' : 'rgba(41,82,232,0.18)',
                        border: `2px solid ${isRecordingVoice ? '#EF4444' : '#2952E8'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <MicIcon />
                    </div>
                    {isRecordingVoice && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Recording voice-over…</span>
                      </div>
                    )}
                    <button
                      onClick={() => setIsRecordingVoice(v => !v)}
                      style={{
                        padding: '12px 32px', borderRadius: 28, fontWeight: 800, fontSize: 14,
                        background: isRecordingVoice ? '#EF4444' : '#2952E8',
                        color: '#fff', border: 'none', cursor: 'pointer',
                      }}>
                      {isRecordingVoice ? 'Stop Recording' : 'Record Voice-over'}
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' }}>
                      Record a voice-over that will layer over your video
                    </p>
                  </div>
                )}

                {/* Spotify Music tab */}
                {musicTab === 'spotify' && (
                  <div className="flex flex-col gap-4">
                    <input
                      value={spotifyQuery}
                      onChange={e => setSpotifyQuery(e.target.value)}
                      placeholder="Search Spotify tracks…"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 14,
                        background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)',
                        outline: 'none',
                      }}
                    />
                    {(Object.keys(SPOTIFY_TRACKS) as Array<keyof typeof SPOTIFY_TRACKS>).map(cat => (
                      <div key={cat}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>
                          {cat.toUpperCase()}
                        </p>
                        {SPOTIFY_TRACKS[cat].map(track => (
                          <button
                            key={track}
                            onClick={() => setShowMusicSheet(false)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                              background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
                              textAlign: 'left',
                            }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 6,
                              background: 'linear-gradient(135deg, #1DB954, #191414)',
                              flexShrink: 0,
                            }} />
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{track}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* User Sounds tab */}
                {musicTab === 'sounds' && (
                  <div className="flex flex-col gap-2 pt-2">
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>
                      Your uploaded audio from Studio
                    </p>
                    {/* Mock list — in real app pull from studio_videos table */}
                    {['Intro Beat.mp3', 'Hype Loop.mp3', 'Chill Vibe.mp3'].map(file => (
                      <button
                        key={file}
                        onClick={() => setShowMusicSheet(false)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer',
                          textAlign: 'left',
                        }}>
                        <SoundFileIcon />
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{file}</span>
                      </button>
                    ))}
                    <button
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 14px', borderRadius: 12, marginTop: 4,
                        background: 'rgba(41,82,232,0.15)', border: '1px dashed rgba(41,82,232,0.4)',
                        cursor: 'pointer',
                      }}>
                      <UploadIcon />
                      <span style={{ color: '#2952E8', fontSize: 13, fontWeight: 700 }}>Upload Audio File</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Close logo menu on outside tap */}
      {showLogoMenu && (
        <div
          className="absolute inset-0 z-10"
          onClick={() => setShowLogoMenu(false)}
        />
      )}
    </div>
  );
}
