import { query, queryJson } from "@danmat/query-fetch";
import { negotiateQuery } from "@danmat/accept-query";
import { QueryCache } from "@danmat/query-cache";
import { app } from "./server.js";

// Node's built-in HTTP server can't parse the brand-new QUERY method yet, so we
// drive the Hono app *in-process* via `app.fetch` — the same Web-standard entry
// point edge runtimes use — and hand it to `query-fetch` as a custom `fetch`.
// A real QUERY request still flows through every package; there's just no socket.
const appFetch = ((input: string | URL | Request, init?: RequestInit) =>
  app.fetch(input instanceof Request ? input : new Request(input, init))) as typeof fetch;

const BASE = "http://screener.local";
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const step = (title: string) => console.log(`\n${bold(title)}`);

async function main() {
  const cache = new QueryCache();
  const filter = { sector: "Technology", maxPrice: 500, sort: "marketCapB" as const };
  const request = {
    url: `${BASE}/stocks/search`,
    body: JSON.stringify(filter),
    headers: { "content-type": "application/json" },
  };

  let networkCalls = 0;
  const fetcher = () => {
    networkCalls++;
    return query(`${BASE}/stocks/search`, { json: filter, fetch: appFetch });
  };

  console.log(dim("screening stocks over the in-process QUERY handler\n"));

  // 1 — @danmat/query-fetch: a QUERY with a structured JSON body.
  step("1) QUERY with a structured filter body (too complex for a URL)");
  const first = await cache.wrap(request, fetcher);
  const firstBody = (await first.clone().json()) as {
    count: number;
    results: { symbol: string }[];
  };
  console.log(`   → ${firstBody.count} matches: ${firstBody.results.map((s) => s.symbol).join(", ")}`);

  // 2 — @danmat/accept-query: negotiate against the server's Accept-Query.
  step("2) Negotiate response format from the server's Accept-Query header");
  const advertised = first.headers.get("accept-query") ?? "";
  const chosen = negotiateQuery(advertised, ["application/cbor", "application/json"]);
  console.log(`   → server advertises "${advertised}"; client picks: ${chosen}`);

  // 3 — @danmat/query-cache: repeat the identical query, served from cache.
  step("3) Identical query again → served from cache, zero extra fetches");
  await cache.wrap(request, fetcher);
  console.log(`   → fetches for two identical queries: ${networkCalls} (cache served the repeat)`);

  // 4 — @danmat/query-server: content-type enforcement.
  step("4) Wrong Content-Type → 415 with an Accept-Query hint");
  const rejected = await query(`${BASE}/stocks/search`, {
    body: "<screen/>",
    contentType: "application/xml",
    fallbackToPost: false,
    fetch: appFetch,
  });
  console.log(`   → HTTP ${rejected.status}; server accepts: ${rejected.headers.get("accept-query")}`);

  // 5 — @danmat/query-fetch fallback: legacy endpoint that 501s on QUERY.
  step("5) Legacy endpoint (501 on QUERY) → automatic POST fallback");
  const fell = await queryJson<{ count: number; servedVia: string }>(
    `${BASE}/legacy/stocks/search`,
    { json: filter, fetch: appFetch },
  );
  console.log(`   → ${fell.data.count} matches, servedVia: ${fell.data.servedVia}`);

  console.log(`\n${bold("All four @danmat packages exercised end-to-end ✔")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
