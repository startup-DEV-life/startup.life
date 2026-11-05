# World migration — stage 2 result

## What is playable

The existing Three.js game remains the main engine. A Blender-authored terrain chunk now supplies the island surface, and a new Developer Metropolis campus occupies the west coast. The campus has a glass-and-jade hall, courtyard, roof terraces, pavilions, lanterns, and trees. Players can walk around the site, select it from the phone map, and click the hall or door to enter an existing office-style interior. The current player movement, camera modes, multiplayer coordinate format, quests, activities, and Node backend remain in place.

Both GLBs load asynchronously. If either load fails, `ThreeCity.tsx` leaves the original procedural terrain and city active. The GDevelop project is untouched.

## Reusable sources and coordinates

- Blender source files: `assets/blender/developer-metropolis/island-terrain.blend` and `campus.blend`.
- Deterministic authoring script: `tools/blender/build_developer_metropolis.py`.
- Browser assets: `frontend/public/models/developer-metropolis/island-terrain.glb` (191,872 bytes) and `campus.glb` (211,528 bytes).
- All art in these files is original geometry/materials made for this repository; no third-party asset package was imported.
- The Blender script maps its local `(X, Z)` layout into Three.js `(X, Z)` and accounts for glTF's Blender `-Y` to Three.js `+Z` conversion. The game applies its existing `WORLD_SCALE = 2` through the parent city group.
- The campus hall bounds are X `-1025..-895`, Z `464..558`. The explicit collider covers the hall, while the door at Z `560.5..561.5` remains reachable. The hall clears the nearest east-west road edge. Existing procedural obstacles remain active.

## Checks

- Blender 5.2.2 regenerated both `.blend` and GLB files successfully.
- GLB headers, mesh names, file sizes, campus bounds, map limits, door access, and road clearance were checked from exported bytes. Static geometry checks do not replace a full gameplay collision pass.
- `npm run typecheck` and `npm run build` passed.
- Browser smoke: intro opened, GLBs reported loaded, phone map showed Developer Metropolis, keyboard movement changed the player position, and no runtime errors appeared.
- Fallback smoke: temporarily withheld the campus GLB, reloaded, observed the procedural world state, then restored the GLB.
- The local in-app browser reported about 301 draw calls and 11 FPS for the procedural baseline at spawn. The optimized Blender version reported about 303 calls and 12 FPS at spawn, then 448 calls and 15 FPS while moving through a different view. At a 390 × 844 viewport it reported 213 calls and 14 FPS. These are short browser-emulator samples affected by view and environment, not device benchmarks or a guarantee of smoothness on phones. A hardware mobile performance pass is still needed.

## Remaining limits

This stage adds the first authored island surface and campus. The rest of the city remains procedural so existing destinations stay playable. World streaming, a second island, and full art-direction treatment belong to steps 3 and 4. Phone-map selection uses the game's existing straight-line movement; nearby existing buildings can block an automatic route, and players can continue with manual controls. The campus can be reached manually through the west-coast road grid. No NPCs or abilities were added.

Stop here until the user says **proceed to step three**.
