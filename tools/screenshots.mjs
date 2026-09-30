// README screenshots: seeds a collection, captures the pack reveal, binder and focus tabs.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const exe = process.env.PW_CHROMIUM_PATH;
const OUT = process.env.OUT || 'docs/img';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:4177/?nosw=1');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__cardforge);
await page.evaluate(() => {
  const cf = window.__cardforge;
  cf.state.points = 7; cf.state.opened = 11; cf.state.seed = 24; // seed 24 rolls a spicy pack
  const own = ['goblin','wolf','skeleton','zombie','giant-rat','brown-bear','giant-owl','orc','bandit','archmage','basilisk','ogre','harpy','ghoul','fire-elemental','young-silver-dragon','gelatinous-cube','mimic','vampire','adult-red-dragon','ancient-gold-dragon','lich'];
  own.forEach((id, i) => { cf.state.collection[id] = { n: 1 + (i % 4), foil: ['vampire','ancient-gold-dragon'].includes(id) }; });
  cf.state.tasks = [
    { id: 't1', text: 'Finish the linear algebra problem set', done: true, paid: true },
    { id: 't2', text: 'Revise the history essay draft', done: false },
    { id: 't3', text: 'Flashcards: organic chemistry, deck 3', done: false },
  ];
  cf.state.log = [{ t: Date.now() - 3600e3, kind: 'focus' }, { t: Date.now() - 1800e3, kind: 'focus' }];
  cf.save(); cf.render();
});
// pack reveal with all cards flipped
await page.click('#tabs button[data-tab="packs"]');
await page.click('#btn-open');
await page.waitForTimeout(600);
await page.click('#btn-skip');
await page.waitForTimeout(900);
await page.mouse.move(680, 430);
await page.screenshot({ path: `${OUT}/reveal.png` });
await page.click('#btn-done');
await page.waitForTimeout(400);
await page.click('.chip[data-filter="owned"]');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/binder.png` });
await page.click('#tabs button[data-tab="focus"]');
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/focus.png` });
console.log('wrote reveal, binder, focus');
await browser.close();
