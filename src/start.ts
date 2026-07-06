import { serve } from "@hono/node-server";
import { app } from "./server.js";

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  const base = `http://localhost:${info.port}`;
  console.log(`Stock screener listening on ${base}`);
  console.log("");
  // Node's HTTP server can't parse the QUERY method yet, so over a real socket
  // use the POST + X-HTTP-Method-Override fallback that @danmat/query-server
  // accepts transparently. (In-process / edge runtimes can use QUERY directly —
  // see `npm run demo`.)
  console.log("Try (POST + method override — the path that works on Node today):");
  console.log(
    `  curl ${base}/stocks/search \\\n` +
      `    -H 'content-type: application/json' \\\n` +
      `    -H 'x-http-method-override: QUERY' \\\n` +
      `    -d '{"sector":"Technology","maxPrice":500,"sort":"marketCapB"}'`,
  );
});
