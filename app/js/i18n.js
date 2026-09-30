// UI strings, English and Turkish. Card names and rules text stay in English (quoted SRD content).
export const STRINGS = {
  en: {
    'app.title': 'Card Forge', 'app.tagline': 'Do the work, open the packs. A study companion that pays out in holographic creature cards.',
    'nav.focus': 'Focus', 'nav.tasks': 'Tasks', 'nav.packs': 'Packs', 'nav.binder': 'Binder',
    'focus.title': 'Focus session', 'focus.desc': 'Run one uninterrupted session. Finishing pays 1 forge point; cancelling pays nothing.',
    'focus.start': 'Start {n} min', 'focus.cancel': 'Give up', 'focus.running': 'Stay with it…', 'focus.done': 'Session complete. +1 point.',
    'focus.minutes': 'Minutes',
    'tasks.title': 'Tasks', 'tasks.desc': 'Each task you finish pays 1 forge point. Unchecking never refunds, so no farming.',
    'tasks.add': 'Add', 'tasks.ph': 'What needs doing?', 'tasks.clear': 'Clear finished', 'tasks.empty': 'Nothing on the list. Add the real work.',
    'packs.title': 'Open packs', 'packs.points': '{n} points', 'packs.cost': 'A pack costs {n} points and holds {m} cards.',
    'packs.open': 'Open a pack', 'packs.opened': '{n} opened', 'packs.pity': 'Guaranteed rare or better in {n} pack(s).',
    'packs.next': 'Next card', 'packs.skip': 'Reveal all', 'packs.done': 'To the binder',
    'packs.new': 'NEW', 'packs.foil': 'FOIL', 'packs.broke': 'Not enough points yet. Finish a session or a task.',
    'binder.title': 'Binder', 'binder.stats': '{owned} / {total} cards · {foils} foils',
    'binder.filter.all': 'All', 'binder.filter.owned': 'Owned', 'binder.filter.missing': 'Missing',
    'binder.craft': 'Craft foil ({n} duplicates)', 'binder.crafted': 'Foil crafted.',
    'binder.copies': '×{n}', 'binder.unknown': 'Not yet discovered',
    'rarity.common': 'Common', 'rarity.uncommon': 'Uncommon', 'rarity.rare': 'Rare', 'rarity.epic': 'Epic', 'rarity.legendary': 'Legendary',
    'card.ac': 'AC', 'card.hp': 'HP', 'card.speed': 'Speed', 'card.cr': 'CR',
    'set.lang': 'Language', 'set.reset': 'Reset save', 'msg.confirmreset': 'Wipe every card, point and task? This cannot be undone.',
    'msg.saved': 'Saved', 'stats.points': 'Points', 'stats.packs': 'Packs opened', 'stats.streak': 'Sessions today',
    'foot.srd': 'Creature names and statistics from the System Reference Document 5.1 by Wizards of the Coast LLC, licensed under CC-BY-4.0. Card art is procedurally generated. Independent tool, not affiliated with Wizards of the Coast.',
    'foot.source': 'Source on GitHub',
  },
  tr: {
    'app.title': 'Card Forge', 'app.tagline': 'İşini bitir, paketini aç. Emeğini holografik yaratık kartlarıyla ödeyen bir çalışma arkadaşı.',
    'nav.focus': 'Odak', 'nav.tasks': 'Görevler', 'nav.packs': 'Paketler', 'nav.binder': 'Klasör',
    'focus.title': 'Odak seansı', 'focus.desc': 'Kesintisiz tek seans. Bitirmek 1 puan kazandırır; yarıda bırakmak hiçbir şey kazandırmaz.',
    'focus.start': '{n} dk başlat', 'focus.cancel': 'Vazgeç', 'focus.running': 'Devam et…', 'focus.done': 'Seans tamam. +1 puan.',
    'focus.minutes': 'Dakika',
    'tasks.title': 'Görevler', 'tasks.desc': 'Bitirdiğin her görev 1 puan kazandırır. İşareti kaldırmak iade etmez, kasılmaz.',
    'tasks.add': 'Ekle', 'tasks.ph': 'Ne yapılacak?', 'tasks.clear': 'Bitenleri temizle', 'tasks.empty': 'Liste boş. Gerçek işi ekle.',
    'packs.title': 'Paket aç', 'packs.points': '{n} puan', 'packs.cost': 'Bir paket {n} puan, içinde {m} kart var.',
    'packs.open': 'Paket aç', 'packs.opened': '{n} açıldı', 'packs.pity': 'En geç {n} pakette nadir+ garanti.',
    'packs.next': 'Sonraki kart', 'packs.skip': 'Hepsini göster', 'packs.done': 'Klasöre',
    'packs.new': 'YENİ', 'packs.foil': 'FOLYO', 'packs.broke': 'Puan yetmiyor. Bir seans ya da görev bitir.',
    'binder.title': 'Klasör', 'binder.stats': '{owned} / {total} kart · {foils} folyo',
    'binder.filter.all': 'Hepsi', 'binder.filter.owned': 'Sende', 'binder.filter.missing': 'Eksik',
    'binder.craft': 'Folyo bas ({n} kopya harcar)', 'binder.crafted': 'Folyo basıldı.',
    'binder.copies': '×{n}', 'binder.unknown': 'Henüz keşfedilmedi',
    'rarity.common': 'Yaygın', 'rarity.uncommon': 'Seyrek', 'rarity.rare': 'Nadir', 'rarity.epic': 'Epik', 'rarity.legendary': 'Efsanevi',
    'card.ac': 'ZS', 'card.hp': 'CP', 'card.speed': 'Hız', 'card.cr': 'CR',
    'set.lang': 'Dil', 'set.reset': 'Kaydı sıfırla', 'msg.confirmreset': 'Tüm kartlar, puanlar ve görevler silinsin mi? Geri alınamaz.',
    'msg.saved': 'Kaydedildi', 'stats.points': 'Puan', 'stats.packs': 'Açılan paket', 'stats.streak': 'Bugünkü seans',
    'foot.srd': "Yaratık adları ve istatistikleri Wizards of the Coast LLC'nin System Reference Document 5.1 içeriğinden, CC-BY-4.0 lisansıyla. Kart görselleri prosedürel üretilir. Bağımsız araçtır, Wizards of the Coast ile ilgisi yoktur.",
    'foot.source': "GitHub'da kaynak",
  },
};
let lang = 'en';
export function setLang(l) { lang = STRINGS[l] ? l : 'en'; document.documentElement.lang = lang; }
export function getLang() { return lang; }
export function t(key, vars) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
export function applyI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
}
export function detectLang() { return (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en'; }
