import { test, expect } from '@playwright/test';

async function fresh(page) {
  await page.goto('/?nosw=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__cardforge);
}
const tab = (page, id) => page.click(`#tabs button[data-tab="${id}"]`);
const points = (page) => page.evaluate(() => window.__cardforge.state.points);

test.beforeEach(async ({ page }) => { await fresh(page); });

test('loads with four tabs, a wallet and the SRD attribution', async ({ page }) => {
  await expect(page).toHaveTitle('Card Forge');
  await expect(page.locator('#tabs button')).toHaveCount(4);
  await expect(page.locator('#wallet')).toHaveText('◆ 0');
  await expect(page.locator('.foot')).toContainText('System Reference Document 5.1');
  await expect(page.locator('.dial .time')).toHaveText('25:00');
});

test('a finished focus session pays exactly one point; cancelling pays nothing', async ({ page }) => {
  await page.clock.install();
  await page.click('#btn-focus-start');
  await expect(page.locator('#btn-focus-cancel')).toBeVisible();
  await page.clock.runFor(60_000);
  await expect(page.locator('#focus-time')).toHaveText('24:00');
  await page.clock.runFor(24 * 60_000);
  await expect(page.locator('#toast')).toHaveText('Session complete. +1 point.');
  await expect(page.locator('#wallet')).toHaveText('◆ 1');
  await page.clock.runFor(60_000);
  expect(await points(page)).toBe(1);
  // cancelled session pays nothing
  await page.click('#btn-focus-start');
  await page.clock.runFor(60_000);
  await page.click('#btn-focus-cancel');
  await page.clock.runFor(60 * 60_000);
  expect(await points(page)).toBe(1);
});

test('tasks pay once each; unchecking never refunds', async ({ page }) => {
  await tab(page, 'tasks');
  await expect(page.locator('.empty')).toBeVisible();
  for (const s of ['read chapter 4', 'lab report', 'flashcards']) {
    await page.fill('#task-input', s);
    await page.press('#task-input', 'Enter');
  }
  await expect(page.locator('.task')).toHaveCount(3);
  await page.locator('.task input').nth(0).check();
  await page.locator('.task input').nth(1).check();
  await expect(page.locator('#wallet')).toHaveText('◆ 2');
  await page.locator('.task input').nth(0).uncheck();
  await page.locator('.task input').nth(0).check();
  await expect(page.locator('#wallet')).toHaveText('◆ 2');
  await page.click('text=Clear finished');
  await expect(page.locator('.task')).toHaveCount(1);
});

test('opening a pack: cost, reveal flow, binder grows, pity counter shows', async ({ page }) => {
  await tab(page, 'packs');
  await expect(page.locator('#btn-open2')).toBeDisabled();
  await page.click('#btn-open'); // the pack itself stays clickable and explains
  await expect(page.locator('#toast')).toHaveText('Not enough points yet. Finish a session or a task.');
  // earn 3 points through real tasks
  await tab(page, 'tasks');
  for (const s of ['a', 'b', 'c']) { await page.fill('#task-input', s); await page.press('#task-input', 'Enter'); }
  for (let i = 0; i < 3; i++) await page.locator('.task input').nth(i).check();
  await tab(page, 'packs');
  await page.click('#btn-open');
  await expect(page.locator('#reveal')).toBeVisible();
  await expect(page.locator('.flip')).toHaveCount(5);
  await page.click('#btn-skip');
  await expect(page.locator('.flip.revealed')).toHaveCount(5);
  await expect(page.locator('.tcg .badge.new')).toHaveCount(5, { timeout: 3000 });
  await page.click('#btn-done');
  await expect(page.locator('#reveal')).toBeHidden();
  await expect(page.locator('#tabs button[data-tab="binder"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.binder-head .stats b').first()).toHaveText('5');
  expect(await points(page)).toBe(0);
  await tab(page, 'packs');
  await expect(page.locator('.pack-stats')).toContainText('Guaranteed rare or better in');
});

test('binder filters, card detail and foil crafting', async ({ page }) => {
  await page.evaluate(() => {
    const cf = window.__cardforge;
    cf.state.collection.goblin = { n: 6, foil: false };
    cf.state.collection['adult-red-dragon'] = { n: 1, foil: true };
    cf.save(); cf.render();
  });
  await tab(page, 'binder');
  await page.click('.chip[data-filter="owned"]');
  await expect(page.locator('.binder-grid .tcg')).toHaveCount(2);
  await page.click('.chip[data-rarity="legendary"]');
  await expect(page.locator('.binder-grid .tcg')).toHaveCount(1);
  await expect(page.locator('.binder-grid .tcg.foil')).toHaveCount(1);
  await page.click('.chip[data-rarity="legendary"]'); // toggle off
  await page.click('.chip[data-filter="missing"]');
  await expect(page.locator('.binder-grid .ghost').first()).toBeVisible();
  await expect(page.locator('.binder-grid .tcg')).toHaveCount(0);
  // craft the goblin foil
  await page.click('.chip[data-filter="owned"]');
  await page.click('.binder-grid .tcg[data-id="goblin"]');
  await expect(page.locator('dialog .info h3')).toHaveText('Goblin');
  await page.click('#btn-craft');
  await expect(page.locator('#toast')).toHaveText('Foil crafted.');
  await expect(page.locator('.binder-grid .tcg[data-id="goblin"]')).toHaveClass(/foil/);
  await expect(page.locator('.binder-grid .slot:has(.tcg[data-id="goblin"]) .copies')).toHaveCount(0);
});

test('state survives reload; reset wipes it', async ({ page }) => {
  await tab(page, 'tasks');
  await page.fill('#task-input', 'persist me');
  await page.press('#task-input', 'Enter');
  await page.locator('.task input').check();
  await page.reload();
  await page.waitForFunction(() => window.__cardforge);
  await expect(page.locator('#wallet')).toHaveText('◆ 1');
  await tab(page, 'tasks');
  await expect(page.locator('.task')).toHaveCount(1);
  page.on('dialog', (d) => d.accept());
  await page.click('#btn-reset');
  await expect(page.locator('#wallet')).toHaveText('◆ 0');
});

test('Turkish interface and no console errors through a full loop', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.selectOption('#set-lang', 'tr');
  await expect(page.locator('#tabs button').first()).toHaveText('Odak');
  await tab(page, 'tasks');
  await expect(page.locator('h2')).toHaveText('Görevler');
  await page.fill('#task-input', 'ödev'); await page.press('#task-input', 'Enter');
  await page.locator('.task input').check();
  await page.evaluate(() => { const cf = window.__cardforge; cf.state.points = 3; cf.save(); cf.render(); });
  await tab(page, 'packs');
  await page.click('#btn-open');
  await page.click('#btn-skip');
  await page.click('#btn-done');
  await expect(page.locator('h2')).toHaveText('Klasör');
  expect(errors).toEqual([]);
});
