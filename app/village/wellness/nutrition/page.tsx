'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { BackButton } from '@/components/village/BackButton';
import { WellnessNav } from '@/components/wellness/WellnessNav';

interface MealItem {
  name: string;
  note?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface Meal {
  name: string;
  items: MealItem[];
  calories: number;
}

interface NutritionPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  reasoning: string;
}

const FALLBACK_PLAN: NutritionPlan = {
  breakfast: {
    name: 'Balanced Morning Fuel',
    items: [
      { name: 'Scrambled eggs (3)', protein: 19, carbs: 1, fat: 14 },
      { name: 'Steel-cut oats ½ cup', protein: 5, carbs: 27, fat: 3, note: 'Sustained energy' },
      { name: 'Blueberries 1 cup', protein: 1, carbs: 21, fat: 0, note: 'Anti-inflammatory' },
      { name: 'Water with electrolytes', note: 'Hydration' },
    ],
    calories: 520,
  },
  lunch: {
    name: 'Anti-Inflammatory Power Lunch',
    items: [
      { name: 'Grilled salmon 5oz', protein: 34, carbs: 0, fat: 18, note: 'Omega-3 · HRV support' },
      { name: 'Quinoa ¾ cup', protein: 6, carbs: 32, fat: 3 },
      { name: 'Roasted vegetables', protein: 4, carbs: 18, fat: 6 },
      { name: 'Olive oil dressing', note: 'Anti-inflammatory' },
    ],
    calories: 680,
  },
  dinner: {
    name: 'Recovery Evening Meal',
    items: [
      { name: 'Chicken breast 6oz', protein: 44, carbs: 0, fat: 9 },
      { name: 'Sweet potato medium', protein: 4, carbs: 37, fat: 0 },
      { name: 'Leafy greens salad', protein: 3, carbs: 8, fat: 2 },
      { name: 'Dark chocolate 1oz', note: 'Magnesium-rich · Sleep support' },
    ],
    calories: 590,
  },
  reasoning: 'Log your mood and energy daily to unlock Spirit\'s personalized nutrition plans tailored to your wellness patterns.',
};

function MealCard({ label, meal }: { label: string; meal: Meal }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ background: 'rgba(34,197,94,0.15)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{label}</span>
          {meal.name && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>{meal.name}</span>}
        </div>
        <span style={{ fontSize: 12, color: '#34D399', fontWeight: 800 }}>{meal.calories} kcal</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        {meal.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <p style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{item.name}</p>
              {item.note && <p style={{ fontSize: 11, color: '#34D399', fontWeight: 600, marginTop: 2 }}>{item.note}</p>}
            </div>
            {(item.protein !== undefined || item.carbs !== undefined || item.fat !== undefined) && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                {item.protein !== undefined && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>P{item.protein}g</span>}
                {item.carbs !== undefined && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>C{item.carbs}g</span>}
                {item.fat !== undefined && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>F{item.fat}g</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [plan, setPlan] = useState<NutritionPlan>(FALLBACK_PLAN);
  const [loading, setLoading] = useState(true);
  const [reasoning, setReasoning] = useState('');

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];
      const { data: log } = await (supabase as any)
        .from('wellness_logs')
        .select('readiness,mood')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      const res = await fetch('/api/wellness/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readiness: parseFloat(log?.readiness ?? 0),
          mood: log?.mood ?? null,
          schedule: [],
        }),
      });

      if (res.ok) {
        const data: NutritionPlan = await res.json();
        setPlan(data);
        setReasoning(data.reasoning ?? '');
      }
    } catch {
      // Use fallback plan
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  return (
    <div style={{ background: '#111827', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <BackButton to="/village/wellness" />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', padding: '14px 16px 14px 60px', background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => router.push('/village/wellness')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22C55E', fontWeight: 800, fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', marginRight: 12 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <p style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>Nutrition</p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={fetchPlan}
          disabled={loading}
          style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </motion.button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 96px' }}>

        {/* AI Daily Recommendation card */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#34D399', letterSpacing: '0.08em' }}>TODAY&apos;S AI RECOMMENDATION</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 6, height: 6, borderRadius: 3, background: '#34D399' }} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
              {reasoning || FALLBACK_PLAN.reasoning}
            </p>
          )}
        </div>

        {/* 3 Meal cards */}
        <MealCard label="Breakfast" meal={plan.breakfast} />
        <MealCard label="Lunch" meal={plan.lunch} />
        <MealCard label="Dinner" meal={plan.dinner} />

        {/* Why this plan */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginTop: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 10 }}>WHY THIS PLAN</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Anti-inflammatory', desc: 'Reduces systemic inflammation linked to poor HRV and slow recovery.' },
              { label: 'Nutrient timing', desc: 'Carbs timed around activity windows for peak energy and glycogen replenishment.' },
              { label: 'Magnesium focus', desc: 'Evening meals rich in magnesium support deeper sleep and nervous system recovery.' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22C55E', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/village/wellness/ai')}
            style={{ marginTop: 14, width: '100%', padding: '11px 0', borderRadius: 12, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34D399', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Ask Spirit about my nutrition
          </button>
        </div>
      </div>

      <WellnessNav />
    </div>
  );
}
