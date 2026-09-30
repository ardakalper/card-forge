// Procedural pixel portraits. Deterministic: the same monster id always draws the same creature,
// so every player sees the same card. Silhouette templates by creature type, mirrored noise for
// body texture, palettes picked from the id hash and shifted by alignment.

export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

export const SIZE = 24; // logical pixels, scaled up crisp by the renderer

// palettes: [dark, mid, light, accent]
const PALETTES = [
  ['#2d1e2f', '#7a3045', '#c65b3f', '#f2c14e'], ['#1b2a34', '#2e5d4b', '#5fa052', '#c6de78'],
  ['#252140', '#4a3f74', '#7c6fae', '#c9b8e8'], ['#33202a', '#7d4a32', '#b8813e', '#e8c56a'],
  ['#1f2933', '#3e5c76', '#748cab', '#c0d6df'], ['#301c2e', '#833c5c', '#c65f7c', '#f2a0a1'],
  ['#20262b', '#4b5d67', '#8a9ba8', '#d5e1e8'], ['#2b2118', '#5c4a2e', '#98833e', '#d8c47a'],
];
const EVIL_SHIFT = ['#180f14', '#54222e', '#933838', '#d9713e'];
const GOOD_SHIFT = ['#1d2430', '#3a5a78', '#7fa8c9', '#ead9a8'];

export function palette(card) {
  const r = rng(hash(card.id));
  let p = PALETTES[Math.floor(r() * PALETTES.length)];
  if (/\bevil\b/.test(card.align)) p = mix(p, EVIL_SHIFT);
  else if (/\bgood\b/.test(card.align)) p = mix(p, GOOD_SHIFT);
  return p;
}
const mix = (a, b) => a.map((c, i) => lerpColor(c, b[i], 0.45));
function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// Each template returns a mask value for (x, y) in 0..SIZE on the LEFT half; the right half mirrors.
// 0 empty · 1 body · 2 highlight zone · 3 accent zone (eyes etc. are drawn separately)
const T = {
  beast(x, y, r) { // four-legged bulk; proportions, ears, horns and tail vary per creature
    const bodyW = 7 + r * 3.2, bodyH = 4.2 + ((r * 7) % 1) * 2.4, headY = 6.5 + ((r * 13) % 1) * 2.5;
    const headR = 3.4 + ((r * 29) % 1) * 1.8;
    const body = inEllipse(x, y, 12, 13.5, bodyW, bodyH) || inEllipse(x, y, 12, headY, headR, headR * 0.9);
    const legW = r > 0.5 ? [4.5, 7, 9.5, 12] : [5, 7.5, 10, 12.2];
    const legs = y > 15 && y < 22 && legW.some((lx2, i2) => i2 % 2 === 0 && x > lx2 && x < legW[i2 + 1] - 1.2);
    const earKind = Math.floor(r * 97) % 3; // 0 pointy, 1 round, 2 horns
    const ear = earKind === 0 ? (Math.abs(x - (12 - headR + 0.6)) < 1.2 && y > headY - headR - 2.4 && y < headY - headR + 1)
      : earKind === 1 ? inEllipse(x, y, 12 - headR + 0.8, headY - headR + 0.4, 1.8, 1.8)
      : inEllipse(x, y, 12 - headR + 0.4, headY - headR + 0.2, 1, 2.6);
    const tail = ((r * 43) % 1) > 0.4 && y > 16 && y < 21 && Math.abs(x - (12 - bodyW - 0.5 + (20 - y))) < 1.1;
    return legs || body ? (y < headY + 2 ? 2 : 1) : ear || tail ? 3 : 0;
  },
  dragon(x, y, r) { // winged silhouette; wing sweep, horns and neck vary
    const neckX = 11 + ((r * 17) % 1) * 2;
    const body = inEllipse(x, y, 12, 14 + r, 5 + r * 1.4, 6 + ((r * 7) % 1) * 1.4) || inEllipse(x, y, neckX, 6.5, 3.2 + r, 3.2);
    const sweep = 1.1 + ((r * 31) % 1) * 0.8, gap = 6 + Math.floor(r * 3);
    const wing = y > 3.4 && y < 15.4 && x > 1.6 && x < 10 && (y - 3.4) < (x - 1) * sweep && ((x + y * 0.6) % gap > 1.05);
    const hornLen = 1.8 + ((r * 53) % 1) * 1.6;
    const horn = inEllipse(x, y, neckX - 1.8, 3.1, 1, hornLen);
    const tail = y > 18 && y < 23.4 && Math.abs(x - (12 - (y - 18) * (1.2 + r))) < 1.5;
    return wing ? 3 : horn ? 2 : body || tail ? 1 : 0;
  },
  humanoid(x, y, r) { // build and headgear vary
    const headR = 2.7 + ((r * 11) % 1) * 1.1, torsoW = 3.9 + ((r * 23) % 1) * 1.6;
    const head = inEllipse(x, y, 12, 5.4, headR, headR + 0.3);
    const hat = ((r * 41) % 1) > 0.55 && y > 1.2 && y < 3.4 && Math.abs(x - 12) < headR + ((r * 59) % 1) * 1.6;
    const torso = inEllipse(x, y, 12, 13, torsoW, 5.6);
    const arm = y > 9 && y < 17 && x > 12 - torsoW - 2.4 && x < 12 - torsoW - 0.4;
    const leg = y > 17 && y < 23 && x > 9.2 && x < 11.6;
    const staff = ((r * 71) % 1) > 0.72 && x > 5.2 && x < 6.6 && y > 4 && y < 21;
    return hat || staff ? 3 : head ? 2 : torso || arm || leg ? 1 : 0;
  },
  undead(x, y, r) { // ragged floating figure
    const head = inEllipse(x, y, 12, 6, 3.4, 3.6);
    const shroud = y > 8 && y < 22 && Math.abs(x - 12) < 6.5 - (y - 8) * 0.12 && ((x * 3 + y * 5 + r * 40) % 9 > 1.6 || y < 15);
    return head ? 2 : shroud ? 1 : 0;
  },
  fiend(x, y, r) {
    const head = inEllipse(x, y, 12, 6.5, 3.4, 3.2);
    const horns = (inEllipse(x, y, 9.4, 3.4, 1.2, 2.6));
    const body = inEllipse(x, y, 12, 14, 5.4, 6);
    const wing = y > 6 && y < 16 && x > 3 && x < 9 && (15 - y) > (x - 3) * 0.8;
    return horns ? 3 : head ? 2 : wing ? 3 : body ? 1 : 0;
  },
  elemental(x, y, r) { // swirling mass
    const d = Math.hypot(x - 12, y - 12);
    const swirl = Math.sin(d * 1.15 - Math.atan2(y - 12, x - 12) * 2 + r * 6.28) > -0.15;
    return d < 9.6 && swirl ? (d < 4.5 ? 3 : d < 7 ? 1 : 2) : 0;
  },
  construct(x, y, r) { // blocky golem
    const head = x > 9 && x < 15 && y > 3 && y < 8;
    const body = x > 7 && x < 17 && y > 8 && y < 17;
    const legs = y >= 17 && y < 22 && x > 8 && x < 11.4;
    const arms = y > 9 && y < 16 && x > 4.6 && x < 7;
    return head ? 2 : body ? 1 : legs || arms ? 1 : 0;
  },
  ooze(x, y, r) {
    const blob = inEllipse(x, y, 12, 16, 8.6, 5.4) || inEllipse(x, y, 12, 13, 6.4, 4.2);
    const bubble = ((x * 7 + y * 13 + Math.floor(r * 100)) % 23) === 0;
    return blob ? (bubble ? 3 : y < 14 ? 2 : 1) : 0;
  },
  giant(x, y, r) {
    const head = inEllipse(x, y, 12, 4.6, 2.8, 2.8);
    const torso = inEllipse(x, y, 12, 12, 5.8, 6.2);
    const leg = y > 17 && y < 23 && x > 8.4 && x < 11.6;
    const arm = y > 8 && y < 18 && x > 4.8 && x < 7.2;
    return head ? 2 : torso || leg || arm ? 1 : 0;
  },
  swarm(x, y, r) {
    const cell = ((Math.floor(x / 2) * 31 + Math.floor(y / 2) * 17 + Math.floor(r * 50)) % 11);
    return Math.hypot(x - 12, y - 13) < 9 && cell < 4 ? (cell === 0 ? 3 : 1) : 0;
  },
};
T.monstrosity = T.beast; T.plant = T.elemental; T.fey = T.humanoid; T.celestial = T.fiend; T.aberration = T.ooze;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// Returns SIZE×SIZE ints: 0 transparent, 1..4 palette index+1, 5 eye white, 6 pupil
export function sprite(card) {
  const seed = hash(card.id);
  const r = rng(seed);
  const jitter = r(); // one stable random per creature for template variation
  const tmpl = T[card.type] ?? T.beast;
  const g = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const lx = x < SIZE / 2 ? x : SIZE - 1 - x; // mirror
    const m = tmpl(lx, y, jitter);
    if (!m) continue;
    // texture noise, mirrored for symmetry
    const n = rng(seed ^ (lx * 73 + y * 151))();
    let v = m === 3 ? 4 : m === 2 ? 3 : n < 0.18 ? 1 : n < 0.72 ? 2 : 3;
    g[y * SIZE + x] = v;
  }
  // outline pass: any body pixel adjacent to empty gets the dark tone
  const out = new Uint8Array(g);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    if (!g[i]) continue;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || !g[ny * SIZE + nx]; });
    if (edge) out[i] = 1;
  }
  // eyes: symmetric pair, placed by scanning the head so they always land on the body
  let topY = 0;
  scan: for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (out[y * SIZE + x]) { topY = y; break scan; }
  const eyeY = Math.min(SIZE - 2, topY + 2 + Math.floor(r() * 2));
  let lx0 = -1;
  for (let x = 0; x < SIZE / 2; x++) if (out[eyeY * SIZE + x]) { lx0 = x; break; }
  if (lx0 >= 0) {
    let ex = lx0 + 1 + Math.floor(r() * 2);
    if (!out[eyeY * SIZE + ex] || ex >= SIZE / 2) ex = lx0;
    for (const x of [ex, SIZE - 1 - ex]) {
      const i = eyeY * SIZE + x;
      out[i] = 5; if (out[i + SIZE]) out[i + SIZE] = 6;
    }
  }
  return out;
}

export function drawSprite(ctx, card, px, x0 = 0, y0 = 0) {
  const g = sprite(card), pal = palette(card);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const v = g[y * SIZE + x];
    if (!v) continue;
    ctx.fillStyle = v === 5 ? '#f8f4e8' : v === 6 ? '#12080a' : pal[v - 1];
    ctx.fillRect(x0 + x * px, y0 + y * px, px, px);
  }
}
