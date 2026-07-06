import { app } from "./server.js";
import { PLAYGROUND_HTML } from "./playground.js";

// Serve the interactive playground at the root. It's same-origin with the API,
// and CORS is configured in server.ts for cross-origin callers too.
app.get("/", (c) => c.html(PLAYGROUND_HTML));

// A Hono app is a `{ fetch }` handler — exactly a Cloudflare Worker module.
export default app;
