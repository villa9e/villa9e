'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-village-bg flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⛺</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">
          Spirit hit a snag. This has been logged and we&apos;re on it.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="village-btn-primary">Try again</button>
          <Link href="/village/map" className="border border-gray-200 text-gray-600 rounded-full px-6 py-3 hover:bg-gray-50">
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}
