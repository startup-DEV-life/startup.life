# Blank Life · build notes

## Stack

- **Game client:** TypeScript, React, Vite, Three.js, CSS; GDevelop export in `gdevelop/`.
- **Live play/API:** Node.js, Express, Socket.IO.
- **Current local database:** SQLite (`data/lagos-life.sqlite`).
- **Hosted database target:** Supabase Postgres; starter schema and row-level policies are in `supabase/migrations/`.
- **3D world:** Three.js scene and original island model in `public/models/`.

## Run and build

- `npm install`
- `npm run dev` — starts the API and web client locally.
- `npm run build` — TypeScript check and optimized web build.
- `npm start` — starts the production Node API after building the client.

## Accounts and hosting

- Copy `.env.example` to `.env` and set its server values before exposing the app.
- GitHub holds source and releases. This multiplayer game needs an HTTPS host that can run the Node API and WebSockets; static GitHub Pages alone cannot run that backend.
- Supabase project authentication is not linked in this checkout yet. The SQL migration uses Supabase Auth IDs and is a hosted-data foundation; the current game API still uses its SQLite adapter until the Supabase project is linked and the data migration is completed.
- Never put Supabase service-role/secret keys in `VITE_*` client variables.
