# The Last Shift

A randomized browser puzzle about opening a restaurant with 21 unlabeled light switches and a spectacularly undocumented electrical system.

## Local development

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm test
pnpm build
```

## Cloudflare Workers

The game deploys as the independent `hometech-fun-21-switch-game` Worker at:

`https://www.hometech.fm/fun/21-switch-game/`

The main HomeTech.fm website does not build or serve the game. Cloudflare routes only this path to the game Worker. After authenticating Wrangler:

```bash
pnpm deploy
```

## Puzzle model

Each level generates a hidden XOR circuit matrix. A switch may affect no visible circuit, one light, or several lights at once. Multiple switches on a circuit behave like concealed 3-way or multi-way wiring. A secret solvable state is generated first, then each light's polarity is derived from it, guaranteeing a solution while keeping the starting room dark. Levels add lights up to a six-light maximum, and every retry receives new wiring.
