# 11 Mins Till Dawn

Single-player browser game on one HTML5 canvas with two modes. **Survive**: run and gun for 11 minutes (660s), kill a super boss, reach dawn. **Base Defence**: hold a core at the bottom of a one-screen road, build walls and turrets, kill the final boss. No build step, no dependencies, no framework.

Survive was split out of a single 1,142-line `11 Mins Till Dawn.html`. Base Defence was added on top and is gated behind `G.bd`, so Survive code paths are unchanged.

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
  --- Base Defence (all gated behind G.bd) ---
  bd-data.js      BDD: every cost, HP, rate, range, timing for the mode. Edit numbers here
  bd-state.js     newGameBD(), grid helpers, building store (bdAdd/bdRemove/bdDamageB/bdDestroy), registries BDTUR/BDFX/BDUPD
  bd-enemies.js   bdSpawn (per-wave scaling), ground AI on the road, flyers, bomber blast, kill drops
  bd-flow.js      bdUpdate: income, build/wave phases, spawn stream, pickups, player collision, death + respawn, end screen
  bd-render.js    road, core, buildings (BDART registry), remnants, crystals, crates
  bd-hud.js       core HP, crystals, energy, phase/wave clock panel
  bd-ui.js        hotbar, ghost preview, placement rules, full wall, building panel (upgrade/repair/sell), remnant rebuild
  bd-turrets.js   bdStat/bdRange/bdTargets helpers and the per-frame dispatcher
  bd-tur-ground.js pistol, mg, flame, laser, freeze, tesla, sniper, acid
  bd-tur-air.js   flak, seeker, missile battery, homing missiles
  bd-tur-art.js   BDART drawing for every wall, spike and turret
  bd-cables.js    right-click drag cables, networks, Repair Station healing
  bd-skills.js    five energy skills (shockwave, overcharge, mend, barrage, obsidian)
  bd-boss.js      The Sovereign: crush, per-row wall holds, core break
```

## Base Defence

Pick **Base Defence** on the start screen, then **Timed** (11 min wave clock, Sovereign near the end) or **Endless** (no clock, Sovereign at wave 20, score = waves + kills, best saved in `localStorage` key `bd_best`), then a weapon.

**Map.** 28x26 tiles of 40 px (1120x1040). The camera scrolls vertically only (`camY()` in state.js). Road is 6 tiles wide, rows 0..23, centred. Core is 3x3 at the bottom (cols 12..14, grid aligned so it sits half a tile left of the road centre).

**Loop.** Build phase (25 s +1.5 s per wave) then a wave (30 s + 1 s per wave of streaming, 10+4 per wave enemies, HP +12% and damage +5% per wave). Building is allowed any time. The 11:00 clock (`G.bd.clock`) only runs during waves. Colossus every 5 waves. Death: 7 s respawn, drops half your XP bar and 15% crystals, loses the last 2 upgrade picks by replaying the rest (`bdLoseUpgrades`).

**Controls.** Mouse picks and places. With a hotbar item selected, left click places; deselect (Esc or click the slot again) to fire your weapon. Shift + click on a wall type places a full wall. Right-click drag from a Repair Station draws its cable. Number keys select slots in the active group, Tab cycles groups, wheel cycles items, N skips the build phase. Click a building (nothing selected) for upgrade/repair/sell.

**Hooks into Survive code** (all `if(G.bd)`): `update.js` (bdUpdate, bdEnemies, bdMovePlayer, aim uses pScrX/pScrY), `render.js` (camera + bdDraw* calls), `combat.js` (hurtEnemy kill hook, Sovereign armour, hurtPlayer death), `spawning.js` (spawn hands off to bdSpawn), `endgame.js` (finish -> bdFinish), `levelup.js` (records `G.picks`, drops the Shockwave card), `input.js` (bd pointer/key/wheel hooks), `menus.js` (mode picker).

**Extending.** Turret: add to `BDD.turrets`, register `BDTUR[id]=(b,dt)=>{}`, art in `BDART[id]`. Per-frame system: `BDUPD.push(dt=>...)`. World-space effect: `BDFX.push((sx,sy)=>...)`. Skill: `BDD.skills` + a case in `bdSkillUse`/`bdSkillGhost`. Enemy: `TYPES` in data.js, wave unlock in `BDD.unlock`, behaviour in `bdGround`.

**Decisions made while building** (not in the spec): ground enemies are blocked by walls, spikes, turrets and stations but not spike traps or cables; power-up drops (heal/rate/speed/invincible) are off in this mode, replaced by crystals and energy crates; crystal drops scale +6% per wave except the Colossus fixed 150; flyers are added on top of the wave count; a remnant rebuilds a fresh level 0 building for 85% of base cost; the Sovereign replaces a Colossus when both land on the same wave; the sky follows the wave clock, so Endless stays at dawn after 11 minutes of waves; the dawn tint, fog and motes work the same as Survive.

## How it works

**Load order matters.** (Survive files first, then the bd-* files, then update/levelup/render/hud/input/menus/build/main; see index.html.) Scripts are plain classic scripts sharing one global scope (not ES modules, so it also works from `file://`). Top-level code runs at load, so a file may only use things defined in files above it at load time. Functions are only called later, so cross-file calls inside functions are fine. Order is: core, data, assets, state, spawning, combat, endgame, update, levelup, render, hud, input, menus, build, main. If you add a file, add its `<script>` tag in `index.html` and respect that order.

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
