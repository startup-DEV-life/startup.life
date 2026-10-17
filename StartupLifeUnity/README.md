# Startup.life Unity Edition

This is the Unity replacement for the earlier GDevelop starter. It opens in Unity **2022.3.62f3 LTS** and contains a first playable Dev District scene generated at runtime.

## What works now

- Third-person character movement, jump, and orbit camera.
- Stylized Lagos-inspired developer district with roads, studios, landmark hub, lighting, fog, and HUD.
- Keyboard controls: `WASD`/arrow keys, mouse orbit, and space to jump.
- A compact, dependency-light foundation suitable for desktop, mobile, and WebGL iteration.

## Open it

Open `StartupLifeUnity` in Unity Hub. Unity imports the project and then you can press Play. The generated world replaces the sample scene at runtime, so no manual scene wiring is needed.

## Next milestones

1. Import the supplied island GLB with a glTF importer and replace the generated blockout.
2. Add Unity Input System actions plus real mobile joystick controls.
3. Bridge the current Node/Socket.IO backend through a Unity-compatible realtime adapter.
4. Port player accounts, jobs, quests, learning, chat, and multiplayer in focused systems.
