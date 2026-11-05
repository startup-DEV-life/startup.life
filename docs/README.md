# Startup.life documentation

Use this page to find the right guide for the task at hand. These documents describe the code that is in the repository today; planned features and demo-only behavior are labeled as such.

## Start here

- [Project overview and local quick start](../README.md) — what Startup.life is, requirements, commands, and the main feature list.
- [Playable demo walkthrough](../GAME_DEMO.md) — controls, a suggested tour, and a feature-by-feature status guide.
- [How the game works](../ARCHITECTURE.md) — frontend, 3D scene, server, realtime events, storage, GitHub integration, and deployment flow.
- [Build and hosting notes](../BUILD.md) — stack, environment setup, Render configuration, and current database limitations.
- [Product requirements](PRD.md) — product goals, player types, intended experience, and requirements.

## Feature-specific guides

- [Startup roles and assignments](STARTUP_ROLES.md) — coding, marketing, HR, management, product, sales, support and finance tasks.

- [Learning campus setup](learning-campus-setup.md) — setup and administration notes for learning content.
- [Retained prototype assets](../assets/legacy-gdevelop/README.md) — preserved art and provenance from the retired standalone engine prototype.
- World migration: [audit](WORLD_STAGE_1_AUDIT.md), [Blender island](WORLD_STAGE_2_REPORT.md), [streaming](WORLD_STAGE_3_REPORT.md), [art direction](WORLD_STAGE_4_REPORT.md), [cleanup plan](WORLD_STAGE_5_DELETION_PLAN.md), [cleanup verification](WORLD_STAGE_5_REPORT.md).

## Current deployment

- **Game:** [blank-life.onrender.com](https://blank-life.onrender.com)
- **Health check:** `GET /api/health`
- **Source:** [startup-DEV-life/startup.life](https://github.com/startup-DEV-life/startup.life)

The Render deployment builds the TypeScript/React client and starts the Node.js server. The server currently persists game data in local SQLite; it is **not connected to Supabase at runtime**, and Render's free service filesystem is ephemeral. Treat accounts and progress on the hosted demo as temporary until durable database storage is implemented and verified.

## Truthful feature boundaries

- The Three.js world combines Blender-generated GLB chunks, continuous two-island streaming and procedural fallback geometry. The older supplied GLB remains a retained source asset.
- The in-game Linux terminal is a safe command simulator. It does not execute shell commands on a player's phone/computer or on the server.
- GitHub features use server-side OAuth and GitHub's API. They require OAuth credentials, correct scopes, and a matching callback URL in the deployment environment.
- Multiplayer presence and chat use Socket.IO. The current single-process deployment has not been load-tested for hundreds of concurrent players.
- The phone is part of an installable web app (PWA), not a native Android/iOS store package.
- Pitching, dispatch, investments, calls, and some social interactions are demo flows; they do not transfer money or connect to real service providers.

When a document conflicts with the implementation, the current source code and the caveats in [How the game works](../ARCHITECTURE.md) take precedence over older product plans.
