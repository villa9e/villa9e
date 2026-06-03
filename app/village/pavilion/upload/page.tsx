'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';
import { PavilionNav } from '@/components/pavilion/PavilionNav';

const GPS_CATEGORIES = ['Business', 'Finance', 'Health', 'Tech', 'Music', 'Art', 'Education', 'Mindset'];

export default function UploadPage() {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gpsCategory, setGpsCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [done, setDone] = useState(false);

  const bg     = isNight ? '#080E24' : '#F0EFF8';
  const cardBg = isNight ? '#1A1830' : '#FFFFFF';
  const border = isNight ? '#2A2845' : '#DDD9F5';
  const text   = isNight ? '#E8E3F8' : '#1E1B4B';
  const muted  = isNight ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${border}`,
    background: isNight ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    color: text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  function handleFile(f: File) {
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function simulateUpload() {
    if (!file || !title.trim()) return;
    setUploading(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(iv);
          setUploading(false);
          setDone(true);
          return 100;
        }
        return p + 4;
      });
    }, 120);
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: text, marginBottom: 8 }}>Upload complete!</h2>
          <p style={{ fontSize: 14, color: muted, marginBottom: 24 }}>Your content is being processed and will be live shortly.</p>
          <Link href="/village/pavilion" style={{ padding: '12px 32px', borderRadius: 24, background: '#2952E8', color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', display: 'inline-block' }}>
            Back to Pavilion
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isNight ? 'rgba(8,14,36,0.96)' : 'rgba(240,239,248,0.96)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/village/pavilion" style={{ display: 'flex', alignItems: 'center', color: text, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <h1 style={{ flex: 1, fontSize: 18, fontWeight: 900, color: text, margin: 0 }}>Upload Content</h1>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            borderRadius: 20,
            border: `2px dashed ${isDragOver ? '#2952E8' : border}`,
            background: isDragOver ? (isNight ? 'rgba(41,82,232,0.1)' : 'rgba(41,82,232,0.05)') : cardBg,
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*,image/*,audio/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: 14, color: text }}>{file.name}</p>
              <p style={{ fontSize: 12, color: muted, marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ marginTop: 10, fontSize: 12, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth={1.5} strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: 15, color: text, marginBottom: 6 }}>Drag & drop or tap to select</p>
              <p style={{ fontSize: 12, color: muted }}>Video, photo, or audio · Max 2 GB</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give your content a title…"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what viewers will learn or experience…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {/* GPS Category */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 8 }}>GPS Category Tag</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GPS_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setGpsCategory(gpsCategory === cat ? '' : cat)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: gpsCategory === cat ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: gpsCategory === cat ? '#fff' : text }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: text, display: 'block', marginBottom: 6 }}>Thumbnail</label>
          <div style={{ height: 100, borderRadius: 14, border: `1px dashed ${border}`, background: cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: muted }}>
            <div style={{ textAlign: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" style={{ display: 'block', margin: '0 auto 6px' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span style={{ fontSize: 12 }}>Upload thumbnail</span>
            </div>
          </div>
        </div>

        {/* Progress bar (shown during upload) */}
        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Uploading…</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2952E8' }}>{progress}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
                  <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #2952E8, #7C3AED)' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          onClick={simulateUpload}
          disabled={!file || !title.trim() || uploading}
          style={{ padding: '14px 0', borderRadius: 16, background: file && title.trim() && !uploading ? '#2952E8' : (isNight ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'), color: file && title.trim() && !uploading ? '#fff' : muted, fontWeight: 900, fontSize: 16, border: 'none', cursor: file && title.trim() && !uploading ? 'pointer' : 'not-allowed' }}
        >
          {uploading ? 'Uploading…' : 'Upload and Publish'}
        </button>
      </div>

      <PavilionNav active="mine" />
    </div>
  );
}
