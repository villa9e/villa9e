// ─── Pure-function SVG avatar generator ───────────────────────────────────────
// Returns an SVG string (not JSX) so it can be used in canvas textures,
// img src attributes, and anywhere outside React's render tree.

import { SKIN_TONE_MAP, HAIR_COLOR_MAP, SHIRT_COLOR_MAP, type AvatarConfig } from './config';

function hex2rgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function darker(hex: string, amt = 30): string {
  const { r, g, b } = hex2rgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}
function lighter(hex: string, amt = 20): string {
  const { r, g, b } = hex2rgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}
function lipColor(hex: string): string {
  const { r, g, b } = hex2rgb(hex);
  return `rgb(${Math.max(0, r - 55)},${Math.max(0, g - 90)},${Math.max(0, b - 80)})`;
}

export function generateAvatarSVG(config: AvatarConfig, width = 140, height = 220): string {
  const sk  = SKIN_TONE_MAP[config.skin_id]       ?? '#A86030';
  const hc  = HAIR_COLOR_MAP[config.hair_color_id] ?? '#0C0700';
  const sh  = SHIRT_COLOR_MAP[config.outfit_id]    ?? '#2563EB';

  const skD = darker(sk, 22);
  const skL = lighter(sk, 18);
  const shD = darker(sh, 30);
  const pnt = '#1A2A3A';
  const sho = '#1A1A1A';
  const lip = lipColor(sk);

  const hairSVG: Record<string, string> = {
    h1: `<!-- Afro -->
      <ellipse cx="70" cy="22" rx="40" ry="36" fill="${hc}" stroke="#0A0500" stroke-width="2"/>
      <ellipse cx="34" cy="35" rx="14" ry="20" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      <ellipse cx="106" cy="35" rx="14" ry="20" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      <path d="M34,52 Q70,62 106,52" fill="${hc}"/>`,

    h2: `<!-- Natural -->
      <ellipse cx="70" cy="20" rx="36" ry="28" fill="${hc}" stroke="#0A0500" stroke-width="2"/>
      <path d="M34,42 Q70,55 106,42" fill="${hc}"/>
      <ellipse cx="56" cy="14" rx="8" ry="7" fill="${lighter(hc,10)}" opacity="0.4"/>
      <ellipse cx="70" cy="12" rx="8" ry="7" fill="${lighter(hc,10)}" opacity="0.4"/>
      <ellipse cx="84" cy="14" rx="8" ry="7" fill="${lighter(hc,10)}" opacity="0.4"/>`,

    h3: `<!-- Locs -->
      <ellipse cx="70" cy="14" rx="33" ry="22" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      ${[-18,-9,0,9,18].map(x =>
        `<path d="M${70+x},28 Q${70+x+5},45 ${70+x+2},62" stroke="${hc}" stroke-width="7" fill="none" stroke-linecap="round"/>`
      ).join('')}
      ${[-12,0,12].map(x =>
        `<path d="M${70+x+3},42 Q${70+x+8},55 ${70+x+5},68" stroke="${lighter(hc,15)}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>`
      ).join('')}`,

    h4: `<!-- Braids -->
      <ellipse cx="70" cy="14" rx="33" ry="20" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      ${[-16,-6,4,14].map(x =>
        `<path d="M${58+x*1.5},28 Q${60+x*1.5},50 ${58+x*1.5},72" stroke="${hc}" stroke-width="6" fill="none" stroke-linecap="round"/>
         <path d="M${58+x*1.5},28 Q${62+x*1.5},50 ${62+x*1.5},72" stroke="${darker(hc,20)}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>`
      ).join('')}`,

    h5: `<!-- Fade -->
      <ellipse cx="70" cy="18" rx="33" ry="18" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      <rect x="37" y="22" width="66" height="16" rx="4" fill="${hc}" opacity="0.4"/>
      <rect x="37" y="34" width="66" height="8" rx="4" fill="${hc}" opacity="0.2"/>`,

    h6: `<!-- Short -->
      <rect x="37" y="10" width="66" height="22" rx="10" fill="${hc}" stroke="#0A0500" stroke-width="1.5"/>
      <ellipse cx="70" cy="18" rx="33" ry="15" fill="${hc}"/>`,
  };

  const accSVG: Record<string, string> = {
    a0: '',
    a1: `${[-14,-7,0,7,14].map(x =>
          `<polygon points="${64+x},4 ${67+x},16 ${61+x},16" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>`
        ).join('')}
        <rect x="36" y="15" width="68" height="10" rx="4" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
        ${[0,1,2,3].map(i => `<circle cx="${50+i*14}" cy="20" r="3" fill="#DC2626"/>`).join('')}`,

    a2: Array.from({length:18}, (_,i) => {
          const a = (i/18)*Math.PI*2;
          return `<circle cx="${70+Math.cos(a)*26}" cy="${90+Math.sin(a)*8}" r="3.5" fill="${['#FFD700','#DC2626','#16A34A'][i%3]}" stroke="#0A0500" stroke-width="0.5"/>`;
        }).join(''),

    a3: `<rect x="40" y="39" width="22" height="14" rx="7" fill="#111" opacity="0.88"/>
         <rect x="78" y="39" width="22" height="14" rx="7" fill="#111" opacity="0.88"/>
         <line x1="62" y1="46" x2="78" y2="46" stroke="#555" stroke-width="2"/>
         <line x1="37" y1="46" x2="40" y2="46" stroke="#555" stroke-width="2"/>
         <line x1="100" y1="46" x2="103" y2="46" stroke="#555" stroke-width="2"/>`,

    a4: `<rect x="67" y="100" width="7" height="24" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>
         <rect x="58" y="102" width="25" height="7" rx="3" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>
         <ellipse cx="70.5" cy="101" rx="8" ry="10" fill="none" stroke="#FFD700" stroke-width="4.5"/>`,

    a5: `<path d="M34,42 Q44,30 70,28 Q96,30 106,42 Q96,50 70,52 Q44,50 34,42 Z" fill="${sh}" opacity="0.75" stroke="${shD}" stroke-width="1"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 220" width="${width}" height="${height}">
  <defs>
    <radialGradient id="hg" cx="42%" cy="36%" r="60%">
      <stop offset="0%" stop-color="${skL}"/>
      <stop offset="100%" stop-color="${skD}"/>
    </radialGradient>
    <radialGradient id="sg" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${lighter(sh,25)}"/>
      <stop offset="100%" stop-color="${shD}"/>
    </radialGradient>
  </defs>

  <!-- Legs -->
  <rect x="50" y="152" width="16" height="50" rx="8" fill="${pnt}" stroke="#0A0500" stroke-width="2"/>
  <rect x="74" y="152" width="16" height="50" rx="8" fill="${pnt}" stroke="#0A0500" stroke-width="2"/>
  <!-- Shoes -->
  <ellipse cx="58" cy="203" rx="13" ry="7" fill="${sho}" stroke="#0A0500" stroke-width="1.5"/>
  <ellipse cx="82" cy="203" rx="13" ry="7" fill="${sho}" stroke="#0A0500" stroke-width="1.5"/>

  <!-- Arms -->
  <path d="M44,95 Q28,110 26,138" stroke="${sh}" stroke-width="17" fill="none" stroke-linecap="round"/>
  <path d="M44,95 Q28,110 26,138" stroke="#0A0500" stroke-width="19" fill="none" stroke-linecap="round" opacity="0.5"/>
  <path d="M44,95 Q28,110 26,138" stroke="${sh}" stroke-width="17" fill="none" stroke-linecap="round"/>
  <circle cx="26" cy="140" r="9" fill="${sk}" stroke="#0A0500" stroke-width="1.5"/>
  <path d="M96,95 Q112,110 114,138" stroke="#0A0500" stroke-width="19" fill="none" stroke-linecap="round" opacity="0.5"/>
  <path d="M96,95 Q112,110 114,138" stroke="${sh}" stroke-width="17" fill="none" stroke-linecap="round"/>
  <circle cx="114" cy="140" r="9" fill="${sk}" stroke="#0A0500" stroke-width="1.5"/>

  <!-- Torso -->
  <rect x="40" y="88" width="60" height="68" rx="12" fill="#0A0500"/>
  <rect x="42" y="90" width="56" height="64" rx="10" fill="url(#sg)"/>
  ${config.outfit_id === 'o1' ? `
  <rect x="42" y="112" width="56" height="5" rx="2" fill="#FFD700" opacity="0.6"/>
  <rect x="42" y="122" width="56" height="3" rx="1" fill="#DC2626" opacity="0.5"/>
  <rect x="42" y="130" width="56" height="5" rx="2" fill="#16A34A" opacity="0.5"/>
  ` : ''}
  <!-- V-collar -->
  <path d="M56,92 L70,108 L84,92" fill="none" stroke="${lighter(sh,40)}" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Belt -->
  <rect x="40" y="148" width="60" height="8" rx="3" fill="#0A0A0A"/>
  <rect x="63" y="149" width="14" height="6" rx="2" fill="#C9A020"/>

  <!-- Neck -->
  <rect x="57" y="78" width="26" height="18" rx="9" fill="${sk}" stroke="#0A0500" stroke-width="1.5"/>

  <!-- Head outline -->
  <ellipse cx="70" cy="50" rx="37" ry="41" fill="#0A0500"/>
  <!-- Head fill -->
  <ellipse cx="70" cy="50" rx="36" ry="40" fill="url(#hg)"/>
  <!-- Cheek puffs -->
  <ellipse cx="44" cy="55" rx="11" ry="9" fill="${skL}" opacity="0.35"/>
  <ellipse cx="96" cy="55" rx="11" ry="9" fill="${skL}" opacity="0.35"/>
  <!-- Cheek blush -->
  <ellipse cx="46" cy="57" rx="9" ry="6" fill="#E87868" opacity="0.2"/>
  <ellipse cx="94" cy="57" rx="9" ry="6" fill="#E87868" opacity="0.2"/>

  <!-- Hair (rendered behind face features) -->
  ${hairSVG[config.hair_id] ?? hairSVG.h1}

  <!-- Ears -->
  <ellipse cx="33" cy="50" rx="7" ry="9" fill="${sk}" stroke="#0A0500" stroke-width="1.5"/>
  <ellipse cx="107" cy="50" rx="7" ry="9" fill="${sk}" stroke="#0A0500" stroke-width="1.5"/>

  <!-- LEFT EYE — almond/oval -->
  <ellipse cx="53" cy="47" rx="11" ry="13" fill="${skD}" opacity="0.35" transform="translate(0.5,1)"/>
  <ellipse cx="53" cy="46" rx="10.5" ry="12" fill="white"/>
  <ellipse cx="53" cy="47" rx="7.5" ry="9" fill="#140C06"/>
  <ellipse cx="53" cy="47" rx="6" ry="7.5" fill="#5A2E10"/>
  <ellipse cx="53" cy="47" rx="4" ry="5" fill="#040100"/>
  <circle cx="49.5" cy="43" r="2.4" fill="white"/>
  <circle cx="55.5" cy="49" r="1.2" fill="rgba(255,255,255,0.75)"/>
  <!-- Top lash -->
  <path d="M42.5,36.5 Q53,33 63.5,36.5" stroke="#0A0500" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <!-- Bottom lash -->
  <path d="M44,57 Q53,60 62,57" stroke="#0A0500" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.55"/>

  <!-- RIGHT EYE -->
  <ellipse cx="87" cy="47" rx="11" ry="13" fill="${skD}" opacity="0.35" transform="translate(0.5,1)"/>
  <ellipse cx="87" cy="46" rx="10.5" ry="12" fill="white"/>
  <ellipse cx="87" cy="47" rx="7.5" ry="9" fill="#140C06"/>
  <ellipse cx="87" cy="47" rx="6" ry="7.5" fill="#5A2E10"/>
  <ellipse cx="87" cy="47" rx="4" ry="5" fill="#040100"/>
  <circle cx="83.5" cy="43" r="2.4" fill="white"/>
  <circle cx="89.5" cy="49" r="1.2" fill="rgba(255,255,255,0.75)"/>
  <path d="M76.5,36.5 Q87,33 97.5,36.5" stroke="#0A0500" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M78,57 Q87,60 96,57" stroke="#0A0500" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.55"/>

  <!-- Eyebrows -->
  <path d="M42.5,29.5 Q53,25.5 63.5,29.5" stroke="${hc}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M76.5,29.5 Q87,25.5 97.5,29.5" stroke="${hc}" stroke-width="3.5" fill="none" stroke-linecap="round"/>

  <!-- Nose -->
  <ellipse cx="70" cy="62" rx="4.5" ry="3.5" fill="none" stroke="${darker(sk,36)}" stroke-width="2" stroke-linecap="round"/>

  <!-- Mouth — wide smile -->
  <path d="M54,72 Q70,84 86,72" fill="${lip}" stroke="#0A0500" stroke-width="1"/>
  <path d="M54,72 Q70,84 86,72" fill="none" stroke="#0A0500" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M57,72 Q70,81 83,72" fill="white" opacity="0.65"/>
  <circle cx="54" cy="72" r="2.5" fill="${lip}"/>
  <circle cx="86" cy="72" r="2.5" fill="${lip}"/>

  <!-- Accessories -->
  ${accSVG[config.accessory_id] ?? ''}
</svg>`;
}
