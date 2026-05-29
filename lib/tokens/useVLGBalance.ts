'use client';
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface VLGState {
  balance:   number;
  loading:   boolean;
  loaded:    boolean;
  userId:    string | null;
  load:      (userId: string) => Promise<void>;
  optimisticDebit: (amount: number) => void;
  optimisticCredit: (amount: number) => void;
}

export const useVLGBalance = create<VLGState>((set, get) => ({
  balance:  0,
  loading:  false,
  loaded:   false,
  userId:   null,

  load: async (userId: string) => {
    if (get().loaded && get().userId === userId) return;
    set({ loading: true, userId });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('vlg_balance')
      .eq('id', userId)
      .single();
    // Column may not exist yet if migration 021 hasn't been run
    set({ balance: (!error && data?.vlg_balance) ? data.vlg_balance : 0, loading: false, loaded: true });
  },

  optimisticDebit: (amount: number) =>
    set(s => ({ balance: Math.max(0, s.balance - amount) })),

  optimisticCredit: (amount: number) =>
    set(s => ({ balance: s.balance + amount })),
}));
