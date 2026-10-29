// Local preview: node dev.js  ->  http://localhost:3000  (editor at /admin)
// Uses an in-memory copy of the data. Set ADMIN_PASSWORD to try the editor:
//   ADMIN_PASSWORD=test node dev.js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import plan from "./api/plan.js";
import session from "./api/session.js";

const routes = { "/api/plan": plan, "/api/session": session };
const types = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".js": "text/javascript" };
const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
  if (routes[url.pathname]) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = undefined; }
    return routes[url.pathname](req, res);
  }
  let file = url.pathname === "/" || url.pathname === "/admin" ? "/index.html" : url.pathname;
  file = path.join(process.cwd(), path.normalize(file).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(process.cwd()) || !fs.existsSync(file) || file.includes(`${path.sep}api${path.sep}`)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Tracker running at http://localhost:${PORT}  (editor: /admin)`));
