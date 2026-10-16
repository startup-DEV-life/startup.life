# Blank Life · build notes

## Stack

- **Game client:** TypeScript, React, Vite, Three.js, CSS; GDevelop export in `gdevelop/`.
- **Live play/API:** Node.js, Express, Socket.IO.
- **Current game runtime database:** SQLite (`data/lagos-life.sqlite`).
- **Hosted Supabase database:** project `blank-life` (`oeddrnzcbtdesofpzxyo`) in `eu-west-1`; its 20-table server-owned schema is in `supabase/migrations/`.
- **3D world:** Three.js scene and original island model in `public/models/`.

## Run and build

- `npm install`
- `npm run dev` — starts the API and web client locally.
- `npm run build` — TypeScript check and optimized web build.
- `npm start` — starts the production Node API after building the client.

## Accounts and hosting

- Copy `.env.example` to `.env` and set its server values before exposing the app.
- GitHub holds source and releases. This multiplayer game needs an HTTPS host that can run the Node API and WebSockets; static GitHub Pages alone cannot run that backend.
- The Supabase project and schema are live, but the current game API still reads and writes SQLite. Runtime database cutover and existing-player/resource data migration are not complete; do not treat this as a production Supabase connection yet. The project API URL is `https://oeddrnzcbtdesofpzxyo.supabase.co`.
- The hosted tables have RLS enabled and are denied to `anon` and `authenticated`; they are intended for the trusted server only. Keep the Supabase server secret or PostgreSQL connection string in the deployment secret store, never in `VITE_*` variables or Git.
- Never put Supabase service-role/secret keys in `VITE_*` client variables.
