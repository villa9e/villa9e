'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function WorkshopPage() {
  const [goalInput, setGoalInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  async function analyzeGoal() {
    if (!goalInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/claude/goal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  }

  return (
    <div className="min-h-screen bg-village-bg">
      {/* Header */}
      <div className="bg-village-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">🔨</span>
        <h1 className="text-xl font-bold">Workshop</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Goal input */}
        <div className="village-card">
          <h2 className="font-bold text-lg mb-1">Set Your Goal</h2>
          <p className="text-sm text-gray-500 mb-4">Spirit will build a full GPS plan for you.</p>
          <textarea
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            placeholder="What would you like to achieve? Be specific — Spirit works best with details."
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-village-blue resize-none"
          />
          <button
            onClick={analyzeGoal}
            disabled={analyzing || !goalInput.trim()}
            className="mt-3 village-btn-primary w-full disabled:opacity-50"
          >
            {analyzing ? '🤖 Spirit is thinking…' : '🚀 Analyze My Goal'}
          </button>
        </div>

        {/* Analysis result */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Probability */}
            <div className="village-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Goal Probability Score</h3>
                <span className="text-2xl font-bold text-village-blue">{analysis.probability_score}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full village-gradient transition-all"
                  style={{ width: `${analysis.probability_score}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{analysis.probability_reason}</p>
            </div>

            {/* Steps */}
            {analysis.steps?.length > 0 && (
              <div className="village-card">
                <h3 className="font-bold mb-3">📍 Your GPS Steps</h3>
                <ol className="space-y-2">
                  {analysis.steps.map((step: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-village-blue text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Cost & Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="village-card text-center">
                <p className="text-sm text-gray-500">Est. Cost</p>
                <p className="text-xl font-bold text-village-blue">${analysis.estimated_cost?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="village-card text-center">
                <p className="text-sm text-gray-500">Timeline</p>
                <p className="text-xl font-bold text-village-blue">{analysis.estimated_weeks ?? '—'} wks</p>
              </div>
            </div>

            {/* Save button */}
            <button className="village-btn-primary w-full">
              💾 Save This Goal
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
