import http from "node:http";

const PORT = process.env.PORT || 8080;
const APP_NAME = process.env.APP_NAME || "Graduation Demo";
const GIT_SHA = process.env.GIT_SHA || "development";
const BUILD_TIME = process.env.BUILD_TIME || "not set (running from source)";
const ENVIRONMENT = process.env.APP_ENV || (GIT_SHA === "development" ? "Replit (source)" : "Docker container");
const SHORT_SHA = GIT_SHA.slice(0, 7);

const STARTED_AT = new Date();

// In-memory app state so the page feels like a real, live application.
// (Resets when the container restarts — which is itself part of the demo.)
let deployCount = 0;
const guestbook = [];

function page() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${APP_NAME}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at 15% 15%, #1e3a5f 0%, #0b1120 55%, #05070d 100%);
      color: #e6edf6;
      padding: 32px 20px;
    }
    .shell { width: 100%; max-width: 720px; display: grid; gap: 20px; }
    .card {
      background: rgba(17, 25, 40, 0.72);
      border: 1px solid rgba(120, 160, 220, 0.18);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(12px);
    }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .badge {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
      color: #7cc4ff; background: rgba(56, 132, 255, 0.12);
      border: 1px solid rgba(56, 132, 255, 0.3);
      padding: 6px 12px; border-radius: 999px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #35d07f; box-shadow: 0 0 12px #35d07f; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    h1 { font-size: 30px; font-weight: 700; margin: 18px 0 8px; }
    p.lede { color: #9fb2ca; font-size: 15px; line-height: 1.55; }
    code { color: #9fb2ca; font-family: ui-monospace, "SFMono-Regular", monospace; }
    .clock { font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; font-size: 13px; color: #7cffb2; }

    .demo { display: grid; gap: 16px; }
    .demo h2 { font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #8496ad; }
    .counter { display: flex; align-items: center; gap: 16px; }
    .count { font-size: 44px; font-weight: 700; font-variant-numeric: tabular-nums; min-width: 90px; }
    button {
      font: inherit; font-weight: 600; cursor: pointer;
      color: #05070d; background: #7cc4ff; border: none;
      padding: 10px 18px; border-radius: 10px; transition: transform .05s ease, background .15s ease;
    }
    button:hover { background: #a7d8ff; }
    button:active { transform: translateY(1px); }
    button.ghost { background: rgba(120,160,220,0.14); color: #e6edf6; }
    button.ghost:hover { background: rgba(120,160,220,0.24); }
    .gb { display: flex; gap: 10px; }
    .gb input {
      flex: 1; font: inherit; color: #e6edf6;
      background: rgba(9,14,24,0.6); border: 1px solid rgba(120,160,220,0.18);
      border-radius: 10px; padding: 10px 14px;
    }
    .gb input:focus { outline: none; border-color: #7cc4ff; }
    ul.list { list-style: none; display: grid; gap: 8px; margin-top: 4px; }
    ul.list li { background: rgba(9,14,24,0.5); border: 1px solid rgba(120,160,220,0.12); border-radius: 10px; padding: 10px 14px; font-size: 14px; }
    ul.list li .who { color: #7cc4ff; }
    .empty { color: #64748b; font-size: 13px; }

    dl { display: grid; gap: 10px; }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 14px; background: rgba(9,14,24,0.6); border: 1px solid rgba(120,160,220,0.12); border-radius: 12px; }
    dt { color: #8496ad; font-size: 13px; }
    dd { font-family: ui-monospace, monospace; font-size: 14px; color: #e6edf6; text-align: right; word-break: break-all; }
    .sha { color: #7cffb2; }
    footer { font-size: 12px; color: #64748b; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="shell">
    <main class="card">
      <div class="top">
        <span class="badge"><span class="dot"></span> Live &middot; ${ENVIRONMENT}</span>
        <span class="clock" id="clock">uptime 0s</span>
      </div>
      <h1>${APP_NAME}</h1>
      <p class="lede">A real little app that you build on Replit, ship to GitHub, and graduate into a Docker container. Everything below runs client-side against this server &mdash; try it, then watch the version stamp change after your next deploy.</p>
    </main>

    <section class="card demo">
      <h2>Interactive demo</h2>
      <div class="counter">
        <span class="count" id="count">0</span>
        <button id="inc">+1</button>
        <button class="ghost" id="reset">Reset</button>
      </div>

      <h2 style="margin-top:8px">Guestbook (in-memory)</h2>
      <form class="gb" id="gbForm">
        <input id="gbInput" placeholder="Leave a note…" maxlength="60" autocomplete="off" />
        <button type="submit">Sign</button>
      </form>
      <ul class="list" id="gbList"></ul>
    </section>

    <section class="card">
      <h2 style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#8496ad;margin-bottom:14px">Deployment version</h2>
      <dl>
        <div class="row"><dt>Commit</dt><dd class="sha">${SHORT_SHA}</dd></div>
        <div class="row"><dt>Full SHA</dt><dd>${GIT_SHA}</dd></div>
        <div class="row"><dt>Image built at</dt><dd>${BUILD_TIME}</dd></div>
        <div class="row"><dt>Started</dt><dd>${STARTED_AT.toISOString()}</dd></div>
        <div class="row"><dt>Port</dt><dd>${PORT}</dd></div>
      </dl>
      <footer style="margin-top:20px">
        Replit &rarr; GitHub &rarr; GitHub Actions &rarr; GHCR &rarr; Docker Desktop.<br />
        Health check at <code>/healthz</code> &middot; state API at <code>/api/state</code>.
      </footer>
    </section>
  </div>

  <script>
    const started = ${STARTED_AT.getTime()};
    const clock = document.getElementById("clock");
    function fmt(s){ const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60; return (h?h+"h ":"")+(h||m?m+"m ":"")+x+"s"; }
    setInterval(() => { clock.textContent = "uptime " + fmt(Math.floor((Date.now()-started)/1000)); }, 1000);

    const countEl = document.getElementById("count");
    async function refresh(){
      const r = await fetch("api/state"); const s = await r.json();
      countEl.textContent = s.count;
      const list = document.getElementById("gbList");
      if (!s.guestbook.length) { list.innerHTML = '<li class="empty">No notes yet — be the first.</li>'; return; }
      list.innerHTML = s.guestbook.map(g => '<li><span class="who">'+g.at+'</span> — '+g.text+'</li>').join("");
    }
    document.getElementById("inc").onclick = async () => { await fetch("api/count",{method:"POST"}); refresh(); };
    document.getElementById("reset").onclick = async () => { await fetch("api/count?reset=1",{method:"POST"}); refresh(); };
    document.getElementById("gbForm").onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById("gbInput");
      const text = input.value.trim(); if (!text) return;
      await fetch("api/guestbook",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text})});
      input.value = ""; refresh();
    };
    refresh();
  </script>
</body>
</html>`;
}

function json(res, code, body) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function state() {
  return { count: deployCount, guestbook: guestbook.slice(-20).reverse() };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path === "/healthz") {
    return json(res, 200, { status: "ok", sha: GIT_SHA, buildTime: BUILD_TIME, uptimeSeconds: Math.floor((Date.now() - STARTED_AT.getTime()) / 1000) });
  }

  if (path.endsWith("/api/state")) {
    return json(res, 200, state());
  }

  if (path.endsWith("/api/count") && req.method === "POST") {
    if (url.searchParams.get("reset")) deployCount = 0;
    else deployCount += 1;
    return json(res, 200, state());
  }

  if (path.endsWith("/api/guestbook") && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 2000) req.destroy(); });
    req.on("end", () => {
      let text = "";
      try { text = String(JSON.parse(raw || "{}").text || "").slice(0, 60); } catch { /* ignore */ }
      text = text.replace(/[<>]/g, "");
      if (text) guestbook.push({ text, at: new Date().toLocaleTimeString() });
      json(res, 200, state());
    });
    return;
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page());
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`${APP_NAME} listening on http://0.0.0.0:${PORT} (sha=${SHORT_SHA}, built=${BUILD_TIME}, env=${ENVIRONMENT})`);
});
