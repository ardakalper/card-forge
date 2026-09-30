// Builds a trading-card DOM node for a monster and wires the tilt/holo pointer tracking.
import { drawSprite, SIZE } from './gen.js';
import { t } from './i18n.js';

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

export function cardNode(card, { foil = false, isNew = false, button = true } = {}) {
  const root = el(button ? 'button' : 'div', `tcg r-${card.rarity}${foil ? ' foil' : ''}`);
  if (button) root.type = 'button';
  root.dataset.id = card.id;
  const inner = el('div', 'inner');
  const head = el('div', 'head');
  head.append(el('span', 'name', card.name), el('span', 'cr', `${t('card.cr')} ${card.crText}`));
  const art = el('div', 'art');
  const cv = el('canvas'); cv.width = SIZE * 6; cv.height = SIZE * 6;
  drawSprite(cv.getContext('2d'), card, 6);
  art.append(cv);
  const typeline = el('div', 'typeline');
  typeline.append(el('span', null, `${card.size} ${card.type}`), el('span', null, t(`rarity.${card.rarity}`)));
  const stats = el('div', 'statrow');
  for (const [v, k] of [[card.ac, t('card.ac')], [card.hp, t('card.hp')], [card.speed.split(',')[0], t('card.speed')]]) {
    const s = el('div', 'stat'); s.append(el('b', null, String(v)), el('span', null, k)); stats.append(s);
  }
  const lines = el('div', 'lines');
  if (card.atk) { const a = el('div', 'atk'); a.append(el('b', null, `${card.atk.name} `), document.createTextNode(`+${card.atk.bonus}, ${card.atk.dice} ${card.atk.type}`)); lines.append(a); }
  if (card.trait) lines.append(el('div', 'trait', card.trait));
  inner.append(head, art, typeline, stats, lines);
  root.append(inner, el('div', 'shine'), el('div', 'foil'));
  if (isNew) root.append(el('span', 'badge new', t('packs.new')));
  if (foil) root.append(el('span', 'badge isfoil', t('packs.foil')));
  wireTilt(root);
  return root;
}

export function wireTilt(node) {
  const MAX = 10;
  node.addEventListener('pointermove', (e) => {
    const r = node.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100, my = ((e.clientY - r.top) / r.height) * 100;
    node.style.setProperty('--mx', mx.toFixed(1));
    node.style.setProperty('--my', my.toFixed(1));
    node.style.setProperty('--ry', `${((mx - 50) / 50 * MAX).toFixed(2)}deg`);
    node.style.setProperty('--rx', `${(-(my - 50) / 50 * MAX).toFixed(2)}deg`);
  });
  node.addEventListener('pointerleave', () => {
    node.style.setProperty('--mx', 50); node.style.setProperty('--my', 50);
    node.style.setProperty('--rx', '0deg'); node.style.setProperty('--ry', '0deg');
  });
}

// slow idle shimmer for reveal moments (no pointer needed)
export function autoShine(node) {
  node.classList.add('auto');
  let a = 0, run = true;
  const step = () => {
    if (!run || !node.isConnected) return;
    a += 0.02;
    node.style.setProperty('--mx', (50 + Math.sin(a) * 38).toFixed(1));
    node.style.setProperty('--my', (50 + Math.cos(a * 0.8) * 30).toFixed(1));
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return () => { run = false; node.classList.remove('auto'); };
}
