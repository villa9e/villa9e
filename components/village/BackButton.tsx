'use client';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  /** If provided, navigate to this path. If omitted, uses router.back(). */
  to?: string;
  label?: string;
}

export function BackButton({ to, label }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (to) {
      router.push(to);
    } else {
      router.back();
    }
  }

  return (
    <button
      onClick={handleBack}
      aria-label={label ?? 'Go back'}
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top, 0px))',
        left: 16,
        zIndex: 60,
        width: 40,
        height: 40,
        borderRadius: 20,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
