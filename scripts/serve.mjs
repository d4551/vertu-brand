#!/usr/bin/env bun

import { join } from "bun:path";

const root = import.meta.dir.replace(/\/scripts$/, "");
const port = parseInt(Bun.argv.find((_, i, a) => a[i - 1] === "-l" || a[i - 1] === "--listen") ?? "3000", 10);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

function getMime(path) {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

Bun.serve({
  port,
  async fetch(req) {
    let pathname = new URL(req.url).pathname;

    // SPA fallback: serve index.html for directory requests
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = join(root, pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(root)) {
      return new Response("Forbidden", { status: 403 });
    }

    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: { "Content-Type": getMime(filePath) },
      });
    }

    // SPA fallback: serve index.html for missing routes
    const indexFile = Bun.file(join(root, "index.html"));
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Serving ${root} on http://localhost:${port}`);
