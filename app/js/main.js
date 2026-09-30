// Card Forge UI: four tabs over the pure game logic in game.js.
import * as G from './game.js';
import { cardNode, autoShine } from './card.js';
import { t, setLang, getLang, applyI18n, detectLang } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const TABS = ['focus', 'tasks', 'packs', 'binder'];

let CARDS = [];
const ui = Object.assign({ lang: null, tab: 'focus', filter: 'all', rarity: null }, load('cardforge:ui'));
let state = Object.assign(G.newState(Date.now()), load('cardforge:save'));

function load(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } }
function save() { try { localStorage.setItem('cardforge:save', JSON.stringify(state)); localStorage.setItem('cardforge:ui', JSON.stringify(ui)); } catch { /* private mode */ } }
let toastTimer;
function toast(msg) { const n = $('#toast'); n.textContent = msg; n.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { n.hidden = true; }, 2600); }
const fmtTime = (ms) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// ---------- tabs ----------
const tabs = {
  focus() {
    const root = el('div', 'wrap');
    root.append(el('h2', null, t('focus.title')), el('p', 'desc', t('focus.desc')));
    const dial = el('div', 'dial');
    const time = el('div', 'time mono'); time.id = 'focus-time';
    const bar = el('div', 'bar'); bar.append(el('i'));
    const row = el('div', 'row');
    if (state.timer.mode === 'running') {
      const btn = el('button', 'tb danger', t('focus.cancel')); btn.id = 'btn-focus-cancel';
      btn.addEventListener('click', () => { G.cancelFocus(state); save(); render(); });
      row.append(el('span', 'desc', t('focus.running')), btn);
    } else {
      const min = el('label', 'field'); min.append(el('span', null, t('focus.minutes')));
      const inp = Object.assign(el('input'), { type: 'number', min: 5, max: 120, step: 5, value: state.timer.minutes, id: 'focus-minutes' });
      inp.addEventListener('change', () => { state.timer.minutes = Math.max(5, Math.min(120, Number(inp.value) || G.FOCUS_MINUTES)); save(); render(); });
      min.append(inp);
      const btn = el('button', 'tb primary', t('focus.start', { n: state.timer.minutes })); btn.id = 'btn-focus-start';
      btn.addEventListener('click', () => { G.startFocus(state, Date.now()); save(); render(); });
      row.append(min, btn);
    }
    dial.append(time, bar, row);
    root.append(dial);
    const today = new Date().toDateString();
    const sessions = state.log.filter((l) => l.kind === 'focus' && new Date(l.t).toDateString() === today).length;
    const stats = el('div', 'pack-stats');
    stats.innerHTML = '';
    for (const [v, k] of [[state.points, t('stats.points')], [state.opened, t('stats.packs')], [sessions, t('stats.streak')]]) {
      const s = el('span'); s.append(el('b', null, String(v)), document.createTextNode(` ${k}`)); stats.append(s);
    }
    root.append(stats);
    return root;
  },

  tasks() {
    const root = el('div', 'wrap');
    root.append(el('h2', null, t('tasks.title')), el('p', 'desc', t('tasks.desc')));
    const add = el('form', 'task-add');
    const inp = Object.assign(el('input'), { type: 'text', id: 'task-input', maxLength: 140 });
    inp.placeholder = t('tasks.ph');
    const btn = el('button', 'tb primary', t('tasks.add'));
    add.append(inp, btn);
    add.addEventListener('submit', (e) => { e.preventDefault(); if (G.addTask(state, inp.value, Date.now())) { inp.value = ''; save(); render(); } });
    root.append(add);
    if (!state.tasks.length) root.append(el('p', 'empty', t('tasks.empty')));
    const list = el('ul', 'tasks-list');
    for (const task of state.tasks) {
      const li = el('li', `task${task.done ? ' done' : ''}`);
      const cb = Object.assign(el('input'), { type: 'checkbox', checked: task.done });
      cb.addEventListener('change', () => { G.toggleTask(state, task.id, Date.now()); save(); render(); });
      li.append(cb, el('span', null, task.text));
      if (task.paid) li.append(el('span', 'pts', '+1'));
      list.append(li);
    }
    root.append(list);
    if (state.tasks.some((x) => x.done)) {
      const clear = el('button', 'tb', t('tasks.clear'));
      clear.style.marginTop = '12px';
      clear.addEventListener('click', () => { G.clearDone(state); save(); render(); });
      root.append(clear);
    }
    return root;
  },

  packs() {
    const root = el('div', 'wrap');
    root.append(el('h2', null, t('packs.title')), el('p', 'desc', t('packs.cost', { n: G.PACK_COST, m: G.PACK_SIZE })));
    const scene = el('div', 'pack-scene');
    const pack = el('button', 'pack'); pack.type = 'button'; pack.id = 'btn-open';
    pack.append(el('span', 'seal'));
    pack.addEventListener('click', openPackFlow);
    scene.append(pack);
    const open = el('button', 'tb primary', t('packs.open')); open.id = 'btn-open2';
    open.disabled = state.points < G.PACK_COST;
    open.addEventListener('click', openPackFlow);
    scene.append(open);
    const stats = el('div', 'pack-stats');
    const s1 = el('span'); s1.append(el('b', null, String(state.points)), document.createTextNode(` ${t('stats.points')}`));
    const s2 = el('span'); s2.append(el('b', null, String(state.opened)), document.createTextNode(` ${t('packs.opened', { n: '' }).trim()}`));
    const s3 = el('span', null, t('packs.pity', { n: G.PITY_EVERY - state.pity }));
    stats.append(s1, s2, s3);
    scene.append(stats);
    root.append(scene);
    return root;
  },

  binder() {
    const root = el('div', 'wrap');
    root.append(el('h2', null, t('binder.title')));
    const st = G.collectionStats(state, CARDS);
    const head = el('div', 'binder-head');
    const stats = el('span', 'stats');
    stats.innerHTML = t('binder.stats', { owned: `<b>${st.owned}</b>`, total: st.total, foils: `<b>${st.foils}</b>` });
    head.append(stats);
    for (const f of ['all', 'owned', 'missing']) {
      const c = el('button', 'chip', t(`binder.filter.${f}`)); c.dataset.filter = f;
      c.setAttribute('aria-pressed', String(ui.filter === f));
      c.addEventListener('click', () => { ui.filter = f; save(); render(); });
      head.append(c);
    }
    for (const r of G.RARITIES) {
      const c = el('button', `chip r-${r}`, `${t(`rarity.${r}`)} ${st.byRarity[r].owned}/${st.byRarity[r].total}`);
      c.dataset.rarity = r;
      c.setAttribute('aria-pressed', String(ui.rarity === r));
      c.addEventListener('click', () => { ui.rarity = ui.rarity === r ? null : r; save(); render(); });
      head.append(c);
    }
    root.append(head);
    const grid = el('div', 'binder-grid');
    for (const card of CARDS) {
      if (ui.rarity && card.rarity !== ui.rarity) continue;
      const own = state.collection[card.id];
      if (ui.filter === 'owned' && !own) continue;
      if (ui.filter === 'missing' && own) continue;
      const slot = el('div', 'slot');
      if (own) {
        const node = cardNode(card, { foil: own.foil });
        node.addEventListener('click', () => showDetail(card));
        slot.append(node);
        if (own.n > 1) slot.append(el('span', 'copies', t('binder.copies', { n: own.n })));
      } else {
        const g = el('div', 'ghost'); g.dataset.id = card.id;
        g.append(el('span', 'qm', '?'), el('span', null, t('binder.unknown')));
        slot.append(g);
      }
      grid.append(slot);
    }
    root.append(grid);
    return root;
  },
};

function showDetail(card) {
  const own = state.collection[card.id];
  const dlg = el('dialog');
  const box = el('div', 'detail');
  const left = el('div');
  left.append(cardNode(card, { foil: own?.foil, button: false }));
  const info = el('div', 'info');
  info.append(el('h3', null, card.name));
  info.append(el('p', null, `${card.size} ${card.type} · ${card.align}`));
  info.append(el('p', null, `${t('card.cr')} ${card.crText} · ${card.xp} XP · ${t(`rarity.${card.rarity}`)}`));
  info.append(el('p', null, `${t('card.ac')} ${card.ac} · ${t('card.hp')} ${card.hp} · ${t('card.speed')} ${card.speed}`));
  if (card.atk) info.append(el('p', null, `${card.atk.name}: +${card.atk.bonus}, ${card.atk.dice} ${card.atk.type}`));
  if (card.trait) info.append(el('p', null, card.trait));
  const actions = el('div', 'actions');
  if (own && !own.foil) {
    const craft = el('button', 'tb', t('binder.craft', { n: G.CRAFT_COST })); craft.id = 'btn-craft';
    craft.disabled = own.n < G.CRAFT_COST + 1;
    craft.addEventListener('click', () => { if (G.craftFoil(state, card.id)) { save(); dlg.close(); toast(t('binder.crafted')); render(); } });
    actions.append(craft);
  }
  const close = el('button', 'tb', '✕');
  close.addEventListener('click', () => dlg.close());
  actions.append(close);
  info.append(actions);
  box.append(left, info);
  dlg.append(box);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
}

// ---------- pack opening ----------
function openPackFlow() {
  const pulls = G.openPack(state, CARDS);
  if (!pulls) { toast(t('packs.broke')); return; }
  save();
  const overlay = $('#reveal');
  overlay.replaceChildren();
  overlay.hidden = false;
  const stage = el('div', 'stage');
  const stops = [];
  const flips = pulls.map((p) => {
    const flip = el('div', 'flip');
    const wrap = el('div', 'facewrap');
    const back = el('div', 'back'); back.append(el('span', 'seal'));
    const front = el('div', 'front');
    const node = cardNode(p.card, { foil: p.foil, isNew: p.new, button: false });
    front.append(node);
    wrap.append(back, front);
    flip.append(wrap);
    flip.addEventListener('click', () => reveal(flip, node, p), { once: true });
    stage.append(flip);
    return { flip, node, p };
  });
  function reveal(flip, node, p) {
    flip.classList.add('revealed');
    if (p.foil || p.card.rarity === 'legendary' || p.card.rarity === 'epic') stops.push(autoShine(node));
  }
  const actions = el('div', 'actions');
  const skip = el('button', 'tb', t('packs.skip')); skip.id = 'btn-skip';
  skip.addEventListener('click', () => { flips.forEach(({ flip, node, p }) => { if (!flip.classList.contains('revealed')) reveal(flip, node, p); }); });
  const done = el('button', 'tb primary', t('packs.done')); done.id = 'btn-done';
  done.addEventListener('click', () => { stops.forEach((s) => s()); overlay.hidden = true; overlay.replaceChildren(); ui.tab = 'binder'; save(); render(); });
  actions.append(skip, done);
  overlay.append(stage, actions);
  // stagger-flip the first card automatically for the demo feel
  setTimeout(() => { const f = flips[0]; if (f && !f.flip.classList.contains('revealed')) f.flip.click(); }, 450);
}

// ---------- chrome ----------
function renderTabs() {
  $('#tabs').replaceChildren(...TABS.map((id) => {
    const b = el('button', null, t(`nav.${id}`));
    b.dataset.tab = id;
    b.setAttribute('aria-selected', String(ui.tab === id));
    if (id === 'tasks' && state.tasks.some((x) => !x.done)) b.append(el('span', 'n', String(state.tasks.filter((x) => !x.done).length)));
    if (id === 'packs' && state.points >= G.PACK_COST) b.append(el('span', 'n', `${Math.floor(state.points / G.PACK_COST)}×`));
    b.addEventListener('click', () => { ui.tab = id; save(); render(); });
    return b;
  }));
}
function renderWallet() { $('#wallet').textContent = `◆ ${state.points}`; }
function render() { renderTabs(); renderWallet(); $('#main').replaceChildren(tabs[ui.tab]()); }

// timer tick: updates the dial and settles finished sessions even in other tabs
setInterval(() => {
  const paid = G.settleFocus(state, Date.now());
  if (paid) { save(); toast(t('focus.done')); render(); return; }
  if (state.timer.mode === 'running' && ui.tab === 'focus') {
    const left = G.focusLeft(state, Date.now());
    const timeEl = $('#focus-time');
    if (timeEl) timeEl.textContent = fmtTime(left);
    const bar = $('.dial .bar i');
    if (bar) bar.style.width = `${(1 - left / (state.timer.minutes * 60000)) * 100}%`;
  } else if (ui.tab === 'focus') {
    const timeEl = $('#focus-time');
    if (timeEl) timeEl.textContent = fmtTime(state.timer.minutes * 60000);
  }
}, 500);

async function init() {
  const { cards } = await fetch('data/cards.json').then((r) => r.json());
  CARDS = cards;
  setLang(ui.lang || detectLang());
  $('#set-lang').value = getLang();
  applyI18n();
  $('#set-lang').addEventListener('change', (e) => { ui.lang = e.target.value; setLang(ui.lang); save(); applyI18n(); render(); });
  $('#btn-reset').addEventListener('click', () => { if (!confirm(t('msg.confirmreset'))) return; state = G.newState(Date.now()); save(); render(); });
  window.addEventListener('pagehide', save);
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !new URLSearchParams(location.search).has('nosw')) navigator.serviceWorker.register('sw.js').catch(() => {});
  G.settleFocus(state, Date.now());
  render();
  window.__cardforge = { get state() { return state; }, ui, G, CARDS, render, save };
}
init();
