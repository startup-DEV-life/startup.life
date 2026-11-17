# Unified game verification — 17 November 2026

- `npm run build`: passed TypeScript and Vite production build. Vite reports the existing large frontend bundle warning; this is not a build error.
- `npm run test:dev-life`: passed camera-relative directions/facing, analog speed, swept thin-wall collision, wall sliding, sea boundary, pulse damage and wall occlusion, boss gating, seven bounded arrival points and wrist-parented rifle transform.
- `scripts/test-dev-life-server.ts` against an isolated local SQLite database: passed authenticated travel to all seven destinations, malformed IDs, cooldown, indoor restrictions, post-travel movement, two-client destination presence, trial entry, regular-travel blocking during the trial, and trial exit.
- Actual production browser build: rendered the newer islands and avatar, opened the seven-destination atlas, travelled from East Island to Developer Commons and Veil Gate Approach, attuned runes and retained them across reload, then entered the Shatterline trial.
- Diagnostic scene collision check: all seven destination arrival points clear the active logical building colliders.
- Source credential-pattern and file-size scan: no matches or files above 20 MiB in candidate tracked files. No local test database or QA credential is tracked.

Visual startup was slow on this consumer PC while another Godot preview and development renderer were active. The old preview was stopped; checks continued with the production build at low graphics. This is not a sustained FPS or phone-device performance certification.

Rune progression and combat rewards remain local prototype logic; the native Godot APK is historical and does not contain this browser merge.
