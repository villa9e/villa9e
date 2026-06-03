'use client';
import Link from 'next/link';
import { useVillageTheme } from '@/lib/theme/useVillageTheme';

const C = {
  day:   { card:'#FFFFFF', border:'#C8DCE8', action:'#0A5F8A', textTer:'#7A9AAE' },
  night: { card:'#0E1E2E', border:'#1A3040', action:'#2A9FCC', textTer:'#4A7A96' },
};

const TABS = [
  { href:'/village/bank',              label:'Home',    d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href:'/village/bank/move',         label:'Move',    d:'M5 12h14M12 5l7 7-7 7' },
  { href:'/village/bank/invest',       label:'Invest',  d:'M23 6l-9.5 9.5-5-5L1 18' },
  { href:'/village/bank/village-fund', label:'Fund',    d:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { href:'/village/bank/more',         label:'More',    d:'M5 12h14M5 6h14M5 18h14' },
];

export function BankBottomNav({ active }: { active: string }) {
  const { theme } = useVillageTheme();
  const c = theme === 'night' ? C.night : C.day;
  return (
    <nav style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:480, background:c.card, borderTop:`1px solid ${c.border}`, display:'flex', zIndex:50, paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {TABS.map(t => {
        const on = active === t.href;
        return (
          <Link key={t.href} href={t.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 8px', color:on?c.action:c.textTer, textDecoration:'none', fontSize:10, fontWeight:on?700:400, gap:3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on?2.5:1.5} strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
