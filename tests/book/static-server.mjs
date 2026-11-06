/* Tiny static server that mimics vercel.json cleanUrls (/book -> book.html, /book/manage -> book/manage.html). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };

export function startServer() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index';
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    for (const c of [file, file + '.html']) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        res.writeHead(200, { 'content-type': TYPES[path.extname(c)] || 'application/octet-stream' });
        return fs.createReadStream(c).pipe(res);
      }
    }
    res.writeHead(404); res.end('not found');
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}
