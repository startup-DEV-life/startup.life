# World migration — stage 1 audit

Branch: `feature/anime-multi-island-world`  
Baseline: `ec13f6e` (`main` before branching)

## Active architecture

- The playable browser world is rendered by Three.js in `frontend/src/ThreeCity.tsx`, lazy-loaded from `frontend/src/App.tsx`. It owns procedural terrain, roads, buildings, interiors, avatar models, lighting, camera, input picking, and visual effects.
- `App.tsx` remains the state and input integration point: it passes player and online state, jobs, places, interior state, items, and callbacks to `ThreeCity`.
- The Node server and Socket.IO remain the multiplayer/backend authority. Stage 2 must retain their player-coordinate contract and existing activities.
- Current map bounds (`MAP_LIMITS`), world scaling (`WORLD_SCALE`), `wx`/`wz` coordinate conversions, terrain height, road avoidance, and obstacle callbacks are coupled to the procedural city. An imported island needs an explicit transform and collision mapping before replacing any of these.
- Current interiors are built by `buildInteriorRoom` / `buildTowerOfficeInterior`; doors and entrance picking rely on mesh `userData` IDs. Preserve that interaction path when a GLB chunk is added.
- The present browser renderer does not use `GLTFLoader`. Stage 2 should load a Blender GLB behind a fallback to `buildCity`, leaving the current procedural world available if loading fails.

## GDevelop inventory

- `gdevelop/BlankLife/BlankLife.json` is a separate GDevelop project with one scene (`Lian Yu — Developer District`). It is not imported by the browser game.
- Its reusable resources include `lagos-shadow-frontier.glb`, `blank-life-avatar.glb`, joystick and control SVGs. `gdevelop/BlankLife/assets/lagos-shadow-frontier.glb` and `frontend/public/models/lagos-shadow-frontier.glb` have the same SHA-256 hash; the browser copy is currently unused by `ThreeCity`.
- The GDevelop README and migration notes describe a separate engine path. The current GDevelop project is incomplete relative to the browser game, especially for Socket.IO, account, quest, and interior features. No GDevelop file was removed in this stage.

## Blender connection and baseline

- Blender CLI: `/home/gamp/.local/bin/blender`, version 5.2.2 LTS. System Python: 3.12.3. Background `bpy` automation and glTF/GLB export work.
- Repeatable smoke command: `blender --background --factory-startup --python tools/blender/export_smoke.py -- /tmp/startup-life-smoke.glb`. The test export yielded a valid glTF 2.0 GLB with the named cube node. This proves the asset pipeline only; it does not prove in-game loading or collisions.
- `npm run typecheck`: passed.
- `npm run build`: passed. Vite warned that the main chunk is over 500 kB (501.60 kB uncompressed); record this before adding world assets.
- Local browser smoke: intro appeared, **Enter the city** opened the rendered third-person world, and browser console reported no errors. This is a baseline interaction check, not a full gameplay or mobile performance test.

## Stage 2 gate

Do not begin the Developer Metropolis island until the user says **proceed to step two**. Add GLB loading with a procedural fallback, map the imported island to existing world coordinates, preserve door/interior IDs and gameplay callbacks, then measure collisions and performance on desktop and mobile.
