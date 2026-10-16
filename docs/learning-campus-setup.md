# Startup.life learning campus setup

## Overview trial and coding quests

`src/data/learning.json` contains the Overview gate and short reasoning drills. `src/data/coding-quests.json` contains the beginner Python, Go, JavaScript, and TypeScript coding paths. Coding quests are checked for required starter constructs on the server; the current game does not execute submitted Python or Go programs. Quest completion and rewards are saved per signed-in player.

## GitHub Projects room

The Projects room needs a GitHub OAuth App. Create one in GitHub Developer Settings and configure its callback URL to exactly match `GITHUB_CALLBACK_URL`. Set these values in the server environment (never expose them in browser code):

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (for local development: `http://localhost:4000/api/github/callback`)
- `FRONTEND_URL` (for local development: `http://localhost:5173`)
- `GITHUB_TOKEN_ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)

Restart the server after setting variables. The player must be signed in and approve the GitHub consent screen. Startup.life requests `read:user` and `repo` so GitHub can include private repositories the player authorizes. GitHub's `repo` OAuth scope is broader than read-only; the app only calls profile and repository-list endpoints, and stores the token encrypted with AES-256-GCM. Keep the encryption key stable and backed up securely. Players can disconnect from Projects and revoke the OAuth app in GitHub settings.

## Admin-curated PDF and video rooms

Set `ADMIN_USERNAME` to the exact Startup.life username of the library editor, then restart the server. That account gets the admin upload forms and the server enforces the same permission on every publishing endpoint.

- PDF uploads are limited to 25 MB and must have a PDF signature. The original file is stored under `data/learning-library/`, outside the public web root. Admins set title, language, description, and a price in BL learning coins.
- Signed-in players earn BL learning coins from cleared learning challenges and coding quests. A purchase is recorded per player. PDF downloads require ownership (or the configured admin account).
- Video entries accept HTTPS YouTube video or Shorts URLs. Only admins can add or remove them. Players can watch the lesson in the video room or open it on YouTube.

`players.learning_coins` is separate from the island's pocket-money balance and from real-world currency. The current upload UI accepts the administrator's PDF and YouTube selections; it does not crawl or copy materials from the Ebook Foundation repositories. The free-programming-books catalog remains available through `/api/resources` for search and reference.
