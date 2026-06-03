import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to villa9e',
};

/**
 * Onboarding layout — full screen, no BottomNav, no sidebar.
 * This is pre-village so navigation chrome must not appear.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#080E24',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
