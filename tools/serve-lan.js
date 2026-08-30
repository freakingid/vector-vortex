// tools/serve-lan.js — a zero-dependency static file server, bound to every
// interface, for the one thing `file://` cannot do: load a page on a phone.
//
// Not shipped code, not a design instrument itself — just what CS002 P4's
// on-hardware pass needs to reach `tools/feel-lab.html` (and `dist/`) from a
// phone on the same LAN. `file://` on a phone is not a test (CLAUDE.md).
//
//   node tools/serve-lan.js [port]      # default port 8080
//
// Serves the repo root read-only. Prints every non-loopback IPv4 address so
// the phone's browser has something to type.
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.argv[2]) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (reqPath === "/") reqPath = "/tools/feel-lab.html";
  const filePath = path.normalize(path.join(ROOT, reqPath));
  // ⛔ Never serve outside ROOT — decoded ".." must not escape it.
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found: " + reqPath); return; }
    const type = TYPES[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}/tools/feel-lab.html`);
  console.log(`  http://localhost:${PORT}/dist/vector-vortex.html`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`  http://${net.address}:${PORT}/tools/feel-lab.html   <- phone, same Wi-Fi`);
        console.log(`  http://${net.address}:${PORT}/dist/vector-vortex.html`);
      }
    }
  }
});
