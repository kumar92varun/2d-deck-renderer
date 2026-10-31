/* Tiny static file server rooted at the repo root, so scenes can load ES modules, WebAssembly and JSON
   (Chrome blocks those from file:// pages). Used by render.mjs and by `npm run preview`. */
import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".wasm": "application/wasm", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".mp4": "video/mp4",
  ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

export function startServer(port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p === "/__themes") {                                   // theme list for the preview dropdown
        const dir = path.join(ROOT, "video/themes"), names = [];
        for (const n of await readdir(dir)) if (await stat(path.join(dir, n, "theme.js")).catch(() => null)) names.push(n);
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(names.sort()));
        return;
      }
      let file = path.join(ROOT, p);
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    } catch { res.writeHead(404).end("not found"); }
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => {
    const { port: p } = server.address();
    resolve({ server, port: p, urlFor: (abs) => `http://127.0.0.1:${p}/` + path.relative(ROOT, abs).split(path.sep).map(encodeURIComponent).join("/") });
  }));
}

// `node core/server.mjs [port]` → preview server for opening scenes in a normal browser.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { port } = await startServer(Number(process.argv[2] || 5173));
  console.log(`Preview server: http://127.0.0.1:${port}/video/   (Ctrl+C to stop)`);
}
