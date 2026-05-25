'use client';
import Link from 'next/link';
export default function SpacesPage() {
  return (
    <div className="min-h-screen bg-village-bg">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-3">
        <Link href="/village/map" className="text-xl">←</Link>
        <span className="text-2xl">📅</span>
        <h1 className="text-xl font-bold">Spaces</h1>
      </div>
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <span className="text-6xl">📅</span>
        <h2 className="text-2xl font-bold mt-4 mb-2">Spaces</h2>
        <p className="text-gray-500">The holistic smart calendar — coming in Phase 2.</p>
      </div>
    </div>
  );
}
