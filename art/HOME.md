# Noct home — first playable courtyard

The home follows the approved moonlit farming concept: warm cottage, two starting beds, well, workshop/storage, resting corner and a forest gate. `dist/home-map.png` is background art; Noct and crops are independent runtime sprites. Source crops and generation briefs are preserved here. `prepare-home.cjs` cuts the equal-cell chroma atlas into aligned transparent sprites without changing the source artwork.

## Game loop

- Open the existing Site to enter the home. WASD/arrows or touch drag moves; E or the interaction button uses nearby objects.
- Plant free moonlight radish (2 returns, 3 harvested) or starbell (3 returns, 2 harvested).
- Enter forest at the gate: up to 180 seconds, existing combat preserved. Pick up wood/stone from visible resource bundles; every fourth collected star gem gives a home starlight fragment.
- Return alive, leave early, or be rescued after defeat: keep gathered resources. A run of at least 30 seconds advances every planted crop once. A full run also grants 4 wood, 2 stone and 3 starlight. Settlement is one-time.
- Repair cottage (12 wood, 6 stone): +1 expedition maximum health and warm window/flower accents.
- Expand beds (10 wood, 4 stone): 2 additional interactive plots.
- Repair workbench (8 wood, 5 stone, 4 starlight): +1 expedition damage.
- Decorate garden (6 wood, 2 flowers): flowering resting area and improved bed frames.
- Cook soup (2 radishes): +1 health for the next expedition, consumed on departure.

Crops never wilt and do not use real-world timers. No new attack/hurt/death animations are added. Walking and return-to-front idle behavior are preserved. The pause menu shows six decision-relevant expedition stats (health, damage, cast frequency, movement, pickup range and orbiting flames), the current upgrade stack, home/food bonuses, XP, combat count, elapsed time and carried resources. Home pause shows the next expedition baseline.

## Persistence and delivery

`home.js` loads/saves one validated document through `/api/home`. `server.mjs` serves it from the logical R2 `BUCKET`, scoped by Sites' authenticated user ID. Conditional writes prevent an older page overwriting another page's save; identical retries are safe. A connection error keeps the pending state and shows a retry action. In-progress expedition movement/combat is not checkpointed; resources and crop progression settle on return.

The original authored files remain in `dist/`. `node build.mjs` embeds the runtime's 20 assets into `dist/server/index.js` and copies hosting metadata. This is a dependency-free Worker build. It preserves the existing Site identity while enabling account persistence.

`tests/home-flow.cjs` exercises real Canvas rendering and the actual save handler with a local object-store double: planting, growth threshold, harvesting, return settlement, all four building upgrades, soup effects, reachable interactions, save/reload, user separation, stale revisions, validation and origin checks. It does not contact a deployed Site.
