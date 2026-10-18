# Startup.life on GDevelop

This is the primary GDevelop-native playable-world project for Startup.life. The main project is `BlankLife/BlankLife.json` and the supplied Lagos Shadow Frontier Blender export is included as `BlankLife/assets/lagos-shadow-frontier.glb`.

The scene setup and third-person controls are adapted from GDevelop's [3D island terrain example](https://github.com/GDevelopApp/GDevelop-examples/tree/main/examples/3d-island-terrain); the sample island/foliage art was replaced with your GLB and original placeholder controls/avatar.

## Open it

1. Install or open the GDevelop desktop editor.
2. Choose **Open a project** and select `BlankLife/BlankLife.json`.
3. Let GDevelop load the assets, then press **Preview**.
4. On desktop, use **W/A/S/D** to move, **Space** to jump, and click-drag to rotate the camera. On touch screens, use the on-screen joystick and jump button.

The scene uses a static mesh collider on the imported island, a lightweight third-person humanoid placeholder, third-person camera controls, touch controls, and a mobile-first performance preset: 960×540 internal scene size, a 30 FPS cap, a 3,800-unit camera far plane, mobile antialiasing disabled, and dynamic resolution scaling enabled. Ambient and directional lighting stay on, while expensive shadows, bloom, depth-of-field, and ambient occlusion are off. The model asset is about 1.8 MB. The avatar is generated from simple low-poly shapes and can be replaced with a rigged GLB later.

This preset favors predictable frame pacing and battery use on budget phones. The retained Three.js browser build uses a compact phone GPU path as well: sub-1× device-pixel rendering, mobile shadows off, fewer sky sprites and ambient particles, and a lower nearby-player render limit. Higher frame rates and effects can be restored for desktop or higher-end devices after profiling on target hardware.

## Current migration boundary

This project is an engine migration starter, not a complete port of the existing Startup.life web app. The existing TypeScript app and Node server remain in the repository. Login, persistent player profiles, Socket.IO multiplayer, quests, the Learn2Earn experience, terminal, books, videos, and job placement still need GDevelop-side screens/events and a networking adapter. GDevelop's built-in WebSocket client speaks WebSocket; the current server uses Socket.IO, so they cannot connect directly without a compatible server endpoint or a small bridge.

The island GLB is a single imported model for this first slice. Buildings are visually present, while entry/interior scenes and per-building interactions still need to be authored as separate GDevelop scenes/events.

See [`MIGRATION.md`](MIGRATION.md) for the active build order and the browser systems that will be retained and ported into GDevelop.
