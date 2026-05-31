'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { setSessionMedia, setSessionText } from '@/lib/create/session';
import { useCreateStore, CSS_FILTERS } from '@/lib/create/store';

type CaptureMode = 'photo' | 'video' | 'text' | 'upload';
type VideoDuration = 30 | 60 | 0; // 0 = freeform
type VideoSpeed = 0.5 | 1 | 2;
type ScreenFormat = 'full' | 'split-top' | 'split-bottom';

const FILTERS_LIST = Object.keys(CSS_FILTERS);

const TIMER_OPTIONS = [0, 3, 5, 10] as const;

// ── CSS filter string per filter name ────────────────────────────────────────
function filterCss(name: string): string {
  return CSS_FILTERS[name] ?? '';
}

export default function CreatePage() {
  const router = useRouter();
  const resetAll = useCreateStore(s => s.resetAll);
  const setFilter = useCreateStore(s => s.setFilter);

  // Camera
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdIntRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // UI state
  const [mode, setMode]             = useState<CaptureMode>('video');
  const [duration, setDuration]     = useState<VideoDuration>(60);
  const [elapsed, setElapsed]       = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speed, setSpeed]           = useState<VideoSpeed>(1);
  const [format, setFormat]         = useState<ScreenFormat>('full');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [showLogoMenu, setShowLogoMenu] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showFilterStrip, setShowFilterStrip] = useState(false);
  const [timerSecs, setTimerSecs]   = useState<number>(0);
  const [countdown, setCountdown]   = useState<number | null>(null);

  // Captured
  const [capturedURL, setCapturedURL] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'photo' | 'video'>('photo');

  // Text mode
  const [textContent, setTextContent] = useState('');
  const [textStyle, setTextStyle]     = useState('bold');
  const TEXT_STYLES = ['bold', 'handwritten', 'display', 'elegant', 'casual'];

  // ── Start camera ──────────────────────────────────────────────────────────
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
    } catch (err: any) {
      setCameraError(err?.message?.includes('Permission')
        ? 'Camera permission denied. Please allow camera access and reload.'
        : 'Camera not available on this device.');
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
  }, []);

  function flipCamera() {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
    haptic();
  }

  function haptic() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(20);
  }

  // ── Capture photo ─────────────────────────────────────────────────────────
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
    ctx.filter = filterCss(selectedFilter);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = setSessionMedia(blob, 'photo');
      setCapturedURL(url);
      setCapturedType('photo');
    }, 'image/jpeg', 0.92);
    haptic();
  }

  // ── Start / stop video recording ─────────────────────────────────────────
  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url  = setSessionMedia(blob, 'video');
      setCapturedURL(url);
      setCapturedType('video');
      setIsRecording(false);
      if (timerIntRef.current) clearInterval(timerIntRef.current);
    };
    recorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
    setElapsed(0);

    timerIntRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (duration > 0 && next >= duration) stopRecording();
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

  // ── Record button handler (with optional countdown) ───────────────────────
  function handleRecordPress() {
    if (isRecording) { stopRecording(); return; }
    if (mode === 'photo') { capturePhoto(); return; }

    if (timerSecs > 0) {
      setCountdown(timerSecs);
      let cd = timerSecs;
      cdIntRef.current = setInterval(() => {
        cd -= 1;
        if (cd <= 0) {
          clearInterval(cdIntRef.current!);
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
    const url = setSessionMedia(file, isVid ? 'video' : 'photo');
    setCapturedURL(url);
    setCapturedType(isVid ? 'video' : 'photo');
  }

  function retake() {
    setCapturedURL(null);
    setElapsed(0);
  }

  function goToEdit() {
    if (mode === 'text') {
      setSessionText(textContent, textStyle);
    }
    useCreateStore.getState().setFilter(selectedFilter);
    router.push('/village/create/edit');
  }

  // ── Progress ring for recording ───────────────────────────────────────────
  const maxSecs    = duration > 0 ? duration : 600;
  const progress   = Math.min(elapsed / maxSecs, 1);
  const radius     = 32;
  const circ       = 2 * Math.PI * radius;
  const strokeDash = circ * (1 - progress);

  // ── Speed label ───────────────────────────────────────────────────────────
  const speedLabel = speed === 0.5 ? '0.5×' : speed === 2 ? '2×' : '';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ zIndex: 100 }}>

      {/* ── CAMERA FEED ─────────────────────────────────────────────────────── */}
      {!capturedURL && mode !== 'text' && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            filter: filterCss(selectedFilter),
            ...(format === 'split-top'    ? { top: 0, height: '50%' }    : {}),
            ...(format === 'split-bottom' ? { bottom: 0, top: '50%', height: '50%' } : {}),
          }}
          autoPlay playsInline muted
        />
      )}
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── CAPTURED MEDIA PREVIEW ─────────────────────────────────────────── */}
      {capturedURL && (
        <div className="absolute inset-0">
          {capturedType === 'photo'
            ? <img src={capturedURL} alt="capture" className="absolute inset-0 w-full h-full object-cover" />
            : <video src={capturedURL} className="absolute inset-0 w-full h-full object-cover"
                autoPlay loop playsInline muted
                style={{ playbackRate: speed } as any} />
          }
          {/* Use / Retake */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-20">
            <button onClick={retake}
              className="px-8 py-3 rounded-full text-white font-bold text-sm"
              style={{ background: 'rgba(0,0,0,0.6)', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              Retake
            </button>
            <button onClick={goToEdit}
              className="px-8 py-3 rounded-full text-white font-black text-sm"
              style={{ background: '#1877F2' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── TEXT MODE ──────────────────────────────────────────────────────── */}
      {mode === 'text' && !capturedURL && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8"
          style={{ background: '#0A0B12' }}>
          {/* Style selector */}
          <div className="flex gap-3 mb-6 flex-wrap justify-center">
            {TEXT_STYLES.map(s => (
              <button key={s} onClick={() => setTextStyle(s)}
                className="px-3 py-1.5 rounded-full text-xs font-bold capitalize"
                style={{ background: textStyle === s ? '#1877F2' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>
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
              fontFamily: textStyle === 'handwritten' ? 'cursive' : textStyle === 'elegant' ? 'serif' : 'sans-serif',
              lineHeight: 1.4,
            }}
          />
          {textContent.trim() && (
            <button onClick={goToEdit}
              className="mt-8 px-10 py-3 rounded-full text-white font-black text-sm"
              style={{ background: '#1877F2' }}>
              Next →
            </button>
          )}
        </div>
      )}

      {/* ── CAMERA ERROR ─────────────────────────────────────────────────────── */}
      {cameraError && !capturedURL && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p className="text-white text-center text-sm">{cameraError}</p>
        </div>
      )}

      {/* ── COUNTDOWN OVERLAY ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span
              key={countdown}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              style={{ color: '#fff', fontSize: 120, fontWeight: 900, textShadow: '0 4px 32px rgba(0,0,0,0.8)' }}>
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      {!capturedURL && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 z-20"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>

          {/* Close */}
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Music note */}
          <button onClick={() => setShowMusicPicker(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </button>

          {/* Village tent logo */}
          <motion.button
            onClick={() => { setShowLogoMenu(m => !m); haptic(); }}
            whileTap={{ scale: 0.85 }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
            {/* Tent SVG */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21L12 5l7 16M9 21v-6a3 3 0 016 0v6"/>
            </svg>
            {showLogoMenu && (
              <motion.span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"
                initial={{ scale: 0 }} animate={{ scale: 1 }} />
            )}
          </motion.button>
        </div>
      )}

      {/* ── TENT DROPDOWN MENU ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLogoMenu && !capturedURL && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="absolute flex flex-col gap-5 z-20"
            style={{ top: 80, right: 20 }}>

            {/* Timer */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => {
                const opts = TIMER_OPTIONS;
                const idx = opts.indexOf(timerSecs as any);
                setTimerSecs(opts[(idx + 1) % opts.length]);
                haptic();
              }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 3"/><path d="M9 2h6M12 2v2"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{timerSecs > 0 ? `${timerSecs}s` : 'Off'}</span>
            </div>

            {/* Format */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => {
                setFormat(f => f === 'full' ? 'split-top' : f === 'split-top' ? 'split-bottom' : 'full');
                haptic();
              }} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{format === 'full' ? 'Full' : format === 'split-top' ? 'Split↑' : 'Split↓'}</span>
            </div>

            {/* Filter */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => { setShowFilterStrip(f => !f); setShowLogoMenu(false); haptic(); }}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Filter</span>
            </div>

            {/* Blur background */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => haptic()}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/><path d="M4 4l3 3M17 4l-3 3M4 20l3-3M17 20l-3-3"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Blur</span>
            </div>

            {/* Polish / AI enhance */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => haptic()}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Polish</span>
            </div>

            {/* Flip camera */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => { flipCamera(); setShowLogoMenu(false); }}
                style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
              </button>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Flip</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER STRIP ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilterStrip && !capturedURL && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute left-0 right-0 flex gap-3 overflow-x-auto px-4 pb-2 z-20"
            style={{ bottom: 180, scrollbarWidth: 'none' }}>
            {FILTERS_LIST.map(f => (
              <button key={f} onClick={() => { setSelectedFilter(f); setShowFilterStrip(false); }}
                className="flex flex-col items-center gap-1 flex-shrink-0"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{
                  width: 56, height: 80, borderRadius: 10, overflow: 'hidden',
                  border: selectedFilter === f ? '2px solid #1877F2' : '2px solid rgba(255,255,255,0.2)',
                  background: '#111', filter: CSS_FILTERS[f],
                }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                </div>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>{f}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RECORDING INDICATOR ────────────────────────────────────────────── */}
      {isRecording && (
        <div className="absolute top-16 left-0 right-0 flex justify-center z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              {duration > 0 && ` / ${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`}
            </span>
            {speedLabel && <span style={{ color: '#1877F2', fontSize: 11, fontWeight: 800 }}>{speedLabel}</span>}
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROLS ────────────────────────────────────────────────── */}
      {!capturedURL && (
        <div className="absolute bottom-0 left-0 right-0 z-20"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>

          {/* Duration picker (video only, not while recording) */}
          {mode === 'video' && !isRecording && (
            <div className="flex justify-center gap-4 mb-4">
              {([30, 60, 0] as VideoDuration[]).map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className="text-sm font-bold px-4 py-1.5 rounded-full"
                  style={{
                    background: duration === d ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                    color: duration === d ? '#000' : '#fff',
                    border: 'none', cursor: 'pointer',
                  }}>
                  {d === 0 ? 'Free' : `${d}s`}
                </button>
              ))}
            </div>
          )}

          {/* Mode switcher */}
          {!isRecording && (
            <div className="flex justify-center gap-6 mb-5">
              {(['photo', 'video', 'text'] as CaptureMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="text-sm font-bold capitalize pb-1"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                    borderBottom: mode === m ? '2px solid #fff' : '2px solid transparent',
                  }}>
                  {m}
                </button>
              ))}
              {/* Upload */}
              <label style={{ cursor: 'pointer' }}>
                <span className="text-sm font-bold pb-1"
                  style={{ color: mode === 'upload' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: mode === 'upload' ? '2px solid #fff' : '2px solid transparent' }}>
                  Upload
                </span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} onClick={() => setMode('upload')} />
              </label>
            </div>
          )}

          {/* Record row */}
          <div className="flex items-center justify-center gap-8">

            {/* Slow motion */}
            {mode === 'video' && (
              <button onClick={() => { setSpeed(s => s === 0.5 ? 1 : 0.5); haptic(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: speed === 0.5 ? 1 : 0.5 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
                </svg>
                <div style={{ color: '#fff', fontSize: 9, fontWeight: 800, textAlign: 'center', marginTop: 2 }}>0.5×</div>
              </button>
            )}

            {/* Gallery / placeholder for non-video */}
            {mode !== 'video' && <div style={{ width: 28 }} />}

            {/* Record / capture button */}
            <button onClick={handleRecordPress}
              disabled={countdown !== null}
              className="flex items-center justify-center"
              style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid white', background: 'none', cursor: 'pointer', position: 'relative' }}>
              {isRecording ? (
                /* Stop square */
                <div style={{ width: 28, height: 28, background: '#EF4444', borderRadius: 6 }} />
              ) : mode === 'photo' ? (
                /* Photo shutter */
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff' }} />
              ) : (
                /* Video record with progress ring */
                <>
                  <svg className="absolute inset-0" width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    {isRecording && (
                      <circle cx="40" cy="40" r={radius} fill="none" stroke="#EF4444" strokeWidth="4"
                        strokeDasharray={circ} strokeDashoffset={strokeDash} style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
                    )}
                  </svg>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#EF4444' }} />
                </>
              )}
            </button>

            {/* Fast motion */}
            {mode === 'video' && (
              <button onClick={() => { setSpeed(s => s === 2 ? 1 : 2); haptic(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: speed === 2 ? 1 : 0.5 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
                <div style={{ color: '#fff', fontSize: 9, fontWeight: 800, textAlign: 'center', marginTop: 2 }}>2×</div>
              </button>
            )}

            {mode !== 'video' && <div style={{ width: 28 }} />}
          </div>
        </div>
      )}

      {/* ── MUSIC PICKER DRAWER ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMusicPicker && (
          <>
            <motion.div className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowMusicPicker(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="absolute bottom-0 left-0 right-0 rounded-t-3xl z-50 overflow-hidden"
              style={{ background: '#12152A', maxHeight: '70%' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28 }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1E2240' }}>
                <p className="font-black text-white text-sm">Add Sound</p>
                <button onClick={() => setShowMusicPicker(false)} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'My Sounds', desc: 'Sounds you recorded or uploaded', icon: '🎙' },
                  { label: 'Spotify', desc: 'Search Spotify music library', icon: '🎵' },
                  { label: 'Sound Library', desc: 'villa9e curated sounds', icon: '🎼' },
                  { label: 'Audio Overlay', desc: 'Record a voiceover', icon: '🎤' },
                ].map(opt => (
                  <button key={opt.label} onClick={() => setShowMusicPicker(false)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left"
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{opt.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
