# Startup roles and assignments

Careers now represent a startup team, not only engineering. Existing career IDs and saved progress are preserved. New choices include Startup Developer, Marketing & Growth, HR & People, Startup Manager, Product Manager, Sales & Partnerships, Customer Support, and Finance & Operations. Product Designer also receives product briefs; existing engineering careers receive beginner coding exercises.

## Using the feature

Choose a career in signup or Career paths. Open **Role tasks** on the laptop or phone. The existing `developer` account tier is displayed as **Startup professional** in signup and is independent of career choice. Beginners still explore career paths and learning; Growers keep their support/investor experience.

- **Developer:** fill missing expressions in JavaScript loops, conditions and functions. Three exercises rotate with completed assignments. Code is compared with a curated expected expression; it is never executed.
- **Marketing:** upload a PNG/JPEG/WebP up to 5 MB, write at least 40 characters of campaign copy and include three distinct hashtags. Images and submissions are private practice work, not public social posts. Upload limit: ten images per account per day.
- **HR:** enter a building with other online players on the same floor, refresh the assignment, and send each listed colleague a welcome of 20–500 characters. Welcomes are delivered to those players' authenticated sockets. No NPCs are introduced. If colleagues leave, **Refresh colleagues on this floor** updates the roster without granting rewards; someone must be present. Existing live position/building claims are used, not a new authoritative interior simulation.
- **Management:** submit a launch plan covering goal, owner, deadline and risk.
- **Product/design:** explain user, problem, solution and success criteria.
- **Sales:** prepare a customer/problem/value/next-step pitch.
- **Support:** write an acknowledgement, troubleshooting steps, privacy guidance and follow-up.
- **Finance:** calculate the remaining startup launch budget.

Text submissions use basic length/section checks. These are practice completion checks, not semantic grading or mentor review. Each non-coding role currently has one repeatable starter assignment; this is not a complete professional curriculum.

## Implementation

- `shared/data/jobs.json`: existing careers plus new roles. New roles share a workspace and are marked `virtual` so they do not generate overlapping buildings.
- `frontend/src/StartupWork.tsx`: shared phone/laptop task UI, uploads and colleague introductions.
- `backend/server/startup-work.ts`: assignments, evidence validation, private image access, authenticated greetings and atomic rewards.
- SQLite tables: `work_assignments`, `work_greetings`, `work_images`. Assignments and evidence are linked to the authenticated player. Stale or previously completed assignments cannot earn another reward. Existing `job_completions`, coins, XP, energy and 30-second reward cooldown are reused.
- `/api/jobs/complete` no longer awards coins from a button click. The server requires `/api/work/submit` with valid evidence.
- Building ID and floor accompany indoor movement so HR rosters stay within one building/floor and nearby exterior coordinates.
- Campaign images live in `PRIVATE_UPLOADS_PATH/work-images`; production needs durable storage. This adds SQLite tables; it does not migrate the runtime to Supabase.

## Delivery status

Implemented on `feature/startup-role-tasks`. Production build and TypeScript checking passed. Automated/runtime/browser tests were not run in this change. The existing Vite main bundle size warning remains. This branch has not been deployed.
