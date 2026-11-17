# Dev. Life and Startup.life: one browser game

## Canonical implementation

Repository: `startup-DEV-life/startup.life`. Runtime: Three.js, React, Express and Socket.IO. The existing Developer Metropolis and East Island assets, streaming, buildings, careers, accounts, phone/laptop and multiplayer remain the shared environment. Dev. Life mechanics are adapted here rather than embedded as a second engine.

Seven destinations are placed on roads in the newer world: Developer Commons, Culture Quarter, Market Avenue, Campus Crossroads, East Island Landing, East Island Gardens and the Veil Gate Approach. These are seven travel points on the current two-island environment, not seven newly imported Godot islands. Walk through a gate to travel to the next point, or press M and choose a destination. Arrivals are outside the trigger radius. E attunes a nearby rune; seven runes complete the exploration quest. Progress is saved per player on the current browser/device and is not cross-device/server progression.

## Components

- `shared/waygates.ts`: destination allowlist and safe arrival positions, shared by server and client.
- `frontend/src/game/WaygateAtlas.tsx`: atlas, automatic gate detection and local rune progression.
- `frontend/src/game/movement.ts`: camera-relative input and swept collision with wall sliding.
- `frontend/src/game/devLifeArt.ts`: gate visuals and wrist-parented rifle.
- `frontend/src/game/combat.ts`: pulse hit/damage and building-box occlusion alongside existing melee combat.
- `backend/server/index.ts`: authenticated `waygate:travel`, cooldown, fixed server-controlled destinations, room/presence relocation and saved coordinates.

The rifle is equipped inside the existing Shatterline encounter. Travel to Veil Gate Approach in the atlas, then select Enter Shatterline trial to begin. Hold left mouse to fire; right-drag changes the Walk camera view. On touch, use LOOK and FIRE. The wrist socket follows the aiming arm. Hip and knee pivots animate walking without independently floating leg segments. City shots/player damage are not enabled; accounts and careers keep their existing semantics.

## Run and check

```sh
npm ci
npm run build
npm run test:dev-life
npm run dev
```

Open http://localhost:5173. Sign in to use the existing game. `?quality=low` selects low graphics without changing the saved preference.

For isolated local server integration checks (never use a production database):

```sh
PORT=4015 DATABASE_PATH="$PWD/backend/data/unified-local-test.sqlite" NODE_ENV=test npm start
# In another terminal:
TEST_BASE_URL=http://localhost:4015 npx tsx scripts/test-dev-life-server.ts
```

The server check creates a fictional local account and verifies all destinations, malformed IDs, cooldowns, indoor travel blocking, post-travel movement, destination multiplayer presence and entering/exiting the existing trial. A separate dev frontend can target this server with `STARTUP_API_URL=http://localhost:4015 npm run web:dev -- --port 5176`. SQLite files remain ignored.

## Deployment and older prototype

The existing Render service `blank-life` deploys this repository and serves both browser client and API. Play at https://blank-life.onrender.com. No additional paid service is required. The Games Hub should direct Dev. Life players here; it remains a separate board-game library. The Godot source and 0.4.0 native packages in `startup.life-games` are retained as historical reference, not advertised as the current combined game. No repositories or release history are deleted.

## Limits

This is a playable integration, not a finished game. The existing encounter simulation and rune rewards remain local prototype logic; combat is not authoritative competitive multiplayer. Collision covers the world's exported logical building boxes, not every decorative prop or camera obstruction. The server controls travel destinations but does not yet persist rune completion. Native Android/Linux 0.4.0 packages do not contain this browser merge; phones use the existing installable PWA.
