# World migration — stage 3

## Continuous two-island world

Developer Metropolis and East Island share one player-coordinate space. A causeway connects the main island's eastern boulevard to East Island's avenue. Players walk or drive across the deck using the current controls; crossing does not relocate the player or change coordinate origins. `shared/world.ts` supplies the same expanded bounds and sea-gap rule to the client and Node server. Existing accounts retain their saved coordinates.

The phone map now draws both islands and the causeway, and includes an East Island destination. This destination has no interior-entry action. The Jade Signal Tower on the second island uses the existing building-entry and office-interior flow.

## Streaming implementation

- The existing main city stays resident to preserve its activities and procedural fallback.
- East Island's far GLB is prefetched within 3,800 local model units. Its detailed GLB is prefetched within 1,750 units of the current or predicted position. Prediction follows a selected destination up to 900 units ahead, or manual movement up to 650 units ahead.
- Streaming decisions run every 250 ms. Detailed geometry becomes active within 1,750 units and stays active until the player leaves a 2,050-unit radius. This hysteresis prevents repeated detail changes around one distance boundary.
- A session cache retains the two load promises and their scenes. Returning to the island reuses the loaded scenes. Distant geometry is hidden, and invisible detailed interaction targets are excluded from picking. The cache has two entries, rather than growing for every visit.
- A simple resident island surface and avenue remain available if streamed assets fail. The bridge and sea-gap rule remain usable independently of asset loading.
- Repeated trees use two `InstancedMesh` batches. Bridge piers and road markings also use instancing. Static architecture is batched by material in Blender, with the interactive tower kept separate.
- No NPCs or abilities were added. GDevelop files were not changed or deleted.

## Asset budget and sources

| Chunk | Bytes | Triangles | Material primitives |
| --- | ---: | ---: | ---: |
| `far.glb` | 42,504 | 656 | 8 |
| `near.glb` | 129,516 | 4,560 | 9 |

Sources are `assets/blender/east-island/far.blend` and `near.blend`. The deterministic generator is `tools/blender/build_east_island.py`. Geometry and solid-color materials were authored for this repository; no external asset package was used.

Exported GLB headers and lengths, tower axis/position, bridge overlap with both shores, and building clearance from the central avenue passed static checks.

## Verification

`npm run build` passed, including TypeScript checking. `git diff --check` passed. Vite still reports the existing main JavaScript chunk above 500 kB (now approximately 502.70 kB uncompressed).

The development-only `frontend/streaming-smoke.html` runs the real `ThreeCity` renderer across the causeway, back to the main island, and across again. It samples actual renderer state, player coordinates, and the registered building colliders. This fixture uses empty place/job lists to isolate the crossing; its timings are not full-game benchmarks. The fixture is excluded from the production build.

| Check | Desktop: 1280 × 720 | Mobile viewport: 390 × 844 |
| --- | --- | --- |
| Crossing, return, repeat | Passed | Passed |
| LOD sequence | far → near → far → near | far → near → far → near |
| Detailed chunk prefetched before arrival | Yes | Yes |
| Total LOD chunk requests | 2 | 2 |
| Maximum per-frame coordinate step | 11.312 | 14 |
| Road/collider or sea-gap errors | None | None |
| Last sampled fixture frame rate | 59 FPS | 57 FPS |

These frame-rate readings come from the local browser environment and this isolated fixture. They do not establish performance on an Android device, under a full multiplayer workload, or in the complete populated game. Browser screenshot capture was unavailable, so no new in-game screenshot or pixel-level visual check is claimed.

The regular game opened successfully at mobile size; its phone showed the updated two-island map and East Island button with no browser errors in the fresh session.

`node tools/testing/streaming-network-smoke.mjs` passed against an isolated temporary database and a separate real Node/Socket.IO server. Two disposable users exchanged 72 movement updates across world cells, reached `(3280, 784)` and `(3288, 784)`, and saved those exact coordinates on disconnect. A move off the causeway was rejected. No real account data was changed by this network test.

## Reproduce

1. `npm run dev`, then open `http://localhost:5173/streaming-smoke.html` and click **Run crossing smoke test**. Repeat at desktop and mobile viewport sizes.
2. `node tools/testing/streaming-network-smoke.mjs`.
3. `npm run build`.
4. Regenerate art when needed with `blender --background --factory-startup --python tools/blender/build_east_island.py`.

The game's existing straight-line destination movement is still subject to building obstacles. Players can steer manually onto the eastern boulevard and causeway. This stage does not introduce automatic pathfinding.

Stop after committing this stage. Do not begin the full lighting, water, sky, materials, or environmental-animation pass until the user says **proceed to step four**. The feature branch has not been pushed.
