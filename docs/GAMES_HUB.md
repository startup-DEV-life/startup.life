# Games Hub integration

The city is the player’s entry point. It should send an authenticated player to the deployed Games Hub and the hub must send them back after a game session.

## Repositories

- Games Hub: `startup-DEV-life/startup.life-games`
- Platform administration: `startup-DEV-life/startup.life-admin`

## Integration contract

1. Configure `GAMES_HUB_URL` in the Startup.life deployment.
2. Add a “Games” entry in the city’s phone or main menu that opens that URL.
3. Pass only a short-lived signed user handoff token; never expose a database URL in the browser.
4. The Games API validates the handoff token and maps its user ID to `core.players.startup_life_player_id` in the shared PostgreSQL database.
5. The Games Hub displays entries marked `live` or `beta` in `games.catalog`.

The first code integration should be made after the Games Hub has a deployed URL and its signed-token format is agreed. This keeps the current local GDevelop and browser game runnable without hard-coding an unfinished destination.
