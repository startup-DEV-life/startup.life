# Startup.life — playable demo and game guide

**Demo:** http://localhost:5173/  
**Production:** https://blank-life.onrender.com/  
**Detailed architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
**Build and deploy notes:** [`BUILD.md`](./BUILD.md)

## What you are demoing

Startup.life is a browser-based 3D developer-life game set in a Lagos-inspired island city. You explore its districts, enter a multi-floor coding campus, practice beginner programming drills, visit the phone and laptop apps, and optionally sign in for account-backed progress and live multiplayer features.

This is a working game prototype. It is not a finished commercial MMO: some screens are local simulations, GitHub needs OAuth configuration, and the production database is currently SQLite rather than Supabase. The feature guide below calls these limits out instead of presenting them as finished services.

## Quick guided demo (about 8–12 minutes)

### 1. Start in Lagos

The game opens over a bright low-rise city map: gridded streets, a broad lagoon, colorful homes and mixed-use blocks, and landmark pins. Tap a neighborhood building to see its name and use, then walk to its entrance to go inside. You can begin as a guest; create an account only if you want to demonstrate saved account progress and live multiplayer.

- **Desktop:** move with `W`, `A`, `S`, `D` or the arrow keys. Hold `Shift` to move faster. Press `1`, `2`, or `3` to switch camera modes. Click the ground to walk to a point and click a building to select/enter it.
- **Phone/tablet:** use the on-screen joystick and touch controls. The renderer automatically uses a lighter quality profile on touch devices and phones.
- **Camera:** walk mode follows the character; the other modes let you inspect the island. Drag to orbit when orbit controls are enabled.

For a short visual tour, walk from the spawn toward the central blue-glass **Tech Place**. Select a building by clicking/tapping it. The campus interior replaces the outdoor island view; leaving the interior restores the island.

### 2. Visit Tech Place

Tech Place is the central developer campus. Its interior is a cutaway view so the room layout is visible while you explore.

- **Ground:** receptionist, reception desk, and a locked staff door.
- **First and second floors:** coding labs with desks, glowing laptop screens, and a designated desk label.
- **Third floor:** shared board-game and lounge area.
- **Fourth floor:** leadership and mentor meeting room. Grower access is required for this floor in the demo.
- **Fifth floor, Yabuka:** reached by the elevator only. Use the security-pass interaction shown in the floor controls.

Use the in-game floor controls to change floors. Stairs are available up to floor four; the fifth-floor control uses the elevator/security flow. The floor is presented as a compact isometric room, not a large navigable simulation with pathfinding yet.

### 3. Try learning and quests on the laptop

Open the laptop UI and choose **Learn** to see the guided learning campus. The content is organized around coding fundamentals and career paths. Complete a drill to see feedback and progress behavior.

- Guest learning completion is saved in this browser’s local storage.
- Signed-in learning progress is sent to the API and stored in SQLite.
- The learning feature provides coding exercises; it is not an unrestricted code execution sandbox.

The laptop’s terminal is a safe in-game command simulation. It does not run commands on the player’s computer or on the Render server. The GitHub app is an in-game interface that can show account data after OAuth is set up.

### 4. Try the phone

Open the phone and browse its apps, such as the map, learning, inventory, search, and dispatch. The Lagos city map shows places and player markers; selecting a destination can move the game toward that location.

Dispatch is a game simulation. It displays a pretend ride, food, or roadside request and a simulated assignment; it does not contact a real driver or provider. Web search links open public sites in a new browser tab.

### 5. Show social and multiplayer behavior

Create or sign in to an account, then open the game in a second browser/device with another account. Nearby signed-in players can appear in the world; chat and live player movement are sent through Socket.IO. Guest mode is useful for showing the world, but authenticated sessions are required for the live-city connection.

The current multiplayer implementation uses spatial Socket.IO rooms and SQLite-backed chat history. It has not been load-tested for hundreds of simultaneous players.

### 6. Visit other places

Explore **Legend House**, **The Commons**, **Tech Noodle**, the beach, and the stadium. The game includes building/scene interactions and destination selection. Legend House has a rest/log-out transition. The stadium is a world location; live sports broadcasts are not wired up.

## How the game works under the hood

1. **React UI (`frontend/src/App.tsx`)** holds the current player, movement input, account state, selected destination, interior/floor, phone/laptop screens, quest progress, and notices.
2. **Three.js scene (`frontend/src/ThreeCity.tsx`)** builds the Lagos-style city, roads, lagoon, map pins, buildings, and rooms, draws avatars and effects, follows the player, and detects clicks with raycasting.
3. **Movement loop** reads keyboard, gamepad, or joystick input; updates player coordinates; tests collisions while the player is moving; and interpolates camera/avatar motion for smoother visuals.
4. **Content files (`shared/data/`)** define island places, jobs, learning content, homes, and collectables. Combat rules are in `frontend/src/game/combat.ts`.
5. **Express API (`backend/server/index.ts`)** serves account, progress, learning, resource, chat, and GitHub routes. The same Node process serves the compiled frontend in production.
6. **Socket.IO** authenticates a session cookie and broadcasts nearby player movement, presence, chat, and mystery-round events.
7. **Persistence today:** signed-in account data uses a local SQLite database file. Some guest preferences/progress use browser local storage.
8. **Hosting:** Render builds the React/Vite app and runs the Node server. The PWA manifest and service worker let supported browsers install the website to a phone home screen.

## Feature truth table

| Feature | Current behavior |
| --- | --- |
| 3D island, character movement, camera, buildings/interiors | Playable in the browser; scene is rendered locally by Three.js. |
| Beginner coding drills and learning progress | Exercises and progress flow exist; guest progress is local, signed-in progress uses the API. |
| Online players and chat | Socket.IO implementation exists for authenticated users. |
| GitHub repositories/profile | Backend OAuth/API implementation exists; deployed OAuth credentials and correct scopes are required. |
| In-game terminal | Safe command simulation; it does not execute arbitrary shell commands. |
| Startup pitch / growers / dispatch | Demo interactions; no real investment, payment, delivery, or calls. |
| Supabase | SQL migration files are present, but the running Node app currently uses SQLite. |
| Mobile app | Installable web app/PWA; not a native store package. |
| 300–700 concurrent users | Not currently proven; the prototype needs a scalable database/realtime deployment and load testing. |

## Run it yourself

From the project root:

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173/`. The API listens on port `4000`. Keep the terminal running while you play. Stop it with `Ctrl+C`.

Production build and start:

```bash
npm run build
npm start
```

See `.env.example` for optional GitHub OAuth and moderator settings. Do not commit real secrets to GitHub.

## Known demo limitations

- Render’s free filesystem can be reset, so SQLite data and uploaded book files are not durable there.
- The deployed runtime is not yet connected to Supabase.
- GitHub linking will fail until its OAuth app values are configured on the server and the callback URL matches GitHub settings.
- Calls, end-to-end encrypted messaging, live sports, real investment flows, and arbitrary shell execution are not available.
- Performance varies by device/browser. A lower pixel ratio and fewer effects are used on phones/low-end hardware, but no universal frame-rate guarantee is possible.
