'use client';

import * as THREE from 'three';

// ===== Canvas-based procedural texture generator =====
// Creates textures at runtime using Canvas2D for an Animal Crossing style look

function createCanvasTexture(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  wrapS: THREE.Wrapping = THREE.RepeatWrapping,
  wrapT: THREE.Wrapping = THREE.RepeatWrapping,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = wrapS;
  tex.wrapT = wrapT;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// Seeded pseudo-random for deterministic textures
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ===== GRASS TEXTURE =====
export function createGrassTexture(
  baseColor: string = '#7EC850',
  darkColor: string = '#5AAE30',
  season: string = 'summer',
): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(42);

    // Organic variation patches
    for (let i = 0; i < 30; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 8 + rng() * 25;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const variation = rng() > 0.5 ? darkColor : baseColor;
      grad.addColorStop(0, variation);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.25 + rng() * 0.2;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Individual grass blades
    for (let i = 0; i < 600; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const len = 3 + rng() * 8;
      const angle = -Math.PI / 2 + (rng() - 0.5) * 0.6;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.strokeStyle = rng() > 0.5 ? darkColor : '#6CBF40';
      ctx.globalAlpha = 0.2 + rng() * 0.25;
      ctx.lineWidth = 0.5 + rng() * 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Small bright spots (dew/highlights)
    for (let i = 0; i < 40; i++) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + rng() * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = season === 'winter' ? '#E8EDE0' : '#A8E88C';
      ctx.globalAlpha = 0.2 + rng() * 0.15;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Clover-like patches for natural grass variation
    for (let i = 0; i < 18; i++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const cloverSize = 3 + rng() * 5;
      for (let j = 0; j < 3; j++) {
        const angle = (j / 3) * Math.PI * 2 + rng() * 0.3;
        const lx = cx + Math.cos(angle) * cloverSize * 0.5;
        const ly = cy + Math.sin(angle) * cloverSize * 0.5;
        ctx.beginPath();
        ctx.arc(lx, ly, cloverSize * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = season === 'winter' ? '#B8C8B0' : '#3D8B3D';
        ctx.globalAlpha = 0.12 + rng() * 0.1;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Subtle mowed-stripe pattern for a tended lawn look
    if (season !== 'winter') {
      for (let row = 0; row < h; row += 16) {
        const stripeAlpha = (row / 16) % 2 === 0 ? 0.06 : 0;
        if (stripeAlpha > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = stripeAlpha;
          ctx.fillRect(0, row, w, 8);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Tiny wildflowers in spring
    if (season === 'spring') {
      const flowerColors = ['#FFB7D5', '#DDA0DD', '#FFEB3B', '#FFD700'];
      for (let i = 0; i < 15; i++) {
        const x = rng() * w;
        const y = rng() * h;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + rng() * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = flowerColors[Math.floor(rng() * flowerColors.length)];
        ctx.globalAlpha = 0.6 + rng() * 0.3;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  });
}

// ===== SOIL / DIRT TEXTURE =====
export function createSoilTexture(
  baseColor: string = '#5C3D1E',
  darkColor: string = '#3A2510',
): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(117);

    // Noise patches for variation
    for (let i = 0; i < 50; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 5 + rng() * 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const isDark = rng() > 0.4;
      grad.addColorStop(0, isDark ? darkColor : '#7A5A30');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.15 + rng() * 0.2;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Small pebbles/rocks
    for (let i = 0; i < 30; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const rx = 1 + rng() * 2.5;
      const ry = 0.8 + rng() * 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = rng() > 0.5 ? '#8A7050' : '#4A3518';
      ctx.globalAlpha = 0.25 + rng() * 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moisture/dark patches
    for (let i = 0; i < 12; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 10 + rng() * 15;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, darkColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Furrow lines (plowed soil feel)
    for (let row = 0; row < h; row += 12 + Math.floor(rng() * 6)) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      for (let x = 0; x < w; x += 3) {
        ctx.lineTo(x, row + (rng() - 0.5) * 2);
      }
      ctx.strokeStyle = darkColor;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

// ===== WOOD TEXTURE =====
export function createWoodTexture(
  baseColor: string = '#B8845C',
): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(333);

    // Wood grain lines
    for (let y = 0; y < h; y += 2 + rng() * 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      let x = 0;
      while (x < w) {
        const dx = 2 + rng() * 5;
        const dy = (rng() - 0.5) * 1.5;
        x += dx;
        ctx.lineTo(x, y + dy);
      }
      ctx.strokeStyle = rng() > 0.5 ? '#9A6A3C' : '#C4956A';
      ctx.globalAlpha = 0.15 + rng() * 0.15;
      ctx.lineWidth = 0.5 + rng() * 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Knots
    for (let i = 0; i < 3; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 4 + rng() * 8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#7A5A30';
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner rings
      for (let r = radius - 2; r > 1; r -= 2) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#6B4A22';
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Plank separation lines (vertical)
    for (let x = 0; x < w; x += 50 + rng() * 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.strokeStyle = '#5A3A18';
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Weathering / age spots for realism
    for (let i = 0; i < 8; i++) {
      const wx = rng() * w;
      const wy = rng() * h;
      const wRadius = 6 + rng() * 14;
      const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wRadius);
      grad.addColorStop(0, rng() > 0.5 ? '#6B5030' : '#A08860');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.08 + rng() * 0.06;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Nail head marks
    for (let i = 0; i < 6; i++) {
      const nx = rng() * w;
      const ny = rng() * h;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.5 + rng(), 0, Math.PI * 2);
      ctx.fillStyle = '#4A4A50';
      ctx.globalAlpha = 0.2 + rng() * 0.15;
      ctx.fill();
      // Small shadow under nail
      ctx.beginPath();
      ctx.arc(nx + 0.5, ny + 0.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#2A1A0A';
      ctx.globalAlpha = 0.08;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// ===== WATER TEXTURE =====
export function createWaterTexture(): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base water color with gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#4AA8C0');
    grad.addColorStop(0.5, '#5BC0D8');
    grad.addColorStop(1, '#4098B0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(777);

    // Ripple/caustic patterns
    for (let i = 0; i < 20; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 8 + rng() * 20;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#80D8F0';
      ctx.globalAlpha = 0.08 + rng() * 0.08;
      ctx.lineWidth = 1 + rng() * 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Light reflections
    for (let i = 0; i < 15; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const rx = 3 + rng() * 8;
      const ry = 1 + rng() * 3;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 0.05 + rng() * 0.08;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

// ===== STONE / PATH TEXTURE =====
export function createStoneTexture(): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    // Base grey
    ctx.fillStyle = '#B0AFA0';
    ctx.fillRect(0, 0, w, h);

    const rng = seededRandom(555);

    // Stone-like noise
    for (let i = 0; i < 80; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 2 + rng() * 12;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const tone = 140 + Math.floor(rng() * 60);
      grad.addColorStop(0, `rgb(${tone}, ${tone - 5}, ${tone - 15})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.12 + rng() * 0.15;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Fine grain/speckle
    for (let i = 0; i < 200; i++) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.fillStyle = rng() > 0.5 ? '#C0BFB0' : '#9A9890';
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Crack/vein lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = rng() * w;
      let y = rng() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 8; s++) {
        x += (rng() - 0.5) * 30;
        y += (rng() - 0.5) * 30;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#8A8878';
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

// ===== AMBIENT OCCLUSION GROUND SHADOW TEXTURE =====
// Creates a soft dark circle for fake AO under objects
export function createAOGroundTexture(): THREE.CanvasTexture {
  const size = 128;
  return createCanvasTexture(size, size, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
}

// ===== Texture cache to avoid re-creating on every render =====
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getCachedTexture(
  key: string,
  factory: () => THREE.CanvasTexture,
): THREE.CanvasTexture {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }
  const tex = factory();
  textureCache.set(key, tex);
  return tex;
}
