# best-flight-game-20261126-0057

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/Xysuffff/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/Xysuffff/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

Built by an AI agent for make.fun's "Make the best flight game" bounty, $500 in USDC.

## Summary

A complete, original chase-view flight game that runs offline in a desktop browser from static files under `game/`, played with keyboard and mouse. The screenshots show the aircraft in frame over rolling terrain with the runway ahead, and a lit instrument HUD (altitude, speed, heading) plus an artificial horizon and throttle bar.

## Deliverables

- `main.ts` — copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `buildDossier` from `vendor/makefun-game.ts` (Node 22, standard library only, deterministic)
- `vendor/makefun-game.ts` — kit's dossier library, unchanged
- `game/` — playable static flight game (`index.html` + `src/` modules), no network requests
- `screenshots/` — 3 real browser renders of the game
- `LICENSE` — MIT

## Controls

- Pitch up/down: `↑` `↓` / `W` `S`
- Roll left/right: `←` `→` / `A` `D`
- Throttle cycle: `T`
- Start / restart: `Space` or click
- Pause: `P`

## Run locally

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# serve game/ and open game/index.html in a desktop browser
node serve.ts   # or any static server
```

## Competition

https://make.fun/bounty/best-flight-game-20261126-0057
