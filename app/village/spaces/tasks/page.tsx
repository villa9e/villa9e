'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  text: string;
  done: boolean;
  due_date?: string;
  project?: string;
  display_order: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
const dayAfter = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })();
const friday = (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })();

const MOCK_TASKS: Task[] = [
  { id: 't1', text: 'Send investor deck to Sarah', done: false, due_date: today, project: 'Fundraise', display_order: 1 },
  { id: 't2', text: 'Review Q2 financial model', done: true, due_date: today, project: 'Fundraise', display_order: 2 },
  { id: 't3', text: 'Book team dinner for Wednesday', done: false, due_date: today, display_order: 3 },
  { id: 't4', text: 'Update product roadmap doc', done: false, due_date: tomorrow, project: 'Product', display_order: 4 },
  { id: 't5', text: 'Run discovery calls x3', done: false, due_date: tomorrow, project: 'Sales', display_order: 5 },
  { id: 't6', text: 'Draft marketing email', done: false, due_date: dayAfter, project: 'Marketing', display_order: 6 },
  { id: 't7', text: 'Finalize contract with vendor', done: false, due_date: friday, project: 'Legal', display_order: 7 },
];

// ── Projects (derived) ────────────────────────────────────────────────────────
function getProjects(tasks: Task[]) {
  const map: Record<string, { open: number; done: number }> = {};
  for (const t of tasks) {
    if (!t.project) continue;
    if (!map[t.project]) map[t.project] = { open: 0, done: 0 };
    t.done ? map[t.project].done++ : map[t.project].open++;
  }
  return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({ onAdd, onClose }: { onAdd: (task: Omit<Task, 'id' | 'display_order'>) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [project, setProject] = useState('');

  function save() {
    if (!text.trim()) return;
    onAdd({ text: text.trim(), done: false, due_date: dueDate || undefined, project: project.trim() || undefined });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', background: '#0F1020', borderRadius: '20px 20px 0 0', padding: '20px 20px 48px' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>New Task</p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>×</button>
        </div>

        <input
          value={text} onChange={e => setText(e.target.value)} placeholder="What needs to get done?"
          autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); }}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>DUE DATE</p>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, colorScheme: 'dark', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 5 }}>PROJECT</p>
            <input value={project} onChange={e => setProject(e.target.value)} placeholder="Tag (optional)"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={save} style={{
          width: '100%', padding: '15px 0', borderRadius: 14, background: '#7C3AED',
          color: '#fff', fontWeight: 900, fontSize: 16, border: 'none', cursor: 'pointer',
        }}>
          Add Task
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Tab Icon ──────────────────────────────────────────────────────────────────
function TabIcon({ icon, label, active, onTap }: { icon: React.ReactNode; label: string; active: boolean; onTap: () => void }) {
  return (
    <button onClick={onTap} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '10px 0', color: active ? '#7C3AED' : 'rgba(255,255,255,0.35)',
      background: 'transparent', border: 'none',
      borderTop: active ? '2px solid #7C3AED' : '2px solid transparent', cursor: 'pointer',
    }}>
      {icon}
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
    </button>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const isOverdue = task.due_date && task.due_date < today && !task.done;
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => onToggle(task.id)} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)',
      marginBottom: 6, border: 'none', cursor: 'pointer',
    }}>
      {/* Checkbox */}
      <div style={{
        width: 21, height: 21, borderRadius: 11, flexShrink: 0,
        border: task.done ? 'none' : '2px solid rgba(255,255,255,0.25)',
        background: task.done ? '#059669' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {task.done && (
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 14, fontWeight: 700, lineHeight: 1.35, display: 'block',
          color: task.done ? 'rgba(255,255,255,0.3)' : '#fff',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
          {task.text}
        </span>
        {task.project && (
          <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, marginTop: 2, display: 'block' }}>
            {task.project}
          </span>
        )}
      </div>

      {task.due_date && !task.done && (
        <span style={{
          fontSize: 10, fontWeight: 800, flexShrink: 0,
          color: isOverdue ? '#EF4444' : 'rgba(255,255,255,0.35)',
        }}>
          {task.due_date === today ? 'Today' : task.due_date === tomorrow ? 'Tomorrow' : task.due_date}
        </span>
      )}
    </motion.button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [showAddTask, setShowAddTask] = useState(false);
  const [nextId, setNextId] = useState(100);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    const { data } = await (supabase as any)
      .from('spaces_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('display_order')
      .order('created_at');
    if (data && data.length > 0) setTasks(data);
  }, [userId]);

  useEffect(() => { if (userId) loadTasks(); }, [userId, loadTasks]);

  function toggleTask(id: string) {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
    if (userId) {
      const task = tasks.find(t => t.id === id);
      if (task) (supabase as any).from('spaces_tasks').update({ done: !task.done }).eq('id', id);
    }
  }

  function addTask(partial: Omit<Task, 'id' | 'display_order'>) {
    const newTask: Task = { ...partial, id: `local-${nextId}`, display_order: nextId };
    setNextId(n => n + 1);
    setTasks(ts => [...ts, newTask]);
    setShowAddTask(false);
    if (userId) {
      (supabase as any).from('spaces_tasks').insert({ user_id: userId, ...partial });
    }
  }

  const todayTasks = tasks.filter(t => t.due_date === today);
  const upcomingTasks = tasks.filter(t => t.due_date && t.due_date > today);
  const projects = getProjects(tasks);

  return (
    <div style={{ background: '#080E24', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center',
        padding: '14px 16px', background: 'rgba(8,14,36,0.96)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => router.push('/village/spaces')} style={{
          width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginRight: 10,
        }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1, letterSpacing: '-0.01em' }}>Tasks</p>
        <button onClick={() => setShowAddTask(true)} style={{
          width: 36, height: 36, borderRadius: 18, background: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
        }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 88px' }}>

        {/* ── Today ── */}
        {todayTasks.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em' }}>TODAY</p>
              <p style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>
                {todayTasks.filter(t => t.done).length}/{todayTasks.length} done
              </p>
            </div>
            {todayTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
          </>
        )}

        {/* ── Upcoming ── */}
        {upcomingTasks.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: todayTasks.length > 0 ? 22 : 0, marginBottom: 10 }}>UPCOMING</p>
            {upcomingTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
          </>
        )}

        {/* ── Projects ── */}
        {projects.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.07em', marginTop: 22, marginBottom: 10 }}>PROJECTS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {projects.map(p => (
                <div key={p.name} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '13px 14px',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      {p.open} open · {p.done} done
                    </p>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              ))}
            </div>
          </>
        )}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: 'rgba(255,255,255,0.2)' }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px', display: 'block' }}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>No tasks yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tap + to add your first task</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(8,14,36,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 30,
      }}>
        <TabIcon label="Home" active={false} onTap={() => router.push('/village/spaces')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
        />
        <TabIcon label="Calendar" active={false} onTap={() => router.push('/village/spaces')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>}
        />
        <TabIcon label="Tasks" active={true} onTap={() => {}}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
        />
        <TabIcon label="Settings" active={false} onTap={() => router.push('/village/spaces/settings')}
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>}
        />
      </div>

      <AnimatePresence>
        {showAddTask && (
          <AddTaskModal onAdd={addTask} onClose={() => setShowAddTask(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
