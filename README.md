# query-suite-example

[![CI](https://github.com/DanMat/query-suite-example/actions/workflows/ci.yml/badge.svg)](https://github.com/DanMat/query-suite-example/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A small, runnable example that wires together the **`@danmat` HTTP QUERY suite** ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)) into one story: a **stock screener** whose filter is too rich for a URL, so it travels in the request body — exactly what the QUERY method is for.

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

## A real note about running QUERY on Node

Node's built-in HTTP server **can't parse the `QUERY` method yet** — it isn't in the parser's method table as of 2026, so a QUERY request over a real socket is rejected with `400` before your handler ever runs. There are two honest ways to deal with that, and this repo shows both:

1. **In-process / edge runtimes** (`npm run demo`) drive the handler through Hono's Web-standard `app.fetch`, where a genuine QUERY request flows through the whole stack — no socket parser in the way. This is how Cloudflare Workers, Deno, Bun, and tests operate.
2. **Real Node socket** (`npm start`) relies on the **POST + `X-HTTP-Method-Override: QUERY`** fallback that `@danmat/query-fetch` sends automatically and `@danmat/query-server` accepts transparently. Your application code uses QUERY; the wire quietly uses POST until runtimes catch up.

```sh
npm start
# then, in another terminal — the path that works on Node today:
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
