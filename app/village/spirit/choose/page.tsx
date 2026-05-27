'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import type { SpiritVariantId } from '@/components/spirit/SpiritFigure';

// Three.js Canvas must not SSR
const SpiritSelector = dynamic(
  () => import('@/components/spirit/SpiritSelector').then(m => ({ default: m.SpiritSelector })),
  { ssr: false, loading: () => <div className="h-60 rounded-3xl animate-pulse" style={{ background: 'rgba(24,119,242,0.08)' }} /> }
);

export default function ChooseSpiritPage() {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<SpiritVariantId>('blue');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from('profiles')
        .select('avatar_config')
        .eq('id', user.id)
        .single()
        .then(({ data }: any) => {
          if (data?.avatar_config?.spirit_variant) {
            setSelected(data.avatar_config.spirit_variant as SpiritVariantId);
          }
        });
    });
  }, []);

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Read current avatar_config first to not overwrite other fields
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('avatar_config')
        .eq('id', user.id)
        .single();

      const updated = { ...(profile?.avatar_config ?? {}), spirit_variant: selected };

      await (supabase as any)
        .from('profiles')
        .update({ avatar_config: updated })
        .eq('id', user.id);

      setSaved(true);
      setTimeout(() => { setSaved(false); router.push('/village/spirit'); }, 1200);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#060810' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3.5 flex items-center gap-3"
        style={{ background: 'rgba(6,8,16,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/village/hut/avatar" className="text-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>←</Link>
        <span className="text-2xl">🌀</span>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">Choose Your Spirit</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Your Spirit companion until you create your own
          </p>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 pt-6 space-y-6">
        {/* Intro card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{ background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)' }}
        >
          <p className="text-sm text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Your Spirit is your AI guide inside villa9e. Pick the one that feels most like you — you can always change it in your Hut.
          </p>
        </motion.div>

        {/* Spirit selector — 3D */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SpiritSelector selected={selected} onSelect={setSelected} />
        </motion.div>

        {/* Confirm button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-base text-white disabled:opacity-50 transition-all"
          style={{
            background: saved
              ? 'linear-gradient(135deg,#22C55E,#16A34A)'
              : 'linear-gradient(135deg,#1877F2,#1565c0)',
            boxShadow: '0 4px 24px rgba(24,119,242,0.35)',
          }}
        >
          {saved ? '✓ Spirit saved!' : saving ? 'Saving…' : `Choose ${selected === 'blue' ? 'Blue' : selected === 'white' ? 'White' : 'Dark'} Spirit →`}
        </motion.button>

        {/* Spirit origin note */}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Create your fully custom Spirit in the Hut avatar builder.
        </p>
      </div>
    </div>
  );
}
