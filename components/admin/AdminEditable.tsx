'use client';
import { useState } from 'react';
import type React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminEdit } from '@/lib/admin/adminContext';

interface Props {
  configKey: string;
  children: React.ReactNode;
  type?: 'text' | 'textarea' | 'color' | 'number';
  className?: string;
  style?: React.CSSProperties;
  tag?: React.ElementType;
}

/**
 * Wraps any element so admins can click it to edit its config value inline.
 * Only active when admin Edit Mode is on.
 *
 * Usage:
 *   <AdminEditable configKey="home.hero.title" tag="h1" className="...">
 *     {config['home.hero.title'] ?? 'Default text'}
 *   </AdminEditable>
 */
export function AdminEditable({ configKey, children, type = 'text', className, style, tag }: Props) {
  const Tag: React.ElementType = tag ?? 'div';
  const { editMode, saveConfig, config } = useAdminEdit();
  const [open, setOpen]     = useState(false);
  const [draft, setDraft]   = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  if (!editMode) {
    return <Tag className={className} style={style}>{children}</Tag>;
  }

  function startEdit() {
    const current = config[configKey];
    setDraft(typeof current === 'string' ? current : JSON.stringify(current ?? ''));
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const value = type === 'number' ? parseFloat(draft) : draft;
    await saveConfig(configKey, value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  }

  return (
    <>
      <Tag
        className={className}
        style={{
          ...style,
          outline:       '2px dashed rgba(24,119,242,0.5)',
          outlineOffset: '2px',
          cursor:        'pointer',
          position:      'relative',
          borderRadius:  '4px',
        }}
        onClick={e => { e.stopPropagation(); startEdit(); }}
        title={`Edit: ${configKey}`}
      >
        {children}
        {/* Pencil badge */}
        <span style={{
          position:       'absolute',
          top:            '-10px',
          right:          '-10px',
          background:     '#1877F2',
          color:          '#fff',
          fontSize:       '10px',
          borderRadius:   '6px',
          padding:        '2px 5px',
          fontWeight:     700,
          pointerEvents:  'none',
          zIndex:         1,
          whiteSpace:     'nowrap',
        }}>
          ✏️ {configKey.split('.').pop()}
        </span>
      </Tag>

      {/* Edit popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[10002] p-4 rounded-2xl shadow-2xl space-y-3"
            style={{
              top:       '50%',
              left:      '50%',
              transform: 'translate(-50%,-50%)',
              width:     '360px',
              background: '#0D0F1E',
              border:    '1px solid rgba(24,119,242,0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <p style={{ color: '#60A5FA', fontSize: '12px', fontWeight: 700 }}>✏️ {configKey}</p>
              <button onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {type === 'color' ? (
              <div className="flex items-center gap-3">
                <input type="color" value={draft} onChange={e => setDraft(e.target.value)} style={{ width: 48, height: 48, border: 'none', borderRadius: 10, cursor: 'pointer' }} />
                <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0EBE0', fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'monospace' }} />
              </div>
            ) : type === 'textarea' ? (
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={4}
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0EBE0', fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
            ) : (
              <input
                type={type === 'number' ? 'number' : 'text'}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0EBE0', fontSize: 13, padding: '10px 12px', outline: 'none' }}
              />
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: saved ? 'rgba(34,197,94,0.25)' : '#1877F2', color: saved ? '#4ADE80' : '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {saved ? '✓ Saved' : saving ? '…' : 'Save'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
