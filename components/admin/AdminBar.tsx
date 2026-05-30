'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AdminConfigPanel } from './AdminConfigPanel';
import { AdminEditContext } from '@/lib/admin/adminContext';

// Routes where AdminBar should not appear (they have their own admin UI)
const HIDE_ON = ['/village/map', '/admin/sandbox'];

const ADMIN_EMAILS = ['elitehousemusic@gmail.com', 'admin@villa9e.app'];

export function AdminBar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin]     = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [config, setConfig]       = useState<Record<string, any>>({});
  const [token, setToken]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const isEmail = ADMIN_EMAILS.includes(session.user.email ?? '');
      setToken(session.access_token);
      if (isEmail) { setIsAdmin(true); loadConfig(); return; }
      (supabase as any).from('profiles').select('is_super_admin').eq('id', session.user.id).single()
        .then(({ data }: any) => {
          if (data?.is_super_admin) { setIsAdmin(true); loadConfig(); }
        });
    });
  }, []);

  async function loadConfig() {
    const res = await fetch('/api/admin/config');
    const rows = await res.json();
    if (!Array.isArray(rows)) return;
    const map: Record<string, any> = {};
    rows.forEach((r: any) => { map[r.key] = r.value; });
    setConfig(map);
  }

  const saveConfig = useCallback(async (key: string, value: any) => {
    if (!token) return;
    setSaving(true);
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ key, value }),
    });
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [token]);

  if (!isAdmin) return null;
  if (HIDE_ON.some(p => pathname === p || pathname.startsWith(p))) return null;

  const ctxValue = { editMode, saveConfig, config };

  return (
    <AdminEditContext.Provider value={ctxValue}>
      <AnimatePresence>
        {editMode && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[9998]"
            style={{ outline: '3px dashed rgba(24,119,242,0.4)', outlineOffset: '-3px' }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-24 left-4 z-[9999] flex items-center gap-2"
      >
        <div
          className="flex items-center gap-1 rounded-full px-1 py-1"
          style={{
            background: '#FFFFFF',
            border: editMode ? '1.5px solid #1877F2' : '1.5px solid rgba(212,175,55,0.3)',
            boxShadow: editMode ? '0 0 16px rgba(24,119,242,0.3)' : '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1877F2' }}>
            <span className="text-xs font-black text-white">A</span>
          </div>

          <button
            onClick={() => setEditMode(e => !e)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: editMode ? '#1877F2' : 'transparent',
              color: editMode ? '#fff' : 'rgba(30,27,75,0.6)',
            }}
          >
            {editMode ? 'Editing' : 'Edit'}
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(30,27,75,0.1)' }} />

          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ color: 'rgba(30,27,75,0.6)' }}
          >
            Config
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(30,27,75,0.1)' }} />

          <a href="/admin" className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ color: 'rgba(30,27,75,0.6)' }}>
            Stats
          </a>

          <AnimatePresence>
            {(saving || saved) && (
              <motion.div
                key="save-indicator"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{ background: saved ? 'rgba(34,197,94,0.15)' : 'transparent', color: '#16A34A' }}
              >
                {saving ? '...' : 'Saved'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AdminConfigPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        config={config}
        onSave={saveConfig}
        token={token}
      />
    </AdminEditContext.Provider>
  );
}
