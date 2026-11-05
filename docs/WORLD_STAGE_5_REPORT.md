# Stage five — approved cleanup and regression

## Applied scope

The user explicitly approved `WORLD_STAGE_5_DELETION_PLAN.md`. Removed only the five listed obsolete GDevelop engine/project/archive/instruction files. Moved all seven reusable assets into `assets/legacy-gdevelop/`; every byte was compared against commit `dfbca72`. Added provenance and SHA-256 records. Git history is preserved. Updated current documentation to identify Three.js and the Blender/GLB pipeline as the active world implementation. No gameplay or backend source was modified in this stage.

## Checks

- `npm run build`: passed, including project TypeScript checking. Existing Vite main-chunk warning remains at 503.90 kB uncompressed.
- `git diff --check`: passed.
- Asset preservation: seven of seven byte comparisons passed; five obsolete files removed, seven asset paths relocated. No GDevelop runtime/path references found in frontend source, backend server, shared code, tools, scripts, package scripts or Render configuration.
- `node tools/testing/streaming-network-smoke.mjs`: passed. Two disposable accounts in an isolated temporary database exchanged 72 position updates, finished at `(3280,784)` and `(3288,784)`, persisted those positions and rejected off-causeway movement. No real accounts were created or modified by this network test.
- Desktop 1280 × 720 balanced real-renderer fixture: crossing/return/repeat passed; far → near → far → near, predictive load before arrival, two chunk requests, maximum coordinate step 14, no errors, last sample 60 FPS.
- Mobile viewport 390 × 844 Auto/Low real-renderer fixture: same travel/cache/collision checks passed; last sample 31 FPS. Several browser tabs were active. These are local fixture samples, not physical-phone or full populated-game benchmarks.
- Live Low/High profile switching preserved renderer ID, coordinates and cache request count; expected cloud/particle/shadow limits applied. Animation time advanced.
- Office entry hid the sky; exit restored it. Renderer and coordinates remained unchanged. This exercises the renderer's interior transition, not every production entrance interaction.
- Regular mobile-sized game restored its existing signed-in local session, showed online presence, opened phone/two-island map, laptop quest log, learning overview, terminal and GitHub panel. `pwd` returned the saved sandbox workspace path. No profile/progress edits, external OAuth grants or real shell commands were performed.
- Fresh fixture and regular-game browser sessions had no console warnings/errors during these checks.
- Actual WebGL frame export inspected: `images/stage5-regression.png`. The development-only capture fixture is excluded from the production entry/build. Native browser screenshot capture was unavailable in prior stages; this is a rendered-canvas export.

## Limits

External GitHub OAuth authorization, organization/private repository access, admin integrations, production deployment, physical Android/iOS profiling, high-concurrency multiplayer load and exhaustive feature-by-feature regression are not verified by this pass. The GitHub panel opening is not evidence of successful authorization. Existing real production accounts and cloud databases were not changed. No zero-bug guarantee is made.

## Delivery boundary

Push the existing feature branch and open a pull request against `main`. Do not merge, deploy or delete additional files. Wait for user merge instructions. Stages one through four remain in separate preceding commits.
