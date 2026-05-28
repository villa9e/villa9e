'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { VillageLogo } from '@/components/brand/VillageLogo';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0D1428 0%, #060810 100%)' }}>
      <div className="text-center max-w-md space-y-5">
        <div className="flex justify-center" style={{ filter: 'drop-shadow(0 0 24px rgba(24,119,242,0.4))' }}>
          <VillageLogo size={72} variant="circle" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white mb-2">Something went wrong</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Spirit hit a snag. This has been logged and we&apos;re on it.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full text-sm font-bold text-white transition-all"
            style={{ background: '#1877F2' }}
          >
            Try again
          </button>
          <Link href="/village/map"
            className="px-6 py-3 rounded-full text-sm font-bold border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  );
}
