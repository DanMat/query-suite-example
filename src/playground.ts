/** Self-contained HTML playground served at `/` by the Worker. */
export const PLAYGROUND_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>@danmat QUERY suite — live demo</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: #0b0f17; color: #e7edf5; padding: 2rem 1rem;
  }
  main { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  .sub { color: #8ea1b8; margin: 0 0 1.5rem; }
  code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .card { background: #121826; border: 1px solid #222e42; border-radius: 12px; padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
  label { display: block; font-size: .8rem; color: #8ea1b8; margin-bottom: .3rem; }
  .row { display: flex; gap: .75rem; flex-wrap: wrap; }
  .row > div { flex: 1 1 150px; }
  select, input {
    width: 100%; background: #0b0f17; color: #e7edf5; border: 1px solid #2b3a53;
    border-radius: 8px; padding: .5rem .6rem; font: inherit;
  }
  button {
    margin-top: 1rem; background: #3b82f6; color: white; border: 0; border-radius: 8px;
    padding: .6rem 1.1rem; font: inherit; font-weight: 600; cursor: pointer;
  }
  button:hover { background: #2f6fe0; }
  .tag { display: inline-block; font-size: .72rem; padding: .12rem .5rem; border-radius: 999px; background: #1c2740; color: #9db4d6; margin-right: .35rem; }
  pre { margin: .5rem 0 0; padding: .75rem; background: #0b0f17; border: 1px solid #222e42; border-radius: 8px; overflow: auto; font-size: .82rem; }
  table { width: 100%; border-collapse: collapse; margin-top: .5rem; font-size: .9rem; }
  th, td { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid #1c2740; }
  th { color: #8ea1b8; font-weight: 600; }
  .hint { color: #8ea1b8; font-size: .82rem; }
  a { color: #7fb0ff; }
  .err { color: #ff9a9a; }
</style>
</head>
<body>
<main>
  <h1>@danmat QUERY suite <span class="tag">RFC 10008</span></h1>
  <p class="sub">This page sends a real HTTP <code>QUERY</code> request to a Cloudflare Worker.
    Open <strong>DevTools → Network</strong> and watch the method.</p>

  <div class="card">
    <div class="row">
      <div>
        <label for="sector">Sector</label>
        <select id="sector">
          <option value="">Any</option>
          <option>Technology</option>
          <option>Financials</option>
          <option>Energy</option>
          <option>Healthcare</option>
        </select>
      </div>
      <div>
        <label for="maxPrice">Max price (USD)</label>
        <input id="maxPrice" type="number" value="500" min="0" />
      </div>
      <div>
        <label for="sort">Sort by</label>
        <select id="sort">
          <option value="marketCapB">Market cap</option>
          <option value="price">Price</option>
        </select>
      </div>
    </div>
    <button id="run">Run QUERY ▸</button>
  </div>

  <div class="card">
    <div><span class="tag" id="method-tag">QUERY</span> <code>/stocks/search</code></div>
    <label style="margin-top:.8rem">Request body</label>
    <pre id="req" class="mono">—</pre>
    <label style="margin-top:.8rem">Response <span id="status"></span> · <span class="hint mono" id="aq"></span></label>
    <div id="out"><pre>Run a query to see results.</pre></div>
    <div id="reval" style="display:none;margin-top:1rem;border-top:1px solid #1c2740;padding-top:.9rem">
      <div class="hint">ETag <span class="mono" id="etag"></span></div>
      <button id="revalidate">Revalidate (If-None-Match) ▸</button>
      <span class="mono" id="reval-out" style="margin-left:.6rem"></span>
    </div>
  </div>

  <p class="hint">Powered by
    <a href="https://github.com/DanMat/query-fetch">query-fetch</a>,
    <a href="https://github.com/DanMat/accept-query">accept-query</a>,
    <a href="https://github.com/DanMat/query-cache">query-cache</a>, and
    <a href="https://github.com/DanMat/query-server">query-server</a>.
    Source: <a href="https://github.com/DanMat/query-suite-example">query-suite-example</a>.</p>
</main>

<script type="module">
  const $ = (id) => document.getElementById(id);
  let lastEtag = null;
  let lastFilter = null;

  async function run() {
    const filter = {};
    if ($("sector").value) filter.sector = $("sector").value;
    if ($("maxPrice").value !== "") filter.maxPrice = Number($("maxPrice").value);
    filter.sort = $("sort").value;

    const body = JSON.stringify(filter, null, 2);
    $("req").textContent = body;
    $("out").innerHTML = '<pre>…</pre>';
    $("status").textContent = "";
    $("aq").textContent = "";

    try {
      // A genuine HTTP QUERY request — no library needed in the browser.
      const res = await fetch("/stocks/search", {
        method: "QUERY",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(filter),
      });
      $("method-tag").textContent = res.status < 400 ? "QUERY" : "QUERY ✗";
      $("status").textContent = "HTTP " + res.status;
      const aq = res.headers.get("accept-query");
      if (aq) $("aq").textContent = "Accept-Query: " + aq;

      // Capture the ETag so we can demonstrate revalidation → 304.
      lastEtag = res.headers.get("etag");
      lastFilter = filter;
      if (lastEtag) {
        $("etag").textContent = lastEtag;
        $("reval-out").textContent = "";
        $("reval").style.display = "block";
      } else {
        $("reval").style.display = "none";
      }

      const data = await res.json();
      const rows = (data.results ?? []).map((s) =>
        \`<tr><td class="mono">\${s.symbol}</td><td>\${s.name}</td><td>\${s.sector}</td><td>$\${s.price}</td><td>$\${s.marketCapB}B</td></tr>\`
      ).join("");
      $("out").innerHTML = rows
        ? \`<div class="hint">\${data.count} match(es)</div><table><thead><tr><th>Symbol</th><th>Name</th><th>Sector</th><th>Price</th><th>Mkt cap</th></tr></thead><tbody>\${rows}</tbody></table>\`
        : '<pre>No matches.</pre>';
    } catch (err) {
      $("out").innerHTML = '<pre class="err">Request failed: ' + (err?.message ?? err) +
        '\\n\\nThis runtime may not support the QUERY method.</pre>';
    }
  }

  async function revalidate() {
    if (!lastEtag) return;
    $("reval-out").textContent = "…";
    try {
      // Same query, now with If-None-Match — the server should answer 304.
      const res = await fetch("/stocks/search", {
        method: "QUERY",
        headers: { "content-type": "application/json", "if-none-match": lastEtag },
        body: JSON.stringify(lastFilter),
      });
      $("reval-out").textContent =
        res.status === 304
          ? "→ HTTP 304 Not Modified — representation unchanged ✓"
          : "→ HTTP " + res.status + " (new representation)";
    } catch (err) {
      $("reval-out").textContent = "revalidation failed: " + (err?.message ?? err);
    }
  }

  $("run").addEventListener("click", run);
  $("revalidate").addEventListener("click", revalidate);
  run();
</script>
</body>
</html>`;
