'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { GATED_ITEMS, type GatedItem, type GatedItemCategory } from '@/lib/tokens/gatedItems';
import { useVLGBalance } from '@/lib/tokens/useVLGBalance';

const CATEGORY_LABELS: Record<GatedItemCategory, string> = {
  avatar_accessory: 'Avatar',
  hut_decoration:   'Hut',
  village_emote:    'Emotes',
  pavilion_ticket:  'Pavilion',
  tribe_perks:      'Tribe',
  seasonal_effect:  'Seasonal',
};

const CATEGORIES: GatedItemCategory[] = [
  'avatar_accessory','hut_decoration','village_emote','seasonal_effect','tribe_perks',
];

interface PurchasedSet {
  [itemId: string]: boolean;
}

export function VLGShop({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory]   = useState<GatedItemCategory>('avatar_accessory');
  const [purchased, setPurchased]             = useState<PurchasedSet>({});
  const [buying, setBuying]                   = useState<string | null>(null);
  const [toast, setToast]                     = useState<string | null>(null);
  const [userId, setUserId]                   = useState<string | null>(null);

  const { balance, load, optimisticDebit } = useVLGBalance();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      load(user.id);

      // Load purchased items
      supabase
        .from('vlg_purchases')
        .select('item_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) {
            const set: PurchasedSet = {};
            data.forEach((r: any) => { set[r.item_id] = true; });
            setPurchased(set);
          }
        });
    });
  }, []);

  async function handleBuy(item: GatedItem) {
    if (!userId) return;
    if (balance < item.price) {
      setToast('Not enough VLG tokens. Earn more by completing goals!');
      setTimeout(() => setToast(null), 3500);
      return;
    }
    if (purchased[item.id]) return;

    setBuying(item.id);
    const supabase = createClient();

    optimisticDebit(item.price);

    const { error } = await supabase.rpc('purchase_vlg_item', {
      p_user_id:  userId,
      p_item_id:  item.id,
      p_price:    item.price,
    });

    if (error) {
      // Revert optimistic update
      useVLGBalance.getState().optimisticCredit(item.price);
      setToast('Purchase failed. Please try again.');
    } else {
      setPurchased(p => ({ ...p, [item.id]: true }));
      setToast(`${item.emoji} ${item.label} unlocked!`);
    }

    setBuying(null);
    setTimeout(() => setToast(null), 3500);
  }

  const items = GATED_ITEMS.filter(i => i.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0D1A0F] border border-[#2A5C14]/40 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A1A0A] border-b border-[#1A3A1A]/60 flex items-center justify-between">
          <div>
            <h2 className="text-[#C8E8C8] font-bold text-lg">VLG Token Shop</h2>
            <p className="text-[#4A7A4A] text-sm">Unlock exclusive items for your village life</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#16532A] px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-[#4ADE80] text-lg">⬡</span>
              <span className="text-[#4ADE80] font-bold text-lg">{balance.toLocaleString()}</span>
              <span className="text-[#2A7A4A] text-sm">VLG</span>
            </div>
            <button onClick={onClose} className="text-[#4A7A4A] hover:text-[#C8E8C8] transition-colors text-xl">×</button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-4 py-3 border-b border-[#1A3A1A]/60 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[#16532A] text-[#4ADE80]'
                  : 'text-[#4A7A4A] hover:text-[#C8E8C8]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="p-4 grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
          {items.map(item => {
            const isPurchased = purchased[item.id];
            const isAffordable = balance >= item.price;
            const isBuying = buying === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                className={`bg-[#0A1A0A] border rounded-xl p-4 transition-colors ${
                  isPurchased
                    ? 'border-[#4ADE80]/30 bg-[#0D2A14]'
                    : 'border-[#1A3A1A]/60 hover:border-[#2A5C14]/60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{item.emoji}</span>
                  {item.exclusive && !isPurchased && (
                    <span className="text-[10px] bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded border border-amber-700/40">
                      EXCLUSIVE
                    </span>
                  )}
                  {isPurchased && (
                    <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-700/40">
                      OWNED
                    </span>
                  )}
                </div>
                <p className="text-[#C8E8C8] font-medium text-sm mb-0.5">{item.label}</p>
                <p className="text-[#4A7A4A] text-xs mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[#4ADE80] text-sm">⬡</span>
                    <span className="text-[#4ADE80] font-bold text-sm">{item.price}</span>
                    <span className="text-[#2A5A2A] text-xs">VLG</span>
                  </div>
                  {isPurchased ? (
                    <span className="text-[#4ADE80] text-xs">✓ Unlocked</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={isBuying || !isAffordable}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        isAffordable
                          ? 'bg-[#16532A] hover:bg-[#1A6A35] text-[#4ADE80]'
                          : 'bg-[#0A1A0A] text-[#2A4A2A] cursor-not-allowed border border-[#1A3A1A]/40'
                      } disabled:opacity-60`}
                    >
                      {isBuying ? '...' : isAffordable ? 'Buy' : 'Need more VLG'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* How to earn VLG */}
        <div className="px-6 py-3 bg-[#0A1A0A] border-t border-[#1A3A1A]/60 flex items-center justify-between">
          <p className="text-[#4A7A4A] text-xs">Complete goals, hit streaks, and help tribe members to earn VLG</p>
          <a href="/village/blockchain" className="text-[#4ADE80] text-xs hover:underline">View ledger →</a>
        </div>
      </motion.div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#16532A] text-[#4ADE80] px-5 py-3 rounded-full shadow-xl border border-[#4ADE80]/30 text-sm font-medium z-60"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
