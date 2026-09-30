# Card Forge — notes for future sessions

- Owner: Arda. Commits are authored by Arda only: never add Co-Authored-By or session trailers.
- Style: plain HTML/CSS/ES modules, no build step, no runtime dependencies, offline-first PWA, GitHub Pages deploy from `app/`.
- The loop: focus sessions and tasks earn points → points buy packs → packs give 5 cards from the SRD 5.1 bestiary. Rarity comes from challenge rating; duplicates craft foils. A pity counter guarantees a rare+ every 5 packs.
- Card portraits are procedural pixel art, deterministic per monster id (`js/gen.js`); never ship third-party art.
- Monster data is SRD 5.1 (CC-BY-4.0) compiled by `tools/build-data.mjs` from 5e-bits/5e-database into `app/data/` (committed). Keep the CC attribution in footer and README. Never use "D&D", "Magic: The Gathering" or "Pokémon" in names, code or copy.
- Two languages (EN/TR) in `app/js/i18n.js`; a unit test enforces key parity. Pure logic (`game.js`, `gen.js`) is unit-tested; UI with Playwright on port 4177 (`PW_CHROMIUM_PATH` reuses the preinstalled Chromium; use page.clock for timer tests).
- All randomness flows through the seeded PRNG in game.js so tests stay deterministic.
