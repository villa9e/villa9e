'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const TABS = [
  { key:'home',  label:'Home',       href:'/village/pavilion',              d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { key:'live',  label:'Live',       href:'/village/pavilion/live',         d:'M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
  { key:'learn', label:'Learn',      href:'/village/pavilion/learn',        d:'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { key:'mine',  label:'My Content', href:'/village/pavilion/create-event', d:'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM12 11v6M9 14h6' },
] as const;

type PavilionTab = typeof TABS[number]['key'];

export function PavilionNav({ active }: { active: PavilionTab }) {
  const { theme } = useVillageTheme();
  const isNight = theme === 'night';
  const bg       = isNight ? '#080E24' : '#FFFFFF';
  const border   = isNight ? '#1E2448' : '#E8EAF6';
  const activeC  = '#2952E8';
  const inactiveC = isNight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:bg, borderTop:`1px solid ${border}`, display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {TABS.map(t => {
        const on = active === t.key;
        return (
          <Link key={t.key} href={t.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 8px', color:on?activeC:inactiveC, textDecoration:'none', fontSize:10, fontWeight:on?700:400, gap:3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.5} strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
