// Sun position calculator — pure TypeScript, no dependencies
// Accurate to within ~1 minute for sunrise/sunset
// Based on Jean Meeus "Astronomical Algorithms"

export interface SunTimes {
  sunrise:   Date;
  sunset:    Date;
  noon:      Date;
  dawn:      Date;    // civil twilight start
  dusk:      Date;    // civil twilight end
  goldenMorning: Date;
  goldenEvening: Date;
}

export interface SkyState {
  phase:       'night' | 'dawn' | 'sunrise' | 'morning' | 'noon' | 'afternoon' | 'golden' | 'sunset' | 'dusk';
  progress:    number;   // 0-1 within this phase
  sunAltitude: number;   // degrees above horizon (-90 to 90)
  sunAzimuth:  number;   // degrees from north (0-360)
  // Sky colors
  skyTop:    string;
  skyMid:    string;
  skyHor:    string;     // horizon color
  sunColor:  string;
  ambientIntensity: number;  // 0-1
  ambientColor: string;
  fogColor:  string;
  // Special effects
  hasFog:    boolean;
  fogDensity: number;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function sunEquatorialCoords(T: number): { ra: number; dec: number } {
  const L0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
  const M  = 357.52911 + T * (35999.05029 - T * 0.0001537);
  const e  = 0.016708634 - T * (0.000042037 + T * 0.0000001267);
  const C  = Math.sin(M*DEG)*(1.914602-T*(0.004817+0.000014*T)) + Math.sin(2*M*DEG)*(0.019993-0.000101*T) + Math.sin(3*M*DEG)*0.000289;
  const sunLon = L0 + C;
  const omega  = 125.04 - 1934.136 * T;
  const lambda = sunLon - 0.00569 - 0.00478 * Math.sin(omega*DEG);
  const eps    = 23.439291111 - T*(0.013004167+T*(0.000000164-T*0.000000504));
  const ra  = Math.atan2(Math.cos(eps*DEG)*Math.sin(lambda*DEG), Math.cos(lambda*DEG)) * RAD;
  const dec = Math.asin(Math.sin(eps*DEG)*Math.sin(lambda*DEG)) * RAD;
  return { ra: (ra + 360) % 360, dec };
}

export function getSunPosition(date: Date, lat: number, lon: number): { altitude: number; azimuth: number } {
  const jd = toJD(date);
  const T  = julianCenturies(jd);
  const { ra, dec } = sunEquatorialCoords(T);

  const GMST = 280.46061837 + 360.98564736629*(jd-2451545) + T*T*(0.000387933-T/38710000);
  const LMST = (GMST + lon + 360) % 360;
  const H    = (LMST - ra + 360) % 360;

  const sinAlt = Math.sin(dec*DEG)*Math.sin(lat*DEG) + Math.cos(dec*DEG)*Math.cos(lat*DEG)*Math.cos(H*DEG);
  const alt    = Math.asin(sinAlt) * RAD;

  const cosAz = (Math.sin(dec*DEG)-Math.sin(alt*DEG)*Math.sin(lat*DEG)) / (Math.cos(alt*DEG)*Math.cos(lat*DEG));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (Math.sin(H*DEG) > 0) az = 360 - az;

  return { altitude: alt, azimuth: az };
}

export function getSunTimes(date: Date, lat: number, lon: number): SunTimes {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);

  // Binary search for sunrise (when altitude crosses 0)
  function findCrossing(startH: number, endH: number, target = 0): Date {
    let lo = startH, hi = endH;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      const d = new Date(midnight.getTime() + mid * 3600000);
      const alt = getSunPosition(d, lat, lon).altitude;
      if (alt > target) hi = mid; else lo = mid;
    }
    return new Date(midnight.getTime() + ((lo + hi) / 2) * 3600000);
  }

  const sunrise       = findCrossing(3, 12, 0);
  const sunset        = findCrossing(12, 22, 0);
  // Solar noon = peak altitude; find by scanning every 6 minutes between 10-14h local
  let peakAlt = -90, peakH = 12;
  for (let h = 10; h <= 14; h += 0.1) {
    const d = new Date(midnight.getTime() + h * 3600000);
    const a = getSunPosition(d, lat, lon).altitude;
    if (a > peakAlt) { peakAlt = a; peakH = h; }
  }
  const noon          = new Date(midnight.getTime() + peakH * 3600000);
  // Dawn = civil twilight start (sun at -6°), symmetric with dusk
  const twilightMins  = Math.max(20, (sunrise.getTime() - midnight.getTime()) / 3600000 * 15);  // ~15min per hour before SR
  const dawn          = new Date(sunrise.getTime() - twilightMins * 60000);
  // Dusk = civil twilight end — symmetric with dawn (same twilight duration after sunset)
  const dusk          = new Date(sunset.getTime() + twilightMins * 60000);
  const goldenMorning = new Date(sunrise.getTime() + 3600000);
  const goldenEvening = new Date(sunset.getTime() - 3600000);

  return { sunrise, sunset, noon, dawn, dusk, goldenMorning, goldenEvening };
}

// ─── Sky state computation ────────────────────────────────────────────────────
// Interpolates sky colors based on sun altitude and time of day

function lerp(a: string, b: string, t: number): string {
  const parse = (c: string) => {
    const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), bl = parseInt(c.slice(5,7),16);
    return [r, g, bl];
  };
  const [r1,g1,b1] = parse(a);
  const [r2,g2,b2] = parse(b);
  const rr = Math.round(r1 + (r2-r1)*t);
  const gg = Math.round(g1 + (g2-g1)*t);
  const bb = Math.round(b1 + (b2-b1)*t);
  return `#${rr.toString(16).padStart(2,'0')}${gg.toString(16).padStart(2,'0')}${bb.toString(16).padStart(2,'0')}`;
}

// Sky color palettes per time of day
const SKY = {
  deep_night:  { top: '#020512', mid: '#050A20', hor: '#0A1240', sun: '#E8D5FF', amb: 0.15, ambC: '#1A0A30' },
  predawn:     { top: '#050A20', mid: '#1A1040', hor: '#3D1A60', sun: '#FFB4D0', amb: 0.2,  ambC: '#2A1040' },
  dawn:        { top: '#1A1040', mid: '#8B2FC9', hor: '#FF6B9D', sun: '#FFCCE0', amb: 0.35, ambC: '#4A2060' },
  sunrise:     { top: '#FF6B35', mid: '#FF9A3C', hor: '#FFD700', sun: '#FFF5B0', amb: 0.55, ambC: '#FF8A50' },
  golden_am:   { top: '#87CEEB', mid: '#FFB347', hor: '#FFD700', sun: '#FFFACD', amb: 0.75, ambC: '#FFE8A0' },
  morning:     { top: '#4A90D9', mid: '#87CEEB', hor: '#B0D8F0', sun: '#FFFFFF', amb: 0.85, ambC: '#FFFBF0' },
  midday:      { top: '#1E6FC8', mid: '#4A90D9', hor: '#87CEEB', sun: '#FFFFFF', amb: 1.0,  ambC: '#FFFFFF' },
  afternoon:   { top: '#2577C8', mid: '#55A0E0', hor: '#90D0F8', sun: '#FFF8E0', amb: 0.9,  ambC: '#FFF8F0' },
  golden_pm:   { top: '#1A5080', mid: '#FF8C42', hor: '#FFD700', sun: '#FFE87C', amb: 0.75, ambC: '#FFD070' },
  sunset:      { top: '#2A1060', mid: '#FF4500', hor: '#FFB347', sun: '#FFCC44', amb: 0.5,  ambC: '#FF8040' },
  dusk:        { top: '#100828', mid: '#4B1A82', hor: '#FF6B9D', sun: '#FFB4D0', amb: 0.3,  ambC: '#3A1060' },
  night:       { top: '#020512', mid: '#050A20', hor: '#080D28', sun: '#C8C8E0', amb: 0.15, ambC: '#0A0820' },
};

function phaseSky(phase: keyof typeof SKY, t = 0, nextPhase?: keyof typeof SKY): typeof SKY[keyof typeof SKY] {
  if (!nextPhase || t === 0) return SKY[phase];
  const a = SKY[phase];
  const b = SKY[nextPhase];
  return {
    top:  lerp(a.top, b.top, t),
    mid:  lerp(a.mid, b.mid, t),
    hor:  lerp(a.hor, b.hor, t),
    sun:  lerp(a.sun, b.sun, t),
    amb:  a.amb + (b.amb - a.amb) * t,
    ambC: lerp(a.ambC, b.ambC, t),
  };
}

export function computeSkyState(now: Date, sunTimes: SunTimes | null, altitude: number): SkyState {
  const t = now.getTime();

  if (!sunTimes) {
    // No location data — use clock-based approximation
    const h = now.getHours() + now.getMinutes() / 60;
    if (h < 5 || h >= 21) return buildState('night', phaseSky('deep_night'), altitude, 180);
    if (h < 7)   return buildState('dawn',      phaseSky('dawn'),      altitude, 90);
    if (h < 9)   return buildState('sunrise',   phaseSky('golden_am'), altitude, 110);
    if (h < 12)  return buildState('morning',   phaseSky('morning'),   altitude, 140);
    if (h < 14)  return buildState('noon',      phaseSky('midday'),    altitude, 180);
    if (h < 17)  return buildState('afternoon', phaseSky('afternoon'), altitude, 220);
    if (h < 19)  return buildState('golden',    phaseSky('golden_pm'), altitude, 250);
    if (h < 20)  return buildState('sunset',    phaseSky('sunset'),    altitude, 270);
    return buildState('dusk', phaseSky('dusk'), altitude, 280);
  }

  const { sunrise, sunset, noon, dawn, dusk, goldenMorning, goldenEvening } = sunTimes;

  const between = (a: Date, b: Date, p = 0) => t >= a.getTime() && t < b.getTime()
    ? (t - a.getTime()) / (b.getTime() - a.getTime())
    : -1;

  let phase: SkyState['phase'] = 'night';
  let sky  = phaseSky('deep_night');
  let azimuth = 180;

  const p_dawn    = between(dawn, sunrise);
  const p_sunrise = between(sunrise, goldenMorning);
  const p_golden_am = between(goldenMorning, new Date(sunrise.getTime() + 2*3600000));
  const p_morning = between(new Date(sunrise.getTime() + 2*3600000), noon);
  const p_noon    = between(new Date(noon.getTime() - 3600000), new Date(noon.getTime() + 3600000));
  const p_afternoon = between(noon, goldenEvening);
  const p_golden  = between(goldenEvening, sunset);
  const p_sunset  = between(sunset, new Date(sunset.getTime() + 1800000));
  const p_dusk    = between(new Date(sunset.getTime() + 1800000), dusk);

  if (p_dawn >= 0)       { phase = 'dawn';       sky = phaseSky('predawn', p_dawn, 'dawn'); azimuth = 70; }
  else if (p_sunrise >= 0){ phase = 'sunrise';    sky = phaseSky('dawn', p_sunrise, 'sunrise'); azimuth = 90; }
  else if (p_golden_am >= 0){ phase = 'morning';  sky = phaseSky('sunrise', p_golden_am, 'golden_am'); azimuth = 110; }
  else if (p_morning >= 0){ phase = 'morning';    sky = phaseSky('golden_am', p_morning, 'morning'); azimuth = 90 + p_morning * 90; }
  else if (p_noon >= 0)  { phase = 'noon';        sky = phaseSky('morning', p_noon, 'midday'); azimuth = 180; }
  else if (p_afternoon >= 0){ phase = 'afternoon'; sky = phaseSky('midday', p_afternoon, 'afternoon'); azimuth = 180 + p_afternoon * 60; }
  else if (p_golden >= 0){ phase = 'golden';      sky = phaseSky('afternoon', p_golden, 'golden_pm'); azimuth = 250; }
  else if (p_sunset >= 0){ phase = 'sunset';      sky = phaseSky('golden_pm', p_sunset, 'sunset'); azimuth = 270; }
  else if (p_dusk >= 0)  { phase = 'dusk';        sky = phaseSky('sunset', p_dusk, 'dusk'); azimuth = 280; }
  else                   { phase = 'night';       sky = phaseSky('deep_night'); azimuth = 0; }

  return buildState(phase, sky, altitude, azimuth);
}

function buildState(phase: SkyState['phase'], sky: any, altitude: number, azimuth: number): SkyState {
  const isNight = phase === 'night' || phase === 'dusk' || phase === 'dawn';
  return {
    phase, progress: 0,
    sunAltitude: altitude,
    sunAzimuth: azimuth,
    skyTop: sky.top,
    skyMid: sky.mid,
    skyHor: sky.hor,
    sunColor: sky.sun,
    ambientIntensity: sky.amb,
    ambientColor: sky.ambC,
    fogColor: sky.hor,
    hasFog: phase === 'dawn' || phase === 'dusk',
    fogDensity: phase === 'dawn' || phase === 'dusk' ? 0.015 : 0,
  };
}
