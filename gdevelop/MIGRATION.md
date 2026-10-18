# Startup.life GDevelop migration

`gdevelop/BlankLife/BlankLife.json` is the primary engine project for Startup.life. The browser client and Node server remain in this repository as the source of truth for content while the gameplay is re-authored in GDevelop events and scenes.

## Already in GDevelop

- Lagos Shadow Frontier GLB island asset.
- Third-person developer avatar and follow camera.
- Desktop movement, jumping, pointer-lock camera orbit, and touch joystick/jump controls.
- Budget-phone rendering configuration: 960×540 internal size, 30 FPS target, dynamic resolution, and reduced visual effects.

## Content to retain from the browser edition

| Game area | Source of truth | GDevelop target |
| --- | --- | --- |
| City places and homes | `shared/data/places.json`, `homes.json` | Interactable world zones and venue scenes |
| Developer careers and job tasks | `shared/data/jobs.json` | Career board, task loop, XP and currency HUD |
| Learning journey | `shared/data/learning.json`, `coding-quests.json` | Learn hub scenes and saved challenge progress |
| Terminal workspace | `shared/data/linuxCommandReference.json` | Safe in-game command simulation UI |
| Economy and inventory | `shared/data/items.json` | Player profile and inventory panels |
| Accounts, saves, chat and presence | `backend/server/index.ts` | HTTP profile client plus realtime bridge |

## Build order

1. **World slice** — district labels, interactable venues, phone/HUD, and saveable local profile.
2. **Career loop** — career selection, job board, task cooldowns, XP, currency, and mood.
3. **Learning loop** — challenge scenes, answer validation, rewards, and progress screen.
4. **Social systems** — chat, presence, homes, and the Trust Protocol activity.
5. **Online service bridge** — add a WebSocket-compatible gateway for GDevelop while keeping the Node/Socket.IO server authoritative.
6. **Publishing** — test Web, Android, iOS, Windows, macOS, and Linux exports with device-specific quality settings.

## Important integration boundary

GDevelop's standard WebSocket capability cannot speak directly to the current Socket.IO server. Before online multiplayer is enabled, the backend needs a small WebSocket gateway that translates between GDevelop messages and Socket.IO/game-state services. Until then, every new GDevelop system should work in local single-player mode and keep network calls behind a single event group.

## Open the project

1. Open GDevelop desktop.
2. Select **Open a project**.
3. Choose `gdevelop/BlankLife/BlankLife.json`.
4. Preview the `Lian Yu — Developer District` scene.

Controls: `W/A/S/D` or arrow keys move, `Space` jumps, mouse drag rotates the camera. Mobile controls appear in the touch build.
