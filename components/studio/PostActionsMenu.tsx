'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PostActionsMenuProps {
  postId: string;
  isOwner: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

// Shares externally — opens device share sheet or deeplink
function shareExternal(method: string, postId: string) {
  const url = `https://villa9e.app/post/${postId}`;
  const text = 'Check this out on villa9e — It takes a village.';
  switch (method) {
    case 'copy':
      navigator.clipboard?.writeText(url).catch(() => {});
      break;
    case 'sms':
      window.open(`sms:?body=${encodeURIComponent(`${text} ${url}`)}`);
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
      break;
    case 'messenger':
      window.open(`fb-messenger://share?link=${encodeURIComponent(url)}`);
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
      break;
    case 'email':
      window.open(`mailto:?subject=${encodeURIComponent('Shared from villa9e')}&body=${encodeURIComponent(`${text}\n${url}`)}`);
      break;
    case 'more':
      if (navigator.share) navigator.share({ title: 'villa9e post', text, url }).catch(() => {});
      break;
    default:
      break;
  }
}

const SHARE_OPTIONS = [
  { id: 'copy',      label: 'Copy Link',    icon: '🔗' },
  { id: 'sms',       label: 'SMS',          icon: '💬' },
  { id: 'whatsapp',  label: 'WhatsApp',     icon: '📱' },
  { id: 'messenger', label: 'Messenger',    icon: '📩' },
  { id: 'facebook',  label: 'Facebook',     icon: '📘' },
  { id: 'telegram',  label: 'Telegram',     icon: '✈️' },
  { id: 'email',     label: 'Email',        icon: '📧' },
  { id: 'more',      label: 'More',         icon: '⋯' },
];

export function PostActionsMenu({ postId, isOwner, onClose, onDeleted }: PostActionsMenuProps) {
  const router  = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied]       = useState(false);

  function handleCopy() {
    shareExternal('copy', postId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const res = await fetch('/api/studio/post', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    }).catch(() => null);
    if (!res?.ok) { alert('Failed to delete post. Please try again.'); return; }
    onDeleted?.();
    onClose();
  }

  const OWNER_ACTIONS = [
    { icon: '📌', label: 'Pin to Profile',      action: () => { onClose(); } },
    { icon: '✏️', label: 'Edit Caption',         action: () => { router.push(`/village/create/edit-post/${postId}`); onClose(); } },
    { icon: '🔒', label: 'Adjust Privacy',       action: () => { onClose(); } },
    { icon: '📊', label: 'View Stats',            action: () => { onClose(); } },
    { icon: '🏷',  label: 'Manage Keywords',      action: () => { onClose(); } },
    { icon: '📖', label: 'Add to Story',          action: () => { onClose(); } },
    { icon: '📈', label: 'Boost as Ad',           action: () => { router.push('/village/ads'); onClose(); } },
    { icon: '🗑',  label: 'Delete Post',          action: handleDelete, danger: true },
  ];

  const VIEWER_ACTIONS = [
    { icon: '🚩', label: 'Report',               action: () => { onClose(); } },
    { icon: '🚫', label: 'Not Interested',        action: () => { onClose(); } },
    { icon: '👤', label: 'View Profile',          action: () => { onClose(); } },
  ];

  const actions = isOwner ? OWNER_ACTIONS : VIEWER_ACTIONS;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 z-[201] rounded-t-3xl overflow-hidden"
        style={{ background: '#12152A', maxHeight: '85vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Share row */}
        <div className="px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Share</p>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {SHARE_OPTIONS.map(opt => (
              <button key={opt.id}
                onClick={() => {
                  if (opt.id === 'copy') { handleCopy(); return; }
                  shareExternal(opt.id, postId);
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: opt.id === 'copy' && copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 20 }}>{opt.id === 'copy' && copied ? '✓' : opt.icon}</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                  {opt.id === 'copy' && copied ? 'Copied!' : opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-5 my-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Other actions */}
        <div className="px-5 py-3 space-y-1 pb-8">
          {/* Download */}
          <ActionRow icon="⬇️" label="Download" onClick={() => { onClose(); }} />
          {/* Cast */}
          <ActionRow icon="📺" label="Cast to TV / Screen" onClick={() => { onClose(); }} />
          {/* Playback speed */}
          <ActionRow icon="⏩" label="Change Playback Speed" onClick={() => { onClose(); }} />

          <div className="my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {actions.map(a => (
            <ActionRow key={a.label} icon={a.icon} label={a.label} onClick={a.action}
              danger={('danger' in a ? Boolean(a.danger) : false)} />
          ))}

          {/* Cancel */}
          <button onClick={onClose}
            className="w-full py-4 rounded-2xl mt-3 font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionRow({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left"
      style={{ background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer' }}>
      <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: danger ? '#EF4444' : '#fff' }}>{label}</span>
    </button>
  );
}
