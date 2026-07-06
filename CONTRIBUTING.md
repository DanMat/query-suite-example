# Contributing to query-suite-example

Thanks for your interest! This repository is the runnable example for the
[`@danmat` HTTP QUERY suite](https://github.com/DanMat/query-suite-example) —
a stock-screener API + client using `query-fetch`, `accept-query`,
`query-cache`, and `query-server`.

## Development setup

Requires Node.js 18+ (the demo and CI run on 22).

```sh
git clone https://github.com/DanMat/query-suite-example.git
cd query-suite-example
npm install
```

Common tasks:

```sh
npm run demo        # run the end-to-end walkthrough (all four packages)
npm start           # start the real-socket server (POST-override path)
npm run dev:worker  # run the Cloudflare Worker locally (native QUERY)
npm run typecheck
npm run lint        # Biome: lint + format check
npm run format      # Biome: apply safe fixes
```

## Before you open a pull request

- Make sure `npm run lint`, `npm run typecheck`, and `npm run demo` all pass.
- A pre-commit hook runs `lint-staged` (Biome) automatically; please don't skip it.

## Deploying

`npm run deploy` publishes the Worker to Cloudflare (see the README). The bundled
deploy workflow deploys on push once `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` secrets are set.

## Code of Conduct

By participating you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
