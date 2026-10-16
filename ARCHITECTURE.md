# Startup.life — how the game works

This document describes the current implementation in this repository. It separates working features from demo behavior so the build and hosting setup are understandable.

## 1. What the app is

Startup.life is a browser game with a third-person Lagos-inspired 3D island city, developer-learning activities, social features, and a phone/laptop interface inside the game. It is also installable as a Progressive Web App (PWA) on compatible phones. The current version is a web game; it is not a native Android or iOS package.

Production URL: <https://blank-life.onrender.com>

## 2. Technology stack

- **Frontend:** React, TypeScript, Vite, CSS.
- **3D:** Three.js, custom procedural geometry/materials and OrbitControls.
- **API/server:** Node.js, TypeScript, Express 5.
- **Live multiplayer:** Socket.IO over the same HTTP server.
- **Current database:** SQLite through `better-sqlite3`.
- **Hosting:** Render web service builds the frontend and runs the Node server from the GitHub repository.
- **Phone installation:** web manifest plus service worker; install from a supported mobile browser.

## 3. Main code map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Main React application state, game controls, UI panels, API calls, account/learning/game flows, and Socket.IO client. |
| `src/StartupWelcome.tsx` and `src/StartupWelcome.css` | Startup.life opening page, original logo mark, and interactive stack/build slideshow. |
| `src/ThreeCity.tsx` | Three.js scene, Lagos-style island-city and neighborhood generation, player/avatar rendering, interiors, camera, effects, picking, and collision-obstacle data. |
| `src/game/combat.ts` | Rift encounter state and combat rules. |
| `src/data/places.json` | Place and building records used by the island UI/world. |
| `src/data/jobs.json` | Job/task records. |
| `src/data/learning.json` and `src/data/coding-quests.json` | Learning content and coding quest definitions. |
| `src/data/homes.json`, `src/data/items.json` | Home and collectible definitions. |
| `data/programming-resources.json` | Programming-resource catalogue imported into the app database. |
| `server/index.ts` | Express API, authentication, SQLite schema/queries, GitHub OAuth, admin endpoints, and live Socket.IO events. |
| `public/models/lagos-shadow-frontier.glb` | Source model retained in the repository; the current Lagos city map is generated procedurally and does not load this asset. |
| `public/manifest.webmanifest`, `public/sw.js` | PWA metadata and service-worker install/cache behavior. |
| `supabase/` | Supabase schema/migration work retained in the repository; it is not the live server database adapter today. |
| `render.yaml` | Render service/build configuration. |
| `BUILD.md` | Project build and hosting notes. |

## 4. How the game starts

1. Vite serves the React app in development (`npm run web:dev`).
2. The opening screen presents the playable world and a four-slide explanation of the client, backend, languages, and hosting. Players can enter the city or create an account.
3. The React root in `src/App.tsx` loads the seed data and requests server data where a backend feature exists.
4. `ThreeCity` creates a Three.js renderer, camera, lights, island scene, player model, effects, and input/picking handlers.
5. A browser animation frame updates movement, camera easing, other online avatars, doors, water, ambient effects, pickups, and combat.
6. In production, Render builds the static client into `dist/`; Express serves those files and handles `/api/*` plus Socket.IO from one Node process.

## 5. World and 3D rendering

The map is generated in code as a broad low-rise Lagos-inspired island city. It uses shallow green terrain, a central lagoon, a wide orthogonal street grid, colorful residential and mixed-use blocks, distinctive landmark buildings, and visible emoji map pins. Map buildings can be selected; named homes and neighborhood instances expose their purpose on selection and open an interior. Interior layouts are themed for homes, cafés, clinics, shops, community venues, and developer workspaces. Tech Place keeps its separate six-level floor plan. Code also creates doors, effects, beaches, and the stadium. The Lagos Life reference informed the compact, colorful district composition; map geometry and game assets remain original. The older GLB source file remains in the repository but is not loaded into this city map.

The renderer uses WebGL through Three.js. A scene graph holds meshes and groups. The camera follows the local player in walk mode; other camera modes use OrbitControls. Pointer/touch taps raycast into the scene to select a building or place, while taps on the ground request movement. Movement is interpolated in the render loop. Server-side movement is sent over Socket.IO for signed-in players.

### Recent smoothness work

- Low-spec/phone devices use a lower renderer pixel ratio and disable expensive real-time shadows.
- The desktop shadow map was reduced and its coverage tightened to the play area.
- Animated ambient motes and clouds were reduced to lower per-frame GPU and CPU work.
- Player collision checks skip their obstacle scan while the player is stationary.
- The game still uses a continuously rendered 3D scene; actual frame rate depends on the device, browser, thermal limits, and GPU.

For the best balance, use a recent browser with hardware acceleration enabled. Older phones may still render at a lower resolution to keep controls responsive.

## 6. Player movement, buildings, and interactions

`App.tsx` owns the player’s logical coordinates and input state. Keyboard, gamepad, and touch joystick input modify the player position. `ThreeCity` renders that state and reports map clicks, selected buildings, pickups, and combat events through callbacks.

Building selection and interior entry are separate states. `ThreeCity` creates the interior view when the selected building/floor changes; leaving clears the interior state and restores the island and camera. Some content is intentionally simulated, such as the food/ride dispatch and startup pitch feed.

## 7. Multiplayer and realtime events

Signed-in clients connect to the server with Socket.IO. The server authenticates the session cookie, places clients into nearby spatial rooms, sends a nearby-player snapshot, and broadcasts join/move/leave events. Chat and the cooperative mystery round are also event-driven.

This is a small prototype architecture. It is not yet a validated production design for 300–700 simultaneous users. That scale needs load testing, a horizontally scalable realtime layer/adapter, durable external storage, observability, abuse controls, and capacity planning.

## 8. Backend and data storage: important current limitation

The running server opens a local SQLite file at `data/lagos-life.sqlite` by default (or the `DATABASE_PATH` environment variable). Accounts, player progress, chat, resource catalogue state, and GitHub-link metadata are stored there. The programming-resource JSON catalogue is loaded at server startup.

**The live app is not currently connected to Supabase.** The repository has Supabase SQL/migration files, but `server/index.ts` uses SQLite and does not use a Supabase client. Render’s free service filesystem is ephemeral, so SQLite changes and uploaded PDFs can be lost when the service restarts or redeploys. Do not treat production account/progress data as durable until the app is migrated to a persistent database/storage service (for example, wiring this backend to the intended Supabase project and Supabase Storage, or using a persistent disk with appropriate backups).

## 9. Authentication and GitHub

The app’s account/session endpoints live in `server/index.ts`. Session tokens are hashed before database storage and sent in an HTTP-only cookie. GitHub connection uses OAuth and encrypted token storage. Repository, organization, and profile data are fetched from GitHub’s API on request.

GitHub linking requires the server environment variables listed in `.env.example` (OAuth client ID/secret, callback URL, frontend URL, and a 32-byte encryption key in hex). Without those configured in the deployed environment, the in-game GitHub panel cannot complete authorization. Never put OAuth secrets in frontend code or commit `.env` files.

The in-game terminal is a **browser-side command simulation**, not a shell on the player’s device or on Render. It must not be given arbitrary server command execution. Real Git operations require a carefully scoped GitHub integration or a separate isolated workspace service.

## 10. Feature status and boundaries

- **3D island, local walking, camera modes, building selection/interiors:** implemented in the client.
- **Realtime presence and chat:** implemented for authenticated connected clients through Socket.IO and SQLite-backed chat history.
- **Learning progress, inventory, jobs, homes, and account data:** API-backed for signed-in users; guest progress has some browser-local storage behavior.
- **GitHub repositories/profile:** API integration exists, but it depends on valid deployed OAuth configuration and GitHub scopes.
- **Startup pitches and investor interest:** currently a local demo interaction; it does not publish globally, move money, or establish contact.
- **Phone dispatch:** game simulation only; it does not request a real ride or delivery.
- **Voice/video calls, end-to-end encrypted chat, real investments/payments, game-wide live sports, and shell access:** not implemented as real services.
- **Supabase:** migration assets exist, but production runtime is still SQLite as described above.

## 11. Run locally

Requirements: Node.js compatible with the project’s TypeScript/Vite dependencies and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

The development command starts the Express API and Vite client together. The client normally runs at `http://localhost:5173`; the API defaults to port `4000`. Local environment values are optional for core guest gameplay; GitHub OAuth needs valid credentials.

Production build and start:

```bash
npm run build
npm start
```

The `build` command runs TypeScript checking before creating the Vite production bundle. `start` launches the Node server, which serves `dist/` and the API.

## 12. Deploy flow

1. Commit and push the source to the connected GitHub branch.
2. Render checks out the repository and runs the build command from `render.yaml`.
3. On a successful build, Render starts the Node service and routes web traffic to it.
4. The service health endpoint is `/api/health`.
5. The PWA is served from the same origin; on a phone, open the site in the browser and use its install/add-to-home-screen action.

A successful Render deployment makes the website reachable; it does not make SQLite durable or automatically connect Supabase, GitHub OAuth, or native mobile app stores.
