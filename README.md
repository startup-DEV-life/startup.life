# dev-life — Startup.life · Dev District

An independent browser game prototype: a multiplayer Lagos-inspired city rebuilt as a stylized 2D pixel developer district. It is not the proprietary source code for lagoslife.app.

## Archived GDevelop edition

The browser pixel game is now the active engine path. The old GDevelop-native project remains archived at [`gdevelop/`](gdevelop/) until its removal is explicitly approved, because it is a separate previously requested project archive.

The existing TypeScript game and Node server are retained as the content and backend reference while the GDevelop project is expanded. The migration order, retained assets, and integration boundaries are documented in [`gdevelop/MIGRATION.md`](gdevelop/MIGRATION.md).

## Board games platform

Board games are organized in the private [`startup.life-games`](https://github.com/startup-DEV-life/startup.life-games) repository, with separate folders for Chess, Checkers, Word Tiles, and an original property-trading game. Platform administration is organized in the private [`startup.life-admin`](https://github.com/startup-DEV-life/startup.life-admin) repository. The integration contract and the single shared PostgreSQL database boundary are in [`docs/GAMES_HUB.md`](docs/GAMES_HUB.md).

## Run it locally

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite server proxies API and Socket.IO traffic to Express on port 4000. The pixel city is rendered with React and CSS and does not require map credentials or external assets. The database creates itself at `backend/data/lagos-life.sqlite`.

For a production build:

```bash
npm run typecheck
npm run build
NODE_ENV=production npm start
```

## Code style

The project uses Prettier to keep TypeScript, TSX, CSS, HTML, and package metadata consistently formatted.

```bash
npm run format       # format the application and server source
npm run format:check # check formatting without changing files
```

The browser game, Node.js backend, and Vite config use TypeScript. React components use `.tsx`, while `frontend/index.html` remains the browser entry document and loads `frontend/src/main.tsx`. `npm run build` runs the project-wide type check before producing the production frontend.

Set `ADMIN_USERNAME` in `.env` to grant chat moderation access to a chosen account.

Demo videos and shared player files are stored under `backend/data/private-uploads/` by default. Set `PRIVATE_UPLOADS_PATH` to a mounted persistent-volume directory on a hosted service; an instance filesystem without a persistent volume may be cleared during restarts or deployments.

## Game features

- A responsive top-down pixel city with clickable districts, destinations, roads, player marker, and nearby-player markers.
- Pixel-styled player and place markers driven by the existing saved player and multiplayer position data.
- Buildings and destinations open the same interior activity panel, developer studios, named venues, homes, and generic explore/meet/rest activities.
- Named venues retain their own activities. Guests can enter and explore; signed-in players can save named venue visits, earn pocket money, and improve mood.
- A player phone with an island map, district navigation, career board, places, messages, and profile shortcuts.
- A preinstalled GameUp app on the phone and laptop that links to the private `startup-DEV-life/startup.life-games` board-game repository.
- Role-aware device apps: Beginners keep career paths and learning, Developers can record and publish project demos and share files, and Growers can browse developer demos with their GitHub repositories.
- Authenticated demo-video and file-transfer APIs. Demo videos are capped at 50 MB, player-to-player files at 15 MB, and downloads are available only to the sender and recipient or to authorized demo viewers.
- Installable mobile PWA with home-screen icons, standalone display, offline app-shell caching, and hold-to-move touch controls. The app shell can open offline, but accounts, multiplayer, and saved actions require the online backend.
- Original pixel geometry and UI use no proprietary map, character, model, or asset pack.
- WASD, arrow keys, on-screen buttons, and click/touch movement.
- Seven developer careers, including frontend, backend, and full-stack engineering. New accounts choose a career, and players can change careers later.
- A laptop developer workspace with the full supplied Linux command guide, a persistent simulated file system, editable project files, and safe in-game command emulation. It never runs commands on the player’s device or a real server.
- A Learn2Earn-inspired developer learning journey: original sequential problem-solving, debugging, web foundations, collaboration, AI-native engineering, project, and career-evidence challenges. Signed-in completion is validated and saved by the backend; each first correct completion awards virtual XP and game currency.
- Server-validated developer job tasks, experience points, saved career choice, and a 30-second task cooldown.
- Trust Protocol social-deduction rounds: private crew/saboteur role assignment, a sabotage/report meeting, and live voting. At least three signed-in developers must be online.
- Account registration/login, saved player progress, live presence, chat, homes, and chat moderation queue.

## Project layout

The repository groups runtime code by responsibility so each part has a clear home:

| Folder | What belongs there |
| --- | --- |
| `frontend/` | React pixel-game client, Vite config, PWA files, and icons. |
| `backend/` | Express and Socket.IO server, SQLite runtime data, learning uploads, programming catalog, and Supabase schema/migrations. |
| `shared/data/` | JSON game content used by both the browser client and backend: places, jobs, quests, homes, and items. |
| `docs/` | Product, architecture, setup, and gameplay documentation. |
| `scripts/` | One-off developer tools, including the programming-catalog importer. |
| `gdevelop/` | The separate GDevelop starter project and its portable archive. |

Root-level `package.json`, `package-lock.json`, `tsconfig.json`, and `render.yaml` coordinate development, type-checking, and deployment. SQLite files and uploaded PDFs stay under `backend/data/` and are excluded from Git.

## Documentation

Start at [`docs/README.md`](docs/README.md) for the documentation index. The [demo guide](GAME_DEMO.md) explains how to play, while [`ARCHITECTURE.md`](ARCHITECTURE.md) explains the implementation and [`BUILD.md`](BUILD.md) covers building and hosting.

This project uses original demo city geometry, character shapes, job descriptions, venues, and game economy. The social-deduction mode draws on the general hidden-role genre and uses original names and art. Your new site can be wired into the city once you send its address and explain whether it should appear as a link, a venue, or an in-game activity.

For public deployment, configure HTTPS, database backups, account recovery, community policies and moderation staffing. The current online presence and mystery-round state live in one server process; horizontal scaling needs shared Socket.IO and game state.


## Pixel map contribution

The current city is rendered by [`frontend/src/PixelCity.tsx`](frontend/src/PixelCity.tsx). New destinations should be added through the shared places and jobs data, using the pixel map rather than 3D models.

## Multiplayer capacity

The prototype uses spatial Socket.IO rooms so movement updates go to nearby players, and the renderer draws only the 55 closest remote avatars. This reduces per-client work but does not establish support for 300–700 concurrent players. The current server keeps presence and social-deduction rounds in one Node.js process and uses local SQLite. A production target at that scale needs load testing plus multiple app instances, a shared Socket.IO adapter/presence layer (such as Redis), shared durable database state (such as PostgreSQL), asset CDN/object storage, and monitoring.


## Mobile app

Startup.life is packaged as an installable Progressive Web App (PWA). Deploy it behind HTTPS, then open the site on the phone. Android browsers can install it from the browser menu or the in-game settings menu. On iPhone/iPad, open the site in Safari and use Share → Add to Home Screen. Touch movement uses press-and-hold controls. The service worker caches the app shell and static assets; it does not cache private account/API data, and multiplayer still needs a network connection.

### Try it on a phone during development

Connect the phone and development computer to the same Wi-Fi network, run `npm run dev`, then open `http://<computer-lan-ip>:5173` on the phone. The Vite development server listens on the local network and proxies game API and multiplayer traffic to the backend. Use the on-screen arrow pad or tap the pixel map to walk, then tap destinations to interact. The development URL is for local play; installable PWA behavior on a deployed phone site requires HTTPS.


The Learn2Earn learning journey in Startup.life is an independent educational game experience inspired by the broad public programme stages. It is not operated by or affiliated with Learn2Earn or Talent Nation. In-game XP and currency are fictional and do not represent wages, stipends, admissions, certificates, or access to paid work. Players can visit the [official Learn2Earn site](https://learn2earn.ng/) for the real programme and selection process.
