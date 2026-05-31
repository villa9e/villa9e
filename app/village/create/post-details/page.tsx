'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSession, clearSession } from '@/lib/create/session';
import { useCreateStore } from '@/lib/create/store';

const POST_LABELS = [
  { id: 'goal_recap',       icon: '🏆', label: 'Goal Recap',        desc: 'Share your goal progress',        workshop: false },
  { id: 'action_how_to',    icon: '📋', label: 'Action How-To',     desc: 'Teach a specific action step',    workshop: true  },
  { id: 'sprint_update',    icon: '⚡', label: 'Sprint Update',     desc: 'Update on your sprint milestone', workshop: false },
  { id: 'product_review',   icon: '🛍', label: 'Product Review',    desc: 'Review a tool or product',        workshop: true  },
  { id: 'help_request',     icon: '🙋', label: 'Ask the Village',   desc: 'Request advice or support',       workshop: false },
  { id: 'general',          icon: '✨', label: 'General Post',      desc: 'Anything on your mind',           workshop: false },
];

type Toggle = { key: string; label: string; desc: string; default?: boolean };
const TOGGLES: Toggle[] = [
  { key: 'allowComments',    label: 'Allow Comments',         desc: 'Let others comment',         default: true  },
  { key: 'allowRemixes',     label: 'Allow Remixes',          desc: 'Let others remix this post', default: true  },
  { key: 'isTemplate',       label: 'Post as Template',       desc: 'Others can use your layout', default: false },
  { key: 'isAiGenerated',    label: 'AI-Generated Content',   desc: 'Label this as AI content',   default: false },
  { key: 'saveToDevice',     label: 'Save to Device',         desc: 'Auto-save a local copy',     default: true  },
  { key: 'saveWithWatermark',label: 'Save with Watermark',    desc: 'Add villa9e watermark',       default: false },
  { key: 'allowVisualSearch',label: 'Allow Visual Search',    desc: 'Appear in visual search',    default: true  },
];

export default function PostDetailsPage() {
  const router  = useRouter();
  const session = getSession();
  const store   = useCreateStore();
  const supabase = createClient();

  const [goals, setGoals]       = useState<any[]>([]);
  const [userId, setUserId]     = useState<string | null>(null);
  const [posting, setPosting]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [coverURL, setCoverURL] = useState<string | null>(session.thumbnailURL ?? session.objectURL);
  const [tagInput, setTagInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');
  const [showAdDisclosure, setShowAdDisclosure] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const d = store.details;

  useEffect(() => {
    if (!session.objectURL && session.mediaType !== 'text') {
      router.replace('/village/create');
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user?.id) {
        (supabase as any).from('goals').select('id, title, category')
          .eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }: any) => setGoals(data ?? []));
      }
    });
  }, []);

  function addHashtag() {
    const tag = tagInput.replace(/^#/, '').trim().toLowerCase();
    if (tag && !d.hashtags.includes(tag)) {
      store.setDetails({ hashtags: [...d.hashtags, tag] });
    }
    setTagInput('');
  }

  function removeHashtag(tag: string) {
    store.setDetails({ hashtags: d.hashtags.filter(t => t !== tag) });
  }

  async function upload(): Promise<{ url: string; cloudinaryId: string; thumbnail: string } | null> {
    const sess = getSession();
    if (sess.mediaType === 'text') return null;
    if (!sess.blob) return null;

    const formData = new FormData();
    formData.append('file', sess.blob, sess.mediaType === 'video' ? 'recording.webm' : 'photo.jpg');
    formData.append('type', sess.mediaType);
    const editState = JSON.stringify({
      filter:      store.selectedFilter,
      adjustments: store.adjustments,
      textOverlays: store.textOverlays,
      trimStart:   store.trimStart,
      trimEnd:     store.trimEnd,
    });
    formData.append('edit_state', editState);

    try {
      const res = await fetch('/api/studio/upload', { method: 'POST', body: formData });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  async function publish() {
    if (posting) return;
    setPosting(true);
    try {
      // Upload media
      const uploaded = await upload();

      // Build post payload
      const payload = {
        content_type:       session.mediaType,
        media_url:          uploaded?.url ?? null,
        thumbnail_url:      uploaded?.thumbnail ?? coverURL ?? null,
        cloudinary_id:      uploaded?.cloudinaryId ?? null,
        caption:            d.caption,
        hashtags:           d.hashtags,
        location_name:      d.location,
        post_label:         d.postLabel,
        goal_id:            d.goalId,
        sprint_id:          d.sprintId,
        action_ref:         d.actionRef,
        is_workshop_content: d.isWorkshop,
        has_affiliate:      d.hasAffiliate,
        affiliate_url:      d.affiliateURL,
        affiliate_product:  d.affiliateProduct,
        visibility:         d.visibility,
        is_18_plus:         d.is18Plus,
        allow_comments:     d.allowComments,
        allow_remixes:      d.allowRemixes,
        is_template:        d.isTemplate,
        is_ai_generated:    d.isAiGenerated,
        save_to_device:     d.saveToDevice,
        save_with_watermark: d.saveWithWatermark,
        allow_visual_search: d.allowVisualSearch,
        is_ad:              d.isAd,
        ad_only:            d.adOnly,
        cta_text:           d.ctaText,
        cta_url:            d.ctaURL,
        sound_title:        store.soundTitle || null,
        sound_url:          store.soundURL || null,
        sound_source:       store.soundSource || null,
        text_content:       session.mediaType === 'text' ? session.textContent : null,
        text_style:         session.mediaType === 'text' ? session.textStyle : null,
        edit_state:         {
          filter:      store.selectedFilter,
          adjustments: store.adjustments,
          textOverlays: store.textOverlays,
          trimStart:   store.trimStart,
          trimEnd:     store.trimEnd,
          playbackSpeed: store.playbackSpeed,
        },
      };

      const res = await fetch('/api/studio/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearSession();
        store.resetAll();
        // After posting, send to Dreamline to consume content while uploading
        router.replace('/village/dreamline?posted=1');
      }
    } catch { /* silent */ }
    setPosting(false);
  }

  async function saveDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    try {
      await fetch('/api/studio/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_url:    session.objectURL,
          content_type: session.mediaType,
          draft_data:   { details: d, editState: store.selectedFilter },
        }),
      });
    } catch { /* silent */ }
    setSavingDraft(false);
    clearSession();
    store.resetAll();
    router.replace('/village/studio');
  }

  if (!session.objectURL && session.mediaType !== 'text') return null;

  const selectedLabel = POST_LABELS.find(l => l.id === d.postLabel);
  const isWorkshopLabel = selectedLabel?.workshop ?? false;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0B12' }}>

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(10,11,18,0.96)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => router.back()} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>← Edit</button>
        <p className="font-black text-white text-sm">Post Details</p>
        <button onClick={publish} disabled={posting}
          className="px-5 py-2 rounded-full text-white font-black text-sm disabled:opacity-50"
          style={{ background: '#1877F2', border: 'none', cursor: 'pointer' }}>
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">

        {/* Cover preview + caption */}
        <div className="flex gap-4 px-4 py-4">
          {/* Cover */}
          <div className="flex-shrink-0 relative cursor-pointer" onClick={() => fileRef.current?.click()}
            style={{ width: 72, height: 96, borderRadius: 12, overflow: 'hidden', background: '#12152A', border: '1px solid rgba(255,255,255,0.1)' }}>
            {coverURL ? (
              <img src={coverURL} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            )}
            <div className="absolute bottom-1 left-0 right-0 text-center" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700 }}>Cover</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setCoverURL(URL.createObjectURL(f)); }} />

          {/* Caption */}
          <div className="flex-1">
            <textarea
              value={d.caption}
              onChange={e => store.setDetails({ caption: e.target.value })}
              placeholder="Write a caption…"
              rows={4}
              className="w-full text-white text-sm resize-none focus:outline-none"
              style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            <div className="flex gap-2 mt-1">
              <span style={{ color: '#1877F2', fontSize: 12, cursor: 'pointer' }}>@Mention</span>
              <span style={{ color: '#1877F2', fontSize: 12, cursor: 'pointer' }}>#Hashtag</span>
              <span style={{ color: '#1877F2', fontSize: 12, cursor: 'pointer' }}>📍 Location</span>
            </div>
          </div>
        </div>

        {/* Content label */}
        <Section title="Content Type" subtitle="Helps us route this to the right place">
          <div className="grid grid-cols-2 gap-2 px-4">
            {POST_LABELS.map(label => (
              <button key={label.id}
                onClick={() => store.setDetails({ postLabel: label.id, isWorkshop: label.workshop })}
                className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                style={{
                  background: d.postLabel === label.id ? 'rgba(24,119,242,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `${d.postLabel === label.id ? 2 : 1}px solid ${d.postLabel === label.id ? '#1877F2' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}>
                <span style={{ fontSize: 20 }}>{label.icon}</span>
                <div>
                  <p style={{ color: d.postLabel === label.id ? '#1877F2' : '#fff', fontSize: 12, fontWeight: 700 }}>{label.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{label.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Hashtags */}
        <Section title="Hashtags">
          <div className="px-4 space-y-2">
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHashtag()}
                placeholder="#addtag"
                className="flex-1 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={addHashtag}
                style={{ background: '#1877F2', border: 'none', borderRadius: 12, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Add
              </button>
            </div>
            {d.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {d.hashtags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(24,119,242,0.15)', color: '#1877F2' }}>
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1877F2', lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="px-4">
            <input value={d.location} onChange={e => store.setDetails({ location: e.target.value })}
              placeholder="Add a location…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </Section>

        {/* Link to a goal */}
        {goals.length > 0 && ['goal_recap', 'action_how_to', 'sprint_update'].includes(d.postLabel) && (
          <Section title="Link to Goal" subtitle="Connect this post to your GPS">
            <div className="px-4 space-y-2">
              {goals.map(g => (
                <button key={g.id}
                  onClick={() => store.setDetails({ goalId: d.goalId === g.id ? null : g.id })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{
                    background: d.goalId === g.id ? 'rgba(24,119,242,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${d.goalId === g.id ? '#1877F2' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{g.title}</p>
                  {d.goalId === g.id && <span style={{ marginLeft: 'auto', color: '#1877F2', fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Affiliate */}
        {(isWorkshopLabel || d.postLabel === 'product_review') && (
          <Section title="Affiliate Link" subtitle="Earn when your audience clicks">
            <div className="px-4 space-y-2">
              <ToggleRow label="Has affiliate link" value={d.hasAffiliate} onChange={v => store.setDetails({ hasAffiliate: v })} />
              <AnimatePresence>
                {d.hasAffiliate && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                    <input value={d.affiliateURL} onChange={e => store.setDetails({ affiliateURL: e.target.value })}
                      placeholder="Affiliate URL (https://…)"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <input value={d.affiliateProduct} onChange={e => store.setDetails({ affiliateProduct: e.target.value })}
                      placeholder="Product name"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>
        )}

        {/* Visibility */}
        <Section title="Audience">
          <div className="px-4 space-y-2">
            {[
              { val: 'everyone', label: 'Everyone',   icon: '🌍' },
              { val: 'tribe',    label: 'My Tribe',    icon: '🏕' },
              { val: 'only_me',  label: 'Only Me',     icon: '🔒' },
            ].map(opt => (
              <button key={opt.val}
                onClick={() => store.setDetails({ visibility: opt.val })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                style={{
                  background: d.visibility === opt.val ? 'rgba(24,119,242,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${d.visibility === opt.val ? '#1877F2' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}>
                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                {d.visibility === opt.val && <span style={{ marginLeft: 'auto', color: '#1877F2' }}>✓</span>}
              </button>
            ))}
            <ToggleRow label="18+ content" value={d.is18Plus} onChange={v => store.setDetails({ is18Plus: v })} />
          </div>
        </Section>

        {/* CTA */}
        <Section title="Call to Action" subtitle="Optional link to add to your post">
          <div className="px-4 space-y-2">
            <input value={d.ctaText} onChange={e => store.setDetails({ ctaText: e.target.value })}
              placeholder="Button label (e.g. Learn More)"
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input value={d.ctaURL} onChange={e => store.setDetails({ ctaURL: e.target.value })}
              placeholder="URL (https://…)"
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </Section>

        {/* Additional toggles */}
        <Section title="Additional Options">
          <div className="px-4 space-y-1">
            {TOGGLES.map(t => (
              <ToggleRow key={t.key} label={t.label} desc={t.desc}
                value={(d as any)[t.key] ?? t.default}
                onChange={v => store.setDetails({ [t.key]: v })} />
            ))}
          </div>
        </Section>

        {/* Ad disclosure */}
        <Section title="Disclosure & Ads">
          <div className="px-4 space-y-2">
            <ToggleRow label="Mark as Ad" desc="Disclose this as paid promotional content"
              value={d.isAd} onChange={v => store.setDetails({ isAd: v })} />
            <AnimatePresence>
              {d.isAd && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <ToggleRow label="Only show as Ad" desc="Not visible on your profile — ad manager only"
                    value={d.adOnly} onChange={v => store.setDetails({ adOnly: v })} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4"
        style={{ background: 'rgba(10,11,18,0.97)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <button onClick={saveDraft} disabled={savingDraft}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer' }}>
          {savingDraft ? 'Saving…' : 'Save Draft'}
        </button>
        <button onClick={publish} disabled={posting}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#1877F2,#7C3AED)', border: 'none', cursor: 'pointer' }}>
          {posting ? 'Posting…' : 'Post Now'}
        </button>
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="px-4 pb-2">
        <p className="text-white text-sm font-black">{title}</p>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
      <div className="mt-4 mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1 min-w-0 pr-4">
        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{
          width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
          background: value ? '#1877F2' : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
        <span style={{
          position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#fff',
          top: 3, left: value ? 21 : 3, transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}
