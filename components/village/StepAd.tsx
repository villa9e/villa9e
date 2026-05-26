'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface StepAdProps {
  goalCategory: string;
  stepTitle: string;
  stepIndex: number;
}

export function StepAd({ goalCategory, stepTitle, stepIndex }: StepAdProps) {
  const [ad, setAd] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (stepIndex % 3 !== 0) return; // Show ad every 3rd step
    fetch('/api/ads/relevant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_category: goalCategory, step_title: stepTitle, step_index: stepIndex }),
    }).then(r => r.json()).then(ads => {
      if (ads?.length > 0) setAd(ads[0]);
    }).catch(() => {});
  }, [goalCategory, stepTitle, stepIndex]);

  if (!ad || dismissed) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-3 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">{ad.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700">{ad.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{ad.body}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={ad.url} className="text-xs bg-village-blue text-white px-3 py-1.5 rounded-full font-medium hover:bg-blue-700 transition-colors">
          {ad.cta}
        </Link>
        <button onClick={() => setDismissed(true)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
      </div>
    </motion.div>
  );
}
