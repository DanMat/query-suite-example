# query-suite-example

[![CI](https://github.com/DanMat/query-suite-example/actions/workflows/ci.yml/badge.svg)](https://github.com/DanMat/query-suite-example/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A small, runnable example that wires together the **`@danmat` HTTP QUERY suite** ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)) into one story: a **stock screener** whose filter is too rich for a URL, so it travels in the request body — exactly what the QUERY method is for.

> 🌐 **Live playground:** **<https://query-suite-example.danmat.workers.dev>**
> Open DevTools → Network on that page to watch a real `QUERY` request fly.

It exercises all four packages end-to-end:

| Package | Role in the demo |
| --- | --- |
| [`@danmat/query-fetch`](https://github.com/DanMat/query-fetch) | Client — sends the QUERY with a JSON filter body; falls back to POST when needed. |
| [`@danmat/accept-query`](https://github.com/DanMat/accept-query) | Negotiates the response format from the server's `Accept-Query` header. |
| [`@danmat/query-cache`](https://github.com/DanMat/query-cache) | Serves an identical repeat query from cache — keyed on the request body. |
| [`@danmat/query-server`](https://github.com/DanMat/query-server) | Validates the request, enforces `Content-Type`, advertises `Accept-Query`. |

## Run it

```sh
npm install
npm run demo
```

```text
1) QUERY with a structured filter body (too complex for a URL)
   → 4 matches: MSFT, AAPL, NVDA, AMD
2) Negotiate response format from the server's Accept-Query header
   → server advertises "application/json"; client picks: application/json
3) Identical query again → served from cache, zero extra fetches
   → fetches for two identical queries: 1 (cache served the repeat)
4) Wrong Content-Type → 415 with an Accept-Query hint
   → HTTP 415; server accepts: application/json
5) Legacy endpoint (501 on QUERY) → automatic POST fallback
   → 4 matches, servedVia: POST-fallback

All four @danmat packages exercised end-to-end ✔
```

The server is a tiny [Hono](https://hono.dev) app ([`src/server.ts`](src/server.ts)); the walkthrough lives in [`src/demo.ts`](src/demo.ts).

## Deploy

The `/` route serves the playground and the API lives on the same origin, so a browser `fetch(url, { method: "QUERY", … })` is same-origin and needs no preflight. Deploy to **Cloudflare Workers** (its `workerd` runtime parses QUERY natively):

```sh
npx wrangler login      # opens a browser once
npm run deploy          # wrangler deploy → https://query-suite-example.<you>.workers.dev
```

Prefer push-to-deploy? The included [`deploy.yml`](.github/workflows/deploy.yml) deploys on every push to `main` — add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. To iterate locally on the real runtime: `npm run dev:worker`.

## Which runtimes actually parse QUERY?

- ✅ **Edge runtimes** — Cloudflare Workers, Deno, Bun — parse `QUERY` natively over the wire, and **browsers send it natively** too. The hosted playground is a genuine browser → edge QUERY request, no fallback involved.
- ⚠️ **Node's built-in HTTP server** — **can't parse `QUERY` yet** (it isn't in llhttp's method table as of 2026); a QUERY over a real Node socket is rejected `400` before your handler runs. Two ways around it, both shown here:
  1. Drive the handler in-process via Hono's `app.fetch` (`npm run demo`) — a real QUERY, no socket parser in the way.
  2. Use the **POST + `X-HTTP-Method-Override: QUERY`** fallback (`npm start`) that `@danmat/query-fetch` sends and `@danmat/query-server` accepts transparently.

```sh
npm start
# then, in another terminal — the path that works on a Node socket today:
curl http://localhost:8787/stocks/search \
  -H 'content-type: application/json' \
  -H 'x-http-method-override: QUERY' \
  -d '{"sector":"Technology","maxPrice":500,"sort":"marketCapB"}'
```

## The `@danmat` QUERY suite

- [`@danmat/query-fetch`](https://github.com/DanMat/query-fetch) — client for the QUERY method.
- [`@danmat/accept-query`](https://github.com/DanMat/accept-query) — parse/build/negotiate the `Accept-Query` header.
- [`@danmat/query-cache`](https://github.com/DanMat/query-cache) — body-aware response caching.
- [`@danmat/query-server`](https://github.com/DanMat/query-server) — server-side request validation & negotiation.

## License

[MIT](./LICENSE) © Dan Matthew
