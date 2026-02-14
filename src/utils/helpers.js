// Generate a random room code
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Clamp value
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Distance between two 3D points
export function distance3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Simple noise for terrain (value noise)
export function createNoise(seed = 42) {
  const perm = new Uint8Array(512);
  let s = seed;
  function rng() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  }
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  return function noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v
    );
  };
}

// Octave noise
export function octaveNoise(noise, x, y, octaves = 4, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return total / maxValue;
}

// Color hex to RGB
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
}

// Generate math problem for given difficulty
export function generateMathProblem(difficulty = 1) {
  const problems = [];

  if (difficulty <= 1) {
    // Simple addition (6-year-old friendly too)
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    problems.push({ question: `${a} + ${b} = ?`, answer: a + b });
    // Simple subtraction
    const c = Math.floor(Math.random() * 10) + 5;
    const d = Math.floor(Math.random() * Math.min(c, 5)) + 1;
    problems.push({ question: `${c} - ${d} = ?`, answer: c - d });
  } else if (difficulty <= 2) {
    // Multiplication
    const a = Math.floor(Math.random() * 5) + 2;
    const b = Math.floor(Math.random() * 5) + 2;
    problems.push({ question: `${a} × ${b} = ?`, answer: a * b });
    // Two-digit addition
    const c = Math.floor(Math.random() * 30) + 10;
    const d = Math.floor(Math.random() * 30) + 10;
    problems.push({ question: `${c} + ${d} = ?`, answer: c + d });
  } else {
    // Harder multiplication
    const a = Math.floor(Math.random() * 8) + 3;
    const b = Math.floor(Math.random() * 8) + 3;
    problems.push({ question: `${a} × ${b} = ?`, answer: a * b });
    // Division
    const d = Math.floor(Math.random() * 8) + 2;
    const result = Math.floor(Math.random() * 8) + 2;
    problems.push({ question: `${d * result} ÷ ${d} = ?`, answer: result });
  }

  return problems[Math.floor(Math.random() * problems.length)];
}

// Generate color pattern for creative puzzles
export function generateColorPattern(size = 3, numColors = 4) {
  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#e91e8f', '#00cec9'];
  const selected = colors.slice(0, numColors);
  const pattern = [];
  for (let i = 0; i < size * size; i++) {
    pattern.push(selected[Math.floor(Math.random() * selected.length)]);
  }
  return { pattern, colors: selected };
}

// Easing functions
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
