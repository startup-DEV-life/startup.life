# dev-life — Startup.life · Dev District

An independent browser game prototype: a multiplayer Lagos-inspired city rebuilt as a stylized 3D developer district. It is not the proprietary source code for lagoslife.app.

## GDevelop edition

A GDevelop-native third-person island starter is available in [`gdevelop/BlankLife/BlankLife.json`](gdevelop/BlankLife/BlankLife.json), with a portable project archive at [`gdevelop/BlankLife-GDevelop.zip`](gdevelop/BlankLife-GDevelop.zip). Open the JSON file in GDevelop to work on the engine version. It uses the supplied Lagos Shadow Frontier GLB and includes a generated placeholder avatar, desktop movement, touch controls, and a third-person camera. See [`gdevelop/README.md`](gdevelop/README.md) for setup and the current migration boundary. The existing TypeScript browser game and Node server are preserved alongside it.

## Run it locally

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite server proxies API and Socket.IO traffic to Express on port 4000. The Three.js scene is generated locally and does not require map credentials or external map tiles. The database creates itself at `data/lagos-life.sqlite`.

For a production build:

```bash
npm run typecheck
npm run build
NODE_ENV=production npm start
```

The browser game, Node.js backend, and Vite config use TypeScript. React components use `.tsx`, while `index.html` remains the browser entry document and loads `src/main.tsx`. `npm run build` runs the project-wide type check before producing the production frontend.

Set `ADMIN_USERNAME` in `.env` to grant chat moderation access to a chosen account.

## Game features

- A full stylized 3D island with rocky coast, mountain ridges, a street grid, marked avenues, a runway and hangar, homes, long apartment blocks, parks, piers, boats, and skyline landmarks. The supplied island screenshot guided the terrain and layout.
- Human-proportioned, original low-poly 3D player avatars with profile-driven face, body shape, skin, hair, and streetwear, with avatars for the local player and connected online users only; ambient human NPCs are removed.
- All modeled buildings are clickable and open a shared interior activity panel: developer studios, named venues, the airport hangar, long apartment buildings, and individual homes. Unassigned buildings have generic explore/meet/rest activities so their final purpose can be supplied later.
- Named venues retain their own activities. Guests can enter and explore; signed-in players can save named venue visits, earn pocket money, and improve mood.
- A player phone with an island map, district navigation, career board, places, messages, and profile shortcuts.
- Installable mobile PWA with home-screen icons, standalone display, offline app-shell caching, and hold-to-move touch controls. The app shell can open offline, but accounts, multiplayer, and saved actions require the online backend.
- Original geometry uses the supplied island, alley, human topology, and low-poly environment images as broad visual references. The models and props are generated in code; no reference image or proprietary asset pack is copied into the game.
- WASD, arrow keys, on-screen buttons, mouse/touch movement, and camera orbit.
- Seven developer careers, including frontend, backend, and full-stack engineering. New accounts choose a career, and players can change careers later.
- A laptop developer workspace with the full supplied Linux command guide, a persistent simulated file system, editable project files, and safe in-game command emulation. It never runs commands on the player’s device or a real server.
- A Learn2Earn-inspired developer learning journey: original sequential problem-solving, debugging, web foundations, collaboration, AI-native engineering, project, and career-evidence challenges. Signed-in completion is validated and saved by the backend; each first correct completion awards virtual XP and game currency.
- Server-validated developer job tasks, experience points, saved career choice, and a 30-second task cooldown.
- Trust Protocol social-deduction rounds: private crew/saboteur role assignment, a sabotage/report meeting, and live voting. At least three signed-in developers must be online.
- Account registration/login, saved player progress, live presence, chat, homes, and chat moderation queue.

## Project layout

- `src/ThreeCity.tsx` — generated Three.js world, controls, buildings, and avatars.
- `src/App.tsx` — game UI and client state.
- `src/data/jobs.json` — editable career tasks and studio positions.
- `src/data/learning.json` — original challenge prompts and answer keys; backend validates answers and persists completion.
- `server/index.ts` — Express API, SQLite data, authentication, Socket.IO multiplayer, jobs, and social-deduction round logic.
- `data/` — local SQLite database, created on first run.

## Documentation

Start at [`docs/README.md`](docs/README.md) for the documentation index. The [demo guide](GAME_DEMO.md) explains how to play, while [`ARCHITECTURE.md`](ARCHITECTURE.md) explains the implementation and [`BUILD.md`](BUILD.md) covers building and hosting.

This project uses original demo city geometry, character shapes, job descriptions, venues, and game economy. The social-deduction mode draws on the general hidden-role genre and uses original names and art. Your new site can be wired into the city once you send its address and explain whether it should appear as a link, a venue, or an in-game activity.

For public deployment, configure HTTPS, database backups, account recovery, community policies and moderation staffing. The current online presence and mystery-round state live in one server process; horizontal scaling needs shared Socket.IO and game state.


## Map asset handoff

The current island is procedurally built in `src/ThreeCity.tsx`; there is no in-game or backend upload form. To replace or extend it with a complete external map, provide a `.glb` (preferred, with textures/materials embedded). For a `.gltf`, include every referenced texture and buffer in a single ZIP. Include approximate file size, model scale/orientation notes, and the asset's source/license. The asset can then be integrated into the scene and served as a static game asset (or moved to object storage/CDN for larger production files).

## Multiplayer capacity

The prototype uses spatial Socket.IO rooms so movement updates go to nearby players, and the renderer draws only the 55 closest remote avatars. This reduces per-client work but does not establish support for 300–700 concurrent players. The current server keeps presence and social-deduction rounds in one Node.js process and uses local SQLite. A production target at that scale needs load testing plus multiple app instances, a shared Socket.IO adapter/presence layer (such as Redis), shared durable database state (such as PostgreSQL), asset CDN/object storage, and monitoring.


## Mobile app

Startup.life is packaged as an installable Progressive Web App (PWA). Deploy it behind HTTPS, then open the site on the phone. Android browsers can install it from the browser menu or the in-game settings menu. On iPhone/iPad, open the site in Safari and use Share → Add to Home Screen. Touch movement uses press-and-hold controls. The service worker caches the app shell and static assets; it does not cache private account/API data, and multiplayer still needs a network connection.

### Try it on a phone during development

Connect the phone and development computer to the same Wi-Fi network, run `npm run dev`, then open `http://<computer-lan-ip>:5173` on the phone. The Vite development server listens on the local network and proxies game API and multiplayer traffic to the backend. Use the on-screen arrow pad to walk, drag the 3D scene to rotate the camera, pinch to zoom, and tap buildings or venues to interact. The development URL is for local play; installable PWA behavior on a deployed phone site requires HTTPS.


The Learn2Earn learning journey in Startup.life is an independent educational game experience inspired by the broad public programme stages. It is not operated by or affiliated with Learn2Earn or Talent Nation. In-game XP and currency are fictional and do not represent wages, stipends, admissions, certificates, or access to paid work. Players can visit the [official Learn2Earn site](https://learn2earn.ng/) for the real programme and selection process.
