// Compiles the SRD 5.1 bestiary into the compact card set the app ships.
// Source: https://github.com/5e-bits/5e-database (MIT code, SRD content CC-BY-4.0).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const SRC = `${process.argv[2] ?? '/home/user/5e-bits/5e-database'}/src/2014/en`;
const monsters = JSON.parse(readFileSync(`${SRC}/5e-SRD-Monsters.json`, 'utf8'));
mkdirSync('app/data', { recursive: true });

const TYPE_MAP = { 'swarm of Tiny beasts': 'swarm' };
const rarity = (cr) => (cr <= 0.5 ? 'common' : cr <= 3 ? 'uncommon' : cr <= 9 ? 'rare' : cr <= 16 ? 'epic' : 'legendary');
const crText = (cr) => (cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : String(cr));

const cards = monsters.map((m) => {
  const atk = (m.actions ?? []).find((a) => a.attack_bonus != null && a.damage?.some((d) => d.damage_dice));
  const dmg = atk?.damage.find((d) => d.damage_dice);
  const special = (m.special_abilities ?? []).find((s) => s.name && !s.name.startsWith('Spellcasting'));
  const speed = Object.entries(m.speed).filter(([k]) => k !== 'hover').map(([k, v]) => (k === 'walk' ? v : `${k} ${v}`)).join(', ');
  return {
    id: m.index, name: m.name, type: TYPE_MAP[m.type] ?? m.type, size: m.size, align: m.alignment,
    cr: m.challenge_rating, crText: crText(m.challenge_rating), xp: m.xp, rarity: rarity(m.challenge_rating),
    ac: m.armor_class[0]?.value ?? 10, hp: m.hit_points, speed,
    atk: atk ? { name: atk.name, bonus: atk.attack_bonus, dice: dmg.damage_dice, type: dmg.damage_type?.name?.toLowerCase() ?? '' } : null,
    trait: special ? special.name : null,
  };
});
const counts = {};
for (const c of cards) counts[c.rarity] = (counts[c.rarity] ?? 0) + 1;
const s = JSON.stringify({ set: 'SRD Bestiary', cards });
writeFileSync('app/data/cards.json', s);
console.log('cards', cards.length, counts, `${(s.length / 1024).toFixed(0)} KB`);
