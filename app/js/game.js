// Pure game logic: economy, pack rolling, pity, collection, focus timer state. All randomness
// flows through the caller-supplied PRNG so tests are deterministic.
import { rng, hash } from './gen.js';

export const PACK_COST = 3;          // points per pack
export const PACK_SIZE = 5;          // cards per pack
export const PITY_EVERY = 5;         // a rare+ is guaranteed at latest every N packs
export const FOIL_CHANCE = 0.08;     // any card can drop as foil
export const CRAFT_COST = 5;         // duplicates of one card → its foil
export const POINTS = { focus: 1, task: 1 };  // a finished focus session; a finished task
export const FOCUS_MINUTES = 25;
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
// pull odds per card slot (last card in a pack uses UPGRADED odds)
export const ODDS = { common: 0.62, uncommon: 0.25, rare: 0.09, epic: 0.03, legendary: 0.01 };
export const LAST_ODDS = { common: 0, uncommon: 0.55, rare: 0.30, epic: 0.11, legendary: 0.04 };

export function newState(now = 0) {
  return {
    points: 0, packs: 0, opened: 0, pity: 0, seed: 1,
    collection: {},          // id -> { n, foil }
    tasks: [],               // { id, text, done }
    timer: { mode: 'idle', startedAt: 0, endsAt: 0, minutes: FOCUS_MINUTES }, // idle | running | done
    log: [], createdAt: now,
  };
}

export const rarityAtLeast = (r, min) => RARITIES.indexOf(r) >= RARITIES.indexOf(min);
export function rollRarity(rand, odds) {
  let x = rand(), acc = 0;
  for (const r of RARITIES) { acc += odds[r]; if (x < acc) return r; }
  return 'legendary';
}
export function pickCard(cards, rarity, rand) {
  const pool = cards.filter((c) => c.rarity === rarity);
  return pool[Math.floor(rand() * pool.length)];
}

// Opens one pack. Mutates state (points, pity, seed, collection, opened) and returns the pulls.
export function openPack(state, cards) {
  if (state.points < PACK_COST) return null;
  state.points -= PACK_COST;
  const rand = rng(hash(`pack-${state.seed}`));
  state.seed += 1;
  const pulls = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    const odds = i === PACK_SIZE - 1 ? LAST_ODDS : ODDS;
    let rarity = rollRarity(rand, odds);
    if (i === PACK_SIZE - 1 && state.pity >= PITY_EVERY - 1 && !pulls.some((p) => rarityAtLeast(p.card.rarity, 'rare')) && !rarityAtLeast(rarity, 'rare')) rarity = 'rare';
    const card = pickCard(cards, rarity, rand);
    const foil = rand() < FOIL_CHANCE;
    pulls.push({ card, foil, new: !state.collection[card.id] });
    const c = (state.collection[card.id] ??= { n: 0, foil: false });
    c.n += 1; if (foil) c.foil = true;
  }
  state.pity = pulls.some((p) => rarityAtLeast(p.card.rarity, 'rare')) ? 0 : state.pity + 1;
  state.opened += 1;
  return pulls;
}

// spend duplicates to craft the foil version
export function craftFoil(state, id) {
  const c = state.collection[id];
  if (!c || c.foil || c.n < CRAFT_COST + 1) return false;
  c.n -= CRAFT_COST; c.foil = true;
  return true;
}

export const collectionStats = (state, cards) => {
  const owned = Object.keys(state.collection).length;
  const foils = Object.values(state.collection).filter((c) => c.foil).length;
  const byRarity = {};
  for (const r of RARITIES) {
    const all = cards.filter((c) => c.rarity === r);
    byRarity[r] = { total: all.length, owned: all.filter((c) => state.collection[c.id]).length };
  }
  return { owned, total: cards.length, foils, byRarity };
};

// ---------- focus timer (wall-clock; survives reloads) ----------
export function startFocus(state, now, minutes = state.timer.minutes) {
  state.timer = { mode: 'running', startedAt: now, endsAt: now + minutes * 60000, minutes };
}
export function cancelFocus(state) { state.timer = { ...state.timer, mode: 'idle' }; }
// Call on tick/load: settles a finished session, pays the point. Returns true when it just paid.
export function settleFocus(state, now) {
  if (state.timer.mode !== 'running' || now < state.timer.endsAt) return false;
  state.timer = { ...state.timer, mode: 'idle' };
  state.points += POINTS.focus;
  state.log.push({ t: state.timer.endsAt, kind: 'focus' });
  return true;
}
export const focusLeft = (state, now) => (state.timer.mode === 'running' ? Math.max(0, state.timer.endsAt - now) : 0);

// ---------- tasks ----------
export function addTask(state, text, now) {
  const t = { id: `t${now.toString(36)}${state.tasks.length}`, text: text.trim(), done: false };
  if (!t.text) return null;
  state.tasks.push(t); return t;
}
// completing pays once; unchecking doesn't refund (no farming by toggling)
export function toggleTask(state, id, now) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return false;
  t.done = !t.done;
  if (t.done && !t.paid) { t.paid = true; state.points += POINTS.task; state.log.push({ t: now, kind: 'task' }); }
  return true;
}
export const clearDone = (state) => { state.tasks = state.tasks.filter((t) => !t.done); };
