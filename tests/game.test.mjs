import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../app/js/game.js';
import { sprite, palette, hash, rng, SIZE } from '../app/js/gen.js';

const { cards } = JSON.parse(readFileSync('app/data/cards.json', 'utf8'));

test('card set: 334 SRD monsters, rarity pyramid from CR, well formed', () => {
  assert.equal(cards.length, 334);
  const counts = {};
  for (const c of cards) {
    counts[c.rarity] = (counts[c.rarity] ?? 0) + 1;
    assert.ok(c.id && c.name && c.type && c.crText, c.id);
    assert.ok(G.RARITIES.includes(c.rarity), c.id);
    assert.ok(c.hp > 0 && c.ac > 0, c.id);
  }
  assert.deepEqual(counts, { common: 113, uncommon: 90, rare: 76, epic: 35, legendary: 20 });
  const dragon = cards.find((c) => c.id === 'adult-red-dragon');
  assert.equal(dragon.rarity, 'legendary');
  assert.equal(dragon.atk.name, 'Bite');
  assert.ok(cards.every((c) => ['beast','humanoid','dragon','monstrosity','fiend','undead','elemental','giant','swarm','construct','plant','fey','celestial','aberration','ooze'].includes(c.type)));
});

test('sprites are deterministic, symmetric, bounded and distinct', () => {
  const a = sprite(cards[0]), b = sprite(cards[0]);
  assert.deepEqual([...a], [...b], 'same id, same sprite');
  for (const c of cards.slice(0, 40)) {
    const g = sprite(c);
    let filled = 0;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE / 2; x++) {
      const l = g[y * SIZE + x], r = g[y * SIZE + (SIZE - 1 - x)];
      assert.equal(Boolean(l), Boolean(r), `${c.id} mirrored at ${x},${y}`);
      if (l) filled++;
    }
    assert.ok(filled > 30, `${c.id} has a body (${filled})`);
    assert.ok([...g].some((v) => v === 5), `${c.id} has eyes`);
  }
  const d1 = sprite(cards.find((c) => c.id === 'goblin'));
  const d2 = sprite(cards.find((c) => c.id === 'wolf'));
  assert.notDeepEqual([...d1], [...d2]);
  assert.equal(palette(cards[0]).length, 4);
  assert.equal(hash('x'), hash('x'));
  const r = rng(42); const v1 = r(); assert.ok(v1 >= 0 && v1 < 1); assert.notEqual(v1, r());
});

test('packs: cost, size, deterministic by seed, collection grows', () => {
  const s = G.newState();
  assert.equal(G.openPack(s, cards), null, 'no points, no pack');
  s.points = G.PACK_COST;
  const pulls = G.openPack(s, cards);
  assert.equal(pulls.length, G.PACK_SIZE);
  assert.equal(s.points, 0);
  assert.equal(s.opened, 1);
  assert.equal(Object.values(s.collection).reduce((n, c) => n + c.n, 0), 5);
  const s2 = G.newState(); s2.points = 3;
  const pulls2 = G.openPack(s2, cards);
  assert.deepEqual(pulls2.map((p) => p.card.id), pulls.map((p) => p.card.id), 'same seed, same pulls');
  s.points = 3;
  const pulls3 = G.openPack(s, cards);
  assert.notDeepEqual(pulls3.map((p) => p.card.id), pulls.map((p) => p.card.id), 'seed advances');
});

test('pity guarantees a rare or better at latest every fifth pack', () => {
  const s = G.newState();
  let streak = 0, worst = 0;
  for (let i = 0; i < 200; i++) {
    s.points = G.PACK_COST;
    const pulls = G.openPack(s, cards);
    if (pulls.some((p) => G.rarityAtLeast(p.card.rarity, 'rare'))) { worst = Math.max(worst, streak); streak = 0; }
    else streak += 1;
  }
  assert.ok(Math.max(worst, streak) < G.PITY_EVERY, `longest rare-less run ${Math.max(worst, streak)}`);
});

test('rarity odds land near their weights over many rolls', () => {
  const rand = rng(7);
  const n = 20000, got = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
  for (let i = 0; i < n; i++) got[G.rollRarity(rand, G.ODDS)] += 1;
  for (const r of G.RARITIES) assert.ok(Math.abs(got[r] / n - G.ODDS[r]) < 0.02, `${r}: ${got[r] / n}`);
});

test('foil crafting spends duplicates exactly once', () => {
  const s = G.newState();
  s.collection.goblin = { n: 6, foil: false };
  assert.equal(G.craftFoil(s, 'goblin'), true);
  assert.deepEqual(s.collection.goblin, { n: 1, foil: true });
  assert.equal(G.craftFoil(s, 'goblin'), false, 'already foil');
  s.collection.wolf = { n: 5, foil: false };
  assert.equal(G.craftFoil(s, 'wolf'), false, 'needs cost + 1 copies');
});

test('focus timer pays exactly once per finished session, survives clock jumps', () => {
  const s = G.newState();
  const t0 = 1_000_000;
  G.startFocus(s, t0, 25);
  assert.equal(G.focusLeft(s, t0 + 60000), 24 * 60000);
  assert.equal(G.settleFocus(s, t0 + 10 * 60000), false, 'not done yet');
  assert.equal(G.settleFocus(s, t0 + 25 * 60000), true, 'pays on completion');
  assert.equal(s.points, 1);
  assert.equal(G.settleFocus(s, t0 + 26 * 60000), false, 'no double pay');
  G.startFocus(s, t0, 25); G.cancelFocus(s);
  assert.equal(G.settleFocus(s, t0 + 60 * 60000), false, 'cancelled sessions pay nothing');
  assert.equal(s.points, 1);
});

test('tasks pay once, unchecking never refunds, clearDone keeps the pay flag honest', () => {
  const s = G.newState();
  const t = G.addTask(s, '  write thesis chapter ', 123456);
  assert.equal(t.text, 'write thesis chapter');
  assert.equal(G.addTask(s, '   ', 1), null);
  G.toggleTask(s, t.id, 2);
  assert.equal(s.points, 1);
  G.toggleTask(s, t.id, 3); // uncheck: no refund
  assert.equal(s.points, 1);
  G.clearDone(s);
  assert.equal(s.tasks.length, 1, 'unchecked task stays');
  G.toggleTask(s, t.id, 4); // re-check: pays nothing again
  assert.equal(s.points, 1, 'toggle farming pays nothing');
  G.clearDone(s);
  assert.equal(s.tasks.length, 0);
});

test('collection stats', () => {
  const s = G.newState();
  s.collection['adult-red-dragon'] = { n: 1, foil: true };
  s.collection.goblin = { n: 2, foil: false };
  const st = G.collectionStats(s, cards);
  assert.equal(st.owned, 2); assert.equal(st.total, 334); assert.equal(st.foils, 1);
  assert.equal(st.byRarity.legendary.owned, 1);
  assert.equal(st.byRarity.legendary.total, 20);
});

test('i18n: English and Turkish have the same keys', async () => {
  const { STRINGS } = await import('../app/js/i18n.js');
  assert.deepEqual(Object.keys(STRINGS.tr).sort(), Object.keys(STRINGS.en).sort());
});
