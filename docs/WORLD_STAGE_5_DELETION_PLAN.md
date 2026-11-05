# Stage five — proposed GDevelop cleanup

Status: explicitly approved by the user. The bounded cleanup is being executed; see the stage-five report for verification results.

## Audit

At commit `dfbca72`, `gdevelop/` contains 12 tracked files: a separate engine project JSON, portable ZIP, three engine-specific Markdown documents, and seven reusable assets. The production TypeScript client, Node backend, shared content, tooling, package scripts and Render configuration have no GDevelop runtime imports or path references. The standalone JSON embeds its engine extensions and scene events; these are not used by ThreeCity.

The root README still incorrectly calls GDevelop the primary engine. Documentation needs to state that Three.js is the main engine and describe the Blender/GLB pipeline.

## Exact deletion list (only after approval)

1. `gdevelop/BlankLife/BlankLife.json` — obsolete independent GDevelop scene and embedded extensions.
2. `gdevelop/BlankLife-GDevelop.zip` — portable copy of that obsolete project.
3. `gdevelop/BlankLife/README.md` — standalone editor instructions.
4. `gdevelop/MIGRATION.md` — superseded migration toward GDevelop.
5. `gdevelop/README.md` — superseded primary-engine instructions.

These files remain recoverable from Git history. Do not rewrite or purge history. The last pre-cleanup art commit is `dfbca72`.

## Preserve reusable assets

Move all seven files in `gdevelop/BlankLife/assets/` to `assets/legacy-gdevelop/` without changing their bytes:

| File | SHA-256 |
| --- | --- |
| blank-life-avatar.glb | a0644771579dc0a671b2d71fbba801405b82f74b2bdb8c5a8b85d9ee05aac285 |
| controls-keyboard.svg | fe76fd233de98e0fc78c5575c16e097ad255f60f69ac2b287b8da1016d9f127b |
| controls-touch.svg | 2da5a3ea7378fc03fe09062f54c2e90723a0b7dfe66bbfb980cdc260f912dd5b |
| joystick-border.svg | fdd377b8f937c47e250de2cc18d6a935c5f120d913e3e1f3b8cfda1ee4138869 |
| joystick-thumb.svg | befd74ad0e6a7022a6afc22901ae022a3153e1df24ceaa027f101144d3a1c1ba |
| jump-button.svg | 84ce2f7ab3ec262a8d82c83f7a9341d3d6c229ac382ce7adff0fd2498c90e4a7 |
| lagos-shadow-frontier.glb | f32bfb25c8d6dd8f3990e217f874af5e30c25e7fa1d5d0c6911c610fe51c5676 |

The last asset is byte-identical to `frontend/public/models/lagos-shadow-frontier.glb`; preserve both for this bounded cleanup. Retain the former project's attribution to GDevelop's 3D island terrain example in a new asset provenance README, clearly distinguishing scene/control adaptation from original placeholder artwork and the supplied island model. Do not invent licensing rights.

Keep all Three.js code, current/generated GLBs, Blender sources, user assets, multiplayer/backend code, activity systems and historical stage reports.

## Documentation changes after approval

Update `README.md`, `BUILD.md`, `ARCHITECTURE.md`, `docs/README.md` and the obsolete current-engine wording in `docs/GAMES_HUB.md`. Link to retained asset provenance and stage reports. Historical stage reports remain unchanged as records of their stages.

## Verification and delivery after approval

1. Verify preserved asset hashes and search for stale runtime/path references.
2. Run TypeScript checking, production build and diff checks.
3. Run the isolated two-player Socket.IO/persistence regression.
4. Exercise real ThreeCity rendering, island crossing/return/cache, quality switching, and office entry/exit at desktop/mobile viewport sizes; inspect console errors and actual frame exports.
5. Smoke the regular game, phone/laptop and available local account flows. Report unavailable external OAuth/admin integrations and physical-phone testing honestly; do not claim exhaustive coverage.
6. Record tests and measured fixture performance in the stage-five report; make clean local commits.
7. Push only `feature/anime-multi-island-world` to the configured GitHub repository and open a pull request against its default branch. Do not merge or deploy.
8. Report the PR and stop for merge instructions.

Approval request: approve deleting the five listed engine files, preserving/moving the seven assets, and updating the listed documentation. No broader deletion is authorized by this plan.
