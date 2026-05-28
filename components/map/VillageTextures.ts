import * as THREE from 'three';

// ─── Procedural canvas texture utilities ─────────────────────────────────────
// All functions return CanvasTextures that simulate real materials.
// These work with MeshToonMaterial.map to add surface detail while
// preserving the stylized toon shading look.

export function createWoodGrainTexture(
  baseColor = '#6B3A1F',
  ringColor  = '#3D1E08',
  size       = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base wood color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Longitudinal grain lines — the dominant feature of wood
  for (let i = 0; i < 55; i++) {
    const x    = (i / 55) * size + (Math.random() - 0.5) * 6;
    const wave = 4 + Math.random() * 8;
    const freq = 0.015 + Math.random() * 0.02;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= size; y += 2) {
      ctx.lineTo(x + Math.sin(y * freq + i) * wave, y);
    }
    ctx.strokeStyle = i % 3 === 0 ? ringColor : 'rgba(0,0,0,0.18)';
    ctx.lineWidth   = 0.5 + Math.random() * 1.0;
    ctx.globalAlpha = 0.12 + Math.random() * 0.25;
    ctx.stroke();
  }

  // Annual rings — concentric oval-ish arcs visible at cut ends
  for (let ring = 0; ring < 8; ring++) {
    const cx  = size * 0.45 + (Math.random() - 0.5) * 20;
    const cy  = size * 0.5;
    const rx  = 20 + ring * 18 + Math.random() * 8;
    const ry  = rx * (0.55 + Math.random() * 0.3);
    const rot = (Math.random() - 0.5) * 0.4;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth   = 0.8 + Math.random() * 1.2;
    ctx.globalAlpha = 0.08 + Math.random() * 0.18;
    ctx.stroke();
  }

  // Knot — optional circular feature
  const kx = size * 0.35 + Math.random() * size * 0.3;
  const ky  = size * 0.3  + Math.random() * size * 0.4;
  ctx.beginPath();
  ctx.ellipse(kx, ky, 8 + Math.random() * 10, 6 + Math.random() * 8, Math.random(), 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(kx, ky, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle   = ringColor;
  ctx.globalAlpha = 0.55;
  ctx.fill();

  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 2.0);
  return tex;
}

export function createDarkWoodTexture(): THREE.CanvasTexture {
  return createWoodGrainTexture('#2A1208', '#180800');
}

export function createCedarTexture(): THREE.CanvasTexture {
  return createWoodGrainTexture('#8B4513', '#5C2A0A');
}

export function createEbonyTexture(): THREE.CanvasTexture {
  return createWoodGrainTexture('#1A0A00', '#0D0500');
}

export function createBambooTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8FAA3A';
  ctx.fillRect(0, 0, 128, 256);

  // Node rings every ~45px
  for (let y = 20; y < 256; y += 44 + Math.floor(Math.random() * 8)) {
    ctx.beginPath();
    ctx.rect(0, y, 128, 5);
    ctx.fillStyle = '#5A7020';
    ctx.globalAlpha = 0.65;
    ctx.fill();
    ctx.beginPath();
    ctx.rect(0, y + 5, 128, 2);
    ctx.fillStyle = '#AACF5A';
    ctx.globalAlpha = 0.35;
    ctx.fill();
  }

  // Vertical grain lines
  for (let i = 0; i < 20; i++) {
    const x = (i / 20) * 128;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + Math.random() * 3 - 1.5, 256);
    ctx.strokeStyle = '#6A8A28';
    ctx.lineWidth   = 0.5 + Math.random();
    ctx.globalAlpha = 0.15 + Math.random() * 0.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createMudBrickTexture(): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#B87848';
  ctx.fillRect(0, 0, S, S);

  const bw = 72, bh = 28, gap = 6;
  const rows = Math.ceil(S / (bh + gap));
  const cols = Math.ceil(S / (bw + gap));

  for (let row = 0; row < rows; row++) {
    const y      = row * (bh + gap);
    const offset = (row % 2) * (bw / 2 + gap / 2);
    for (let col = -1; col <= cols; col++) {
      const x = col * (bw + gap) + offset;
      // Brick face — slight color variation per brick
      const brightness = 0.88 + Math.random() * 0.24;
      ctx.fillStyle = `rgba(${Math.round(184 * brightness)},${Math.round(120 * brightness)},${Math.round(72 * brightness)},1)`;
      ctx.fillRect(x, y, bw, bh);

      // Mortar lines
      ctx.strokeStyle = '#6A3E20';
      ctx.lineWidth   = gap;
      ctx.globalAlpha = 0.55;
      ctx.strokeRect(x - gap / 2, y - gap / 2, bw + gap, bh + gap);
      ctx.globalAlpha = 1;

      // Surface texture — tiny pits/roughness
      for (let p = 0; p < 5; p++) {
        const px = x + Math.random() * bw;
        const py = y + Math.random() * bh;
        ctx.beginPath();
        ctx.arc(px, py, 0.8 + Math.random(), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,50,20,0.3)';
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createStoneTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8A7868';
  ctx.fillRect(0, 0, S, S);

  // Voronoi-like stone pattern via random placement
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 12 + Math.random() * 28;

    const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    grad.addColorStop(0,   `rgba(${130 + Math.random() * 30|0},${110 + Math.random() * 20|0},${95 + Math.random() * 20|0},0.6)`);
    grad.addColorStop(0.7, `rgba(100,80,65,0.4)`);
    grad.addColorStop(1,   'rgba(60,50,40,0)');

    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Mortar cracks
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * S, Math.random() * S);
    ctx.lineTo(Math.random() * S, Math.random() * S);
    ctx.strokeStyle = '#4A3828';
    ctx.lineWidth   = 1 + Math.random() * 1.5;
    ctx.globalAlpha = 0.3 + Math.random() * 0.3;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createMarbleTexture(): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  // Creamy white base
  ctx.fillStyle = '#F0EBE0';
  ctx.fillRect(0, 0, S, S);

  // Marble veins — turbulent sine-based paths
  function vein(sx: number, sy: number, ex: number, ey: number, color: string, width: number) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let x = sx, y = sy;
    const dx = (ex - sx) / 60, dy = (ey - sy) / 60;
    for (let t = 0; t < 60; t++) {
      x += dx + (Math.random() - 0.5) * 14;
      y += dy + (Math.random() - 0.5) * 14;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth   = width;
    ctx.globalAlpha = 0.12 + Math.random() * 0.18;
    ctx.stroke();
  }

  const veinColors = ['#9A8870', '#C0A880', '#7A6850', '#B0987A'];
  for (let i = 0; i < 12; i++) {
    vein(
      Math.random() * S, 0,
      Math.random() * S, S,
      veinColors[i % veinColors.length],
      0.5 + Math.random() * 2.5,
    );
  }
  for (let i = 0; i < 8; i++) {
    vein(
      0, Math.random() * S,
      S, Math.random() * S,
      veinColors[i % veinColors.length],
      0.3 + Math.random() * 1.5,
    );
  }

  // Subtle cloud variations
  for (let i = 0; i < 6; i++) {
    const grad = ctx.createRadialGradient(
      Math.random() * S, Math.random() * S, 0,
      Math.random() * S, Math.random() * S, 80 + Math.random() * 100,
    );
    grad.addColorStop(0,   'rgba(220,200,180,0.12)');
    grad.addColorStop(1,   'rgba(240,230,215,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, S, S);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  return tex;
}

export function createThatchTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8A6808';
  ctx.fillRect(0, 0, S, S);

  // Horizontal straw bundles
  for (let row = 0; row < 40; row++) {
    const y0    = (row / 40) * S;
    const thick = 3 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= S; x += 4) {
      ctx.lineTo(x, y0 + (Math.random() - 0.5) * 2.5);
    }
    ctx.strokeStyle = `rgba(${(60 + Math.random() * 40)|0},${(40 + Math.random() * 25)|0},${(5 + Math.random() * 10)|0},${0.5 + Math.random() * 0.4})`;
    ctx.lineWidth   = thick;
    ctx.stroke();
  }

  // Individual straw strands crossing at angles
  for (let i = 0; i < 80; i++) {
    const x0 = Math.random() * S * 1.2 - S * 0.1;
    const angle = (Math.random() - 0.5) * 0.3;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + Math.sin(angle) * S, S);
    ctx.strokeStyle = `rgba(${(55 + Math.random() * 35)|0},${(38 + Math.random() * 22)|0},0,${0.08 + Math.random() * 0.18})`;
    ctx.lineWidth   = 0.5 + Math.random() * 1.2;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  return tex;
}

export function createGrassTexture(): THREE.CanvasTexture {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3A6820';
  ctx.fillRect(0, 0, S, S);

  // Individual blade strokes
  for (let i = 0; i < 120; i++) {
    const x    = Math.random() * S;
    const yBot = S;
    const h    = 12 + Math.random() * 24;
    const lean = (Math.random() - 0.5) * 12;

    ctx.beginPath();
    ctx.moveTo(x, yBot);
    ctx.quadraticCurveTo(x + lean * 0.5, yBot - h * 0.5, x + lean, yBot - h);
    ctx.strokeStyle = `hsl(${105 + Math.random() * 20|0},${50 + Math.random() * 20|0}%,${25 + Math.random() * 20|0}%)`;
    ctx.lineWidth   = 1 + Math.random() * 1.5;
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function createDirtPathTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8A6040';
  ctx.fillRect(0, 0, S, S);

  // Pebbles
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 2 + Math.random() * 6;
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0,   'rgba(160,130,100,0.8)');
    grad.addColorStop(0.6, 'rgba(110,85,60,0.6)');
    grad.addColorStop(1,   'rgba(60,40,20,0)');
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.7 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Footprint / compression marks
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 12, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,35,15,0.18)';
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}
