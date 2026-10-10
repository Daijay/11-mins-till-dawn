# 11 Mins Till Dawn

Single-player browser survival shooter on one HTML5 canvas. Survive 11 minutes (660s) of enemy waves, kill a super boss at the end, reach dawn. No build step, no dependencies, no framework.

Split out of a single 1,142-line `11 Mins Till Dawn.html`. Behavior is unchanged; every original line lives in exactly one file below.

## Run it

Open `index.html` in a browser. Or serve the folder: `python -m http.server 8765` then visit `http://localhost:8765/`. Needs keyboard and mouse. The only network use is the Google Font (Chakra Petch); the game works without it.

## File map

```
index.html        DOM only: canvas, menu overlays, script tags (in load order)
css/style.css     All styling: layout, overlays, cards, build picker
js/
  core.js         W/H/DUR constants, canvas + ctx, helpers ($, rand, clamp, lerp, mix, fmt)
  data.js         WEAPONS, TYPES (enemies), WAVE_TYPES, LABEL, SKILLS (upgrades), HEAL
  assets.js       Sky colours, pre-rendered terrain (TA, TB), glow sprites, vignettes, motes
  state.js        Global run state G, input state (keys, mouse), newGame(), xpNext()
  spawning.js     spawn(), spawnEdge(), spawnRing(), pickType(), pickPU(), spawnSuper()
  combat.js       burst(), fire(), lineHits(), beam(), hurtEnemy(), hurtPlayer()
  endgame.js      finish(win): end screen, best time in localStorage
  update.js       update(dt): the whole per-frame simulation. fx(dt): particles/rings/shake
  levelup.js      mkCard(), openLevel(), pick(): level-up choices
  render.js       draw(): world, lighting, enemies, projectiles, player, vignette
  hud.js          panel(), drawHud(): HP, skills, clock, boss bars, buffs, banner, pause text
  input.js        Pointer and keyboard handlers
  menus.js        showStart(), weapon cards, revive, skip toggle, pause, fullscreen
  build.js        Minute 9:50 build picker (spend 28 points on upgrades, then start)
  main.js         Boot (idleState + showStart) and requestAnimationFrame loop
```

## How it works

**Load order matters.** Scripts are plain classic scripts sharing one global scope (not ES modules, so it also works from `file://`). Top-level code runs at load, so a file may only use things defined in files above it at load time. Functions are only called later, so cross-file calls inside functions are fine. Order is: core, data, assets, state, spawning, combat, endgame, update, levelup, render, hud, input, menus, build, main. If you add a file, add its `<script>` tag in `index.html` and respect that order.

**Single state object.** `G` (state.js) holds the whole run: `G.t` time, `G.p` player, `G.E` enemies, `G.B` player bullets and boomerangs, `G.EB` enemy shots, `G.BM` beams, `G.SH` lodged shells, `G.PU` pickups, `G.Gm` xp gems, `G.P` particles, `G.R` rings, `G.lv` upgrade levels, `G.state`. `newGame(weaponKey, skipBuild)` builds it. `G.state` is one of `menu`, `play`, `paused`, `levelup`, `win`, `lose`.

**Frame loop** (main.js): `update(dt)` only while `state==='play'`; `fx(dt)` while levelup/win/lose so effects keep moving; `draw()` always. `dt` is capped at 0.05s.

**World model.** Player is always drawn at screen centre (W/2, H/2); everything else is offset by the player position (`sx`/`sy` in render.js). Terrain tiles are pre-rendered once and wrapped, so the map is infinite.

**Run timeline** (`update.js`): enemies spawn at the screen edge at a rate that grows with time; a ring wave every 40s (starts at 30s); Colossus boss at 200s and 400s; the Sovereign super boss at 590s, which also closes an electric fence around the player; survive to 660s to win.

**Upgrades.** `SKILLS` in data.js is the single source. Each has `id`, `max`, `desc`, optional `only:[weaponKeys]` and `need:'flag'`, and `fn(p)` which mutates the player. Level-up (`openLevel`) draws 3 random eligible cards, biased toward weapon-specific ones. Each pick also gives +4% max HP.

**Skip mode.** The "Start at minute 9:50" toggle sends weapon choice to `build.js` instead of starting. `newGame(wk, BLD)` then sets `G.t=590`, level 29, and replays the chosen upgrades through each skill's `fn`.

**Persistence.** Only `localStorage` key `bs_best` (best survived seconds), wrapped in try/catch.

## Common edits

| Want to... | Edit |
| --- | --- |
| Change run length | `DUR` in core.js. Boss and wave times are literals in update.js (200, 400, 590) and `spawnSuper` fence rate |
| Add or tune a weapon | `WEAPONS` in data.js; firing in `fire()` (combat.js); weapon-specific draw in render.js |
| Add an enemy type | `TYPES` in data.js, spawn weight in `pickType()` (spawning.js), behaviour in the enemies loop of `update()`, special draw in render.js `// enemies`, name in `LABEL` if it appears in waves |
| Add an upgrade | Entry in `SKILLS` (data.js); add any new player field to `G.p` in `newGame()` (state.js); effect usually lands in `update()` or `fire()` |
| Change pickups | `pickPU()` (spawning.js) weights, effects in the power-ups block of `update()`, art in render.js `// power-up drops` |
| Change HUD | hud.js |
| Change menu text or layout | index.html and css/style.css; wiring in menus.js |

## Gotchas

- Do not convert to ES modules without adding a dev server; `file://` blocks module imports.
- Tuning numbers are inline literals, not config. Search before assuming a value lives in `data.js`.
- `G.nr=1` is a flag used around `hurtEnemy` for damage that should not be treated as a direct weapon hit (blades, nova, burn). It also disables the super boss damage resist.
- Canvas is 1120x700 internally; CSS scales it to fit. Mouse coordinates are rescaled in `setMouse`.
- The original single file is still at `Downloads\11 Mins Till Dawn.html` as a backup.
