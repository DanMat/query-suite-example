import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  checkQueryRequest,
  readQueryJson,
  withAcceptQuery,
} from "@danmat/query-server";
import { searchStocks, type StockFilter } from "./data.js";

/** Query-body formats this API understands. */
const ACCEPTED = ["application/json"];

export const app = new Hono();

// QUERY isn't a CORS-safelisted method, so a cross-origin call triggers a
// preflight (RFC 10008 §CORS). Allow QUERY (and the POST-override fallback) so
// the API is usable from any origin, including the hosted playground.
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["QUERY", "POST", "OPTIONS"],
    allowHeaders: ["content-type", "x-http-method-override"],
  }),
);

/**
 * A modern screener endpoint that speaks QUERY natively — and, thanks to
 * `@danmat/query-server`'s method-override handling, also accepts the
 * `POST` + `X-HTTP-Method-Override: QUERY` fallback clients use.
 */
app.on(["QUERY", "POST"], "/stocks/search", async (c) => {
  const request = c.req.raw;

  // Reject non-QUERY / missing / unsupported Content-Type with the right status.
  const rejection = checkQueryRequest(request, { accept: ACCEPTED });
  if (rejection) return withAcceptQuery(rejection, ACCEPTED);

  const filter = await readQueryJson<StockFilter>(request);
  const results = searchStocks(filter);

  // Advertise the accepted query formats on the way out.
  return withAcceptQuery(
    Response.json({ count: results.length, results }),
    ACCEPTED,
  );
});

/**
 * A "legacy" endpoint that has NOT implemented QUERY. It answers `501` so we
 * can demonstrate the client's automatic POST fallback, then serves the query
 * over the override on POST.
 */
app.on("QUERY", "/legacy/stocks/search", (c) =>
  c.text("QUERY is not implemented on this legacy endpoint", 501),
);

app.post("/legacy/stocks/search", async (c) => {
  const filter = await readQueryJson<StockFilter>(c.req.raw);
  const results = searchStocks(filter);
  return Response.json({ count: results.length, results, servedVia: "POST-fallback" });
});
