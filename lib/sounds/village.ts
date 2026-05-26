'use client';

// Village Sound System — Web Audio API (no file downloads)
// Each sound is synthesized in-browser using oscillators
// Respects system audio settings; silently fails if audio blocked

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function play(
  type: OscillatorType,
  frequency: number,
  duration: number,
  volume: number = 0.3,
  delay: number = 0,
  wave?: { attack?: number; decay?: number }
) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type      = type;
    osc.frequency.setValueAtTime(frequency, c.currentTime + delay);

    const attack = wave?.attack ?? 0.01;
    const decay  = wave?.decay  ?? duration;

    gain.gain.setValueAtTime(0, c.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + decay);

    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.05);
  } catch { /* silent */ }
}

export const VillageSound = {
  // Short percussive thud — OoWop given
  oowop() {
    play('sine',   120,  0.15, 0.4, 0,    { attack: 0.005, decay: 0.15 });
    play('triangle', 200, 0.1, 0.2, 0.02);
    play('sine',    80,  0.12, 0.3, 0.04);
  },

  // Warm chime trio — step validated
  validated() {
    play('sine', 523, 0.4, 0.25, 0,   { attack: 0.01, decay: 0.4 });
    play('sine', 659, 0.4, 0.4, 0.08, { attack: 0.01, decay: 0.4 });
    play('sine', 784, 0.5, 0.5, 0.16, { attack: 0.01, decay: 0.5 });
  },

  // Ascending fanfare — level up / goal complete
  levelUp() {
    [523, 659, 784, 1047].forEach((freq, i) => {
      play('sine', freq, 0.35, 0.3, i * 0.1, { attack: 0.01, decay: 0.35 });
    });
    // Harmony
    play('sine', 1318, 0.6, 0.8, 0.35, { attack: 0.02, decay: 0.8 });
  },

  // Soft bell — new notification
  notification() {
    play('sine', 880, 0.3, 0.15, 0, { attack: 0.005, decay: 0.3 });
    play('sine', 1320, 0.2, 0.25, 0.05);
  },

  // Gentle swoosh — post published
  post() {
    play('sine', 440, 0.15, 0.1, 0,    { attack: 0.005, decay: 0.15 });
    play('sine', 660, 0.15, 0.15, 0.06, { attack: 0.005, decay: 0.15 });
  },

  // Warm bass note — step completed
  stepComplete() {
    play('sine',     392, 0.3, 0.3, 0,    { attack: 0.01, decay: 0.3 });
    play('triangle', 523, 0.2, 0.25, 0.05);
    play('sine',     659, 0.2, 0.35, 0.1, { attack: 0.01, decay: 0.35 });
  },

  // Deep tribal drum — goal achieved
  goalAchieved() {
    // Bass drum
    play('sine',   60,  0.2, 0.5, 0,    { attack: 0.005, decay: 0.2 });
    play('sine',   80,  0.1, 0.15, 0.02);
    // Melody fanfare
    [523, 659, 784, 1047, 1318].forEach((freq, i) => {
      play('sine', freq, 0.5, 0.28, 0.15 + i * 0.09, { attack: 0.01, decay: 0.5 });
    });
  },

  // Soft tick — toggle/tap feedback
  tap() {
    play('sine', 600, 0.05, 0.08, 0, { attack: 0.002, decay: 0.05 });
  },
};
