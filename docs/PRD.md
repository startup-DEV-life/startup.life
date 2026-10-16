# Startup.life — Product Requirements Document

**Product:** Startup.life
**Current experience:** Startup.life · North Coast Outpost / Dev District
**Document status:** Product baseline and forward plan
**Updated:** 14 October 2026
**Repository:** `dev-life-world/dev-life`

## 1. Product summary

Startup.life is a multiplayer, mobile-friendly life-simulation game where players explore a large island, choose a software-development career, complete practical learning and work challenges, and build a shared life with other players. The island is the game world; a phone and an in-world developer laptop provide the player's maps, services, learning tools, quests, and career workspace.

The current build is a browser game and installable Progressive Web App (PWA). It uses an original, procedurally generated 3D island inspired by the supplied coastal-island and low-poly environment references. Startup.life is an independent product. Its learning challenges are original and are not affiliated with Learn2Earn or Talent Nation.

## 2. Product vision

Make learning and practicing software development feel like living a social game world: players travel to places, choose a role, practice real engineering judgment, ship small tasks, and see progress reflected in their character and career.

The experience should work on desktop and mobile, keep the world visually immersive, and make important actions available through in-world devices rather than a screen crowded with overlays.

## 3. Problem and opportunity

New developers often need a low-pressure way to practice skills, understand career paths, and build a record of completed work. Conventional learning dashboards can feel disconnected from a motivating social experience. Startup.life combines game-world exploration with original developer drills, project briefs, career tasks, and multiplayer presence.

## 4. Target users

### Primary

- Early-career and aspiring software developers who want guided practice.
- Players who enjoy exploration, social simulation, character progression, and cooperative game systems.
- Mobile-first players who want short sessions and touch controls.

### Secondary

- Developer-learning cohorts, educators, and community organizers who may want to host structured activities in a future version.

### Age and audience

The current account creation flow requires the player to confirm they are 18 or older. The product should retain a clearly stated audience and age policy as social and communication features evolve.

## 5. Product principles

1. **Explore at the player's pace.** The island should feel spacious and should not expose the whole experience as a stack of panels.
2. **Use devices as the interface.** The phone handles on-the-go services and navigation; the laptop is the developer workspace.
3. **Practice through doing.** Learning content should ask players to reason, build, debug, and collaborate.
4. **Reward progress honestly.** XP and currency are fictional game rewards and must never be presented as wages, credentials, admission, or paid work.
5. **Show real players as people.** World avatars represent the current player and connected players. Do not add ambient human NPCs by default.
6. **Keep the art original.** Use supplied images as broad visual references; do not copy proprietary game maps, characters, models, or branded assets.
7. **Design for phone controls first.** Touch targets, readable text, performance, and safe-area spacing are core requirements.

## 6. Core experience and user journeys

### 6.1 First session

1. Player opens the web game or installed PWA.
2. Player enters the island as a guest and sees their own character, the world, movement controls, and the Phone/Laptop dock.
3. Player can explore and open the phone. Account creation is available from the phone profile flow.
4. To save progress and join multiplayer presence, the player creates an account or logs in.
5. During account creation, player chooses a developer career and confirms the current age requirement.

### 6.2 Explore the island

1. Player moves on foot with WASD/arrows or touch controls, or uses the in-game car for faster travel.
2. Player opens **Phone → Island map** to see their position, other online players, destinations, districts, and camera/lighting options.
3. Player selects a destination or place and travels there through the world.
4. Player chooses a building, walks to its entrance, and opens its activity/interior panel.

**Current behavior:** Buildings expose an activity panel for the selected destination; the current implementation does not provide fully modeled, walkable 3D interiors for every building.

### 6.3 Developer career and tasks

1. Player opens **Laptop → Career path**.
2. Player chooses among available development roles, including frontend, backend, and full-stack roles.
3. Player travels to the matching studio and completes the server-validated task action.
4. First completion grants virtual currency and career XP, increments task count, and updates the player profile.

### 6.4 Learn and rank up

1. Player opens **Laptop → Learn2Earn**.
2. Player browses the original Overview, Drill room, and Projects content.
3. Challenges are completed in order. The backend validates signed-in answers and persists progress.
4. The player receives fictional XP and currency for a first correct completion.
5. The app links to the official Learn2Earn website for programme information and clearly identifies Startup.life as independent.

### 6.5 Multiplayer and social play

1. A signed-in player connects to the live world.
2. Nearby connected players appear as remote avatars and exchange movement updates.
3. Players can use neighbourhood chat and report inappropriate messages.
4. Three or more signed-in players may start a Trust Protocol social-deduction round.

## 7. Functional requirements

### 7.1 World, movement, and camera

- Render a stylized 3D island with coastline, hills, roads, residential and mixed-use buildings, parks, piers, boats, and recognizable destinations.
- Support keyboard and touch movement, walking, jumping, vehicle toggle, camera orbit, and alternate camera modes.
- Keep the landscape larger than the initial view so exploration and travel are meaningful.
- Provide map navigation, player coordinates, locations, and nearby online-player markers through the phone.
- Maintain usable frame rate and touch response on supported mobile devices.

### 7.2 Characters and presence

- Render one local player avatar and remote avatars for connected online accounts only; remove ambient human NPCs.
- Keep player identity, display name, selected avatar appearance, position, orientation, and vehicle state consistent with multiplayer updates.
- Remove remote avatars promptly when their account disconnects or leaves the visible spatial area.
- Use a richer human-proportioned character presentation. Current procedural avatars are stylized; realistic rigged models are a future asset upgrade.

### 7.3 Buildings and places

- Allow a player to select any listed/modelled destination and see its name, purpose, and district.
- Require the player to approach the selected building before using its entry/activity action.
- Provide an activity panel appropriate to the selected venue or a general explore/meet/rest fallback.
- Preserve selected-building state and communicate when the player is still walking toward an entrance.
- Treat fully walkable 3D interiors as a future expansion unless supplied interior models become available.

### 7.4 Phone applications

The Phone is the in-world navigation and daily-services hub. It must provide:

- Island map and district/waypoint selection.
- Dispatch request simulation for rides, food, and roadside assistance, with clear in-game-only wording.
- Search web and shortcuts to public developer resources.
- Inventory and collected island items.
- Places and destination access.
- Messages/neighbourhood chat entry.
- Player profile and account access.
- A route to careers and learning through the laptop.

### 7.5 Laptop applications

The laptop is the developer workspace and must provide:

- **Quest log:** all current objectives, completion state, progress, and links to the relevant action.
- **Terminal:** an Ubuntu/Linux command reference based on the supplied cheat sheet, plus a saved virtual workspace with working navigation, file/folder operations, text search, an in-game editor, history, and selected developer-command simulations. Device administration, real package installation, hardware access, networking, remote Git, and other machine-level actions are simulation-only; the browser must never execute host operating-system commands or access the player's device.
- **Learn2Earn:** the independent Startup.life learning journey, original drills, and project briefs.
- **Career path:** list available roles, current selection, and a path to a role's studio and tasks.
- Keyboard and touch navigation that works at desktop, portrait phone, and landscape phone sizes.

### 7.6 Quests and progression

- Display quest state in the laptop rather than a persistent world HUD panel.
- Track career selection, selected-building exploration, and first completed developer task in the current starter quest set.
- Display objective details, completion state, and a progress indicator.
- Keep quest actions connected to the relevant career, map, building, or task flow.

### 7.7 Accounts and saved data

- Provide registration, login, logout, and profile editing.
- Save career selection, avatar index, player progression, currency, mood/energy, position, learning completion, inventory, home ownership, and venue visits where supported.
- Keep passwords hashed and sessions protected by server-managed cookies.
- Provide guest exploration while clearly indicating which progress is not saved.

### 7.8 Multiplayer, chat, and community safety

- Use live presence and spatially scoped movement updates to reduce unnecessary traffic.
- Support live player join/move/leave events and online counts.
- Provide rate-limited text chat, message reporting, and an admin moderation queue.
- Restrict moderation actions to authorized staff accounts.
- Keep Trust Protocol roles private to the appropriate player and support meetings, votes, and round results.

### 7.9 Mobile distribution

- Keep Startup.life installable as a PWA over HTTPS, with suitable app icons and standalone display.
- Cache only the public application shell and static assets for offline launch.
- Explain that login, live multiplayer, and saved actions require an active network connection.
- Keep gameplay controls accessible with touch and respect device safe areas.

## 8. Scope and release plan

### Current prototype (implemented)

- Procedural stylized 3D island and generated buildings/venues.
- Local player avatar plus live online-player avatars; ambient NPC characters removed.
- Walking, jumping, vehicle toggle, touch movement, camera controls, phone, and laptop UI.
- Phone map, dispatch simulation, web search, inventory, places, messages, and profile access.
- Laptop quest log, Linux reference and safe simulated terminal with a per-account browser-local virtual workspace, Learn2Earn experience, and career paths.
- Account system, SQLite persistence, Socket.IO presence/chat, jobs, original learning challenges, homes, collectibles, and Trust Protocol round logic.
- Installable PWA shell.

### Next milestone: playable vertical slice

- Test the main first-session journey on a range of phones and desktop browsers.
- Refine mobile performance, avatar readability, building selection, and travel feedback.
- Add meaningful task outcomes and richer quest chains tied to career paths.
- Add explicit loading, offline, reconnect, empty, and error states to device apps.
- Validate account, persistence, chat, moderation, and multiplayer flows end to end.

### Production milestone: content and scale

- Replace or extend procedural terrain with reviewed, licensed `.glb`/`.gltf` environment assets where useful.
- Add authored character assets and animation rigs if higher realism is required.
- Add walkable interiors for priority destinations and unique activities per venue.
- Move from one-process presence to a horizontally scalable architecture with shared presence/Socket.IO coordination and durable production storage.
- Add load testing, deployment automation, backups, metrics, logs, alerts, and operational playbooks.

## 9. Scale and performance requirements

### Product target

The long-term product ambition is to support **300–700 simultaneous players** across the game service. This is a target for a future production architecture, not a claim about the current prototype.

### Current constraints

- The backend is one Node.js process with in-memory live presence and social-deduction round state.
- Local SQLite is used for persistence.
- The 3D client caps rendered remote avatars (currently up to 55 desktop / 20 mobile) for performance.
- Current infrastructure has not been demonstrated at 300–700 concurrent users.

### Production acceptance criteria for the scale target

- Load-test the complete login, presence, movement, chat, persistence, and reconnect path with a declared 300–700 concurrent-user profile.
- Demonstrate the target in a defined deployment region and device mix; publish p95 latency, disconnect rate, server CPU/memory, and client frame-rate results.
- Use shared durable production storage and shared presence/room coordination across server instances.
- Support graceful reconnect, server restart, and failure recovery without losing durable player progress.
- Establish asset delivery, database backups, monitoring, alerting, capacity limits, and operational ownership before public scale claims.

## 10. Non-functional requirements

- **Performance:** preserve smooth navigation and movement on mid-range phones; avoid blocking interactions during world rendering or app transitions.
- **Accessibility:** keyboard operability, visible focus, clear labels, sufficient text contrast, non-color-only completion cues, and appropriately sized touch controls.
- **Security:** validate rewards and career completions server-side; use password hashing, session protection, request validation, rate limits, and authorization checks.
- **Privacy:** collect only data required for accounts, saved progress, moderation, and gameplay. Document retention and deletion behavior before public launch.
- **Reliability:** surface backend connection state, preserve local UI state where practical, and provide a clear recovery path for interrupted network sessions.
- **Compatibility:** support current evergreen desktop browsers and mobile browsers that support WebGL and PWA installation.
- **Content integrity:** label simulated dispatch and terminal functions; clearly distinguish game rewards from real-world opportunities.

## 11. Success measures

Instrumentation is not yet specified as a production analytics system. Once privacy and consent behavior are defined, track:

- First-session completion: percent of new players who move, open the phone, and reach a destination.
- Account conversion: percent of guest explorers who register or sign in.
- Career activation: percent of signed-in players who select a role and reach a matching studio.
- Learning engagement: drill starts, completions, return visits, and progression drop-off by stage.
- Task engagement: developer tasks started/completed and time between completions.
- Social health: chat reports per active session, report resolution time, and moderation workload.
- Technical health: client frame rate by device tier, API/socket availability, reconnect success, and server resource use.
- Scale validation: concurrent players and spatially distributed traffic supported at the agreed service levels.

## 12. Dependencies and content inputs

- Node.js and npm for local development.
- Browser support for WebGL, WebSocket/Socket.IO, and PWA features.
- Original career task data in `src/data/jobs.json` and lesson data in `src/data/learning.json`.
- Original location, home, and collectible data in `src/data/places.json`, `src/data/homes.json`, and `src/data/items.json`.
- Future map or character assets must include source/license details, model scale/orientation notes, and embedded or packaged textures.

## 13. Risks and open decisions

- **Realism vs. performance:** high-detail rigged characters and large map assets require mobile profiling and level-of-detail decisions.
- **Concurrency target:** 300–700 users needs architecture and load evidence; it cannot be inferred from the current single-process prototype.
- **Map boundaries and districts:** finalize island size, travel times, transportation, and district unlocking before content production.
- **Interior gameplay:** choose which buildings receive true 3D interiors first; the current activity panel is not an interior simulation.
- **Career content:** define role-specific task rubrics, review/hint behavior, and player-authored project storage.
- **Social policy:** establish community rules, moderation coverage, account recovery, retention, and reporting workflows for public launch.
- **Mobile packaging:** the current deliverable is a PWA. Decide whether a native app wrapper is needed after validating installation and performance on target devices.
- **Brand and name:** Startup.life is the confirmed product name. “Dev District” and “North Coast Outpost” may remain as in-world location names.

## 14. Out of scope for the current prototype

- Reproducing the proprietary code, map, art, characters, or game systems of another game.
- Real-money payouts or claims that in-game learning rewards are employment, wages, credentials, or programme admission.
- Executing arbitrary terminal commands on a player's phone or computer.
- Claiming 300–700-player capacity before the production architecture is implemented and load-tested.
- Fully modeled walkable interiors for every building without dedicated interior assets and interaction design.
- Native iOS/Android store releases; current mobile delivery is the web/PWA experience.
