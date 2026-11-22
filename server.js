// Local runner for the BRTI monitor.
// Serves the site and proxies /kalshi/* to Kalshi's public API, which rejects
// browser requests (any Origin header gets a 403) but accepts server-side ones.
// Usage: node server.js   then open http://localhost:8000/brti-monitor.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = +process.env.PORT || 8000;
const ROOT = __dirname;
const KALSHI = 'https://api.elections.kalshi.com/trade-api/v2';
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/kalshi/')) {
    try {
      const r = await fetch(KALSHI + url.pathname.slice('/kalshi'.length) + url.search, {headers: {accept: 'application/json'}});
      res.writeHead(r.status, {'content-type': 'application/json', 'cache-control': 'no-store'});
      res.end(await r.text());
    } catch (e) {
      res.writeHead(502, {'content-type': 'application/json'});
      res.end(JSON.stringify({error: String(e)}));
    }
    return;
  }
  const file = path.join(ROOT, path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '') || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store'});
    res.end(data);
  });
}).listen(PORT, () => console.log(`BRTI monitor: http://localhost:${PORT}/brti-monitor.html`));
