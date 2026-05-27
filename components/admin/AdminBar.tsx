'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { AdminConfigPanel } from './AdminConfigPanel';

// ── Edit-mode context ──────────────────────────────────────────────────────
interface EditCtx {
  editMode: boolean;
  toggleEdit: () => void;
  saveConfig: (key: string, value: any) => Promise<void>;
  config: Record<string, any>;
}
const EditContext = createContext<EditCtx>({ editMode: false, toggleEdit: () => {}, saveConfig: async () => {}, config: {} });
export const useAdminEdit = () => useContext(EditContext);

// ── Helpers ────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = ['elitehousemusic@gmail.com', 'admin@villa9e.app'];

// ── Main AdminBar component ────────────────────────────────────────────────
export function AdminBar() {
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

      if (isEmail) {
        setIsAdmin(true);
        loadConfig();
        return;
      }
      (supabase as any).from('profiles').select('is_super_admin').eq('id', session.user.id).single()
        .then(({ data }: any) => {
          if (data?.is_super_admin) {
            setIsAdmin(true);
            loadConfig();
          }
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
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ key, value }),
    });
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [token]);

  if (!isAdmin) return null;

  return (
    <EditContext.Provider value={{ editMode, toggleEdit: () => setEditMode(e => !e), saveConfig, config }}>
      {/* Edit-mode overlay hint */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[9998]"
            style={{ outline: '3px dashed rgba(24,119,242,0.4)', outlineOffset: '-3px' }}
          />
        )}
      </AnimatePresence>

      {/* Floating admin bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-24 left-4 z-[9999] flex items-center gap-2"
      >
        {/* Main pill */}
        <div
          className="flex items-center gap-1 rounded-full px-1 py-1"
          style={{
            background:    'rgba(6,8,16,0.92)',
            border:        `1.5px solid ${editMode ? '#1877F2' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(16px)',
            boxShadow:      editMode ? '0 0 20px rgba(24,119,242,0.4)' : '0 4px 24px rgba(0,0,0,0.5)',
            transition:     'all 0.2s',
          }}
        >
          {/* Logo dot */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1877F2' }}>
            <span className="text-xs font-black text-white">A</span>
          </div>

          {/* Edit Mode toggle */}
          <button
            onClick={() => setEditMode(e => !e)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{
              background: editMode ? '#1877F2' : 'transparent',
              color:      editMode ? '#fff' : 'rgba(255,255,255,0.6)',
            }}
          >
            <span>{editMode ? '✏️' : '✏️'}</span>
            {editMode ? 'Editing' : 'Edit'}
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Config button */}
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all"
            style={{ color: panelOpen ? '#fff' : 'rgba(255,255,255,0.6)', background: panelOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          >
            ⚙️ Config
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Admin dashboard link */}
          <a
            href="/admin"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            📊 Stats
          </a>

          {/* Saving indicator */}
          <AnimatePresence>
            {(saving || saved) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{ background: saved ? 'rgba(34,197,94,0.2)', color: '#4ADE80' }}
              >
                {saving ? '…' : '✓ Saved'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Config panel */}
      <AdminConfigPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        config={config}
        onSave={saveConfig}
        token={token}
      />
    </EditContext.Provider>
  );
}
