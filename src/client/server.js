const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_BASE = process.env.VITE_API_URL || 'https://erp-backend-production-f9b4.up.railway.app';
const DIST = path.join(__dirname, 'dist');

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Proxy API requests to backend
  if (urlPath.startsWith('/api')) {
    const options = {
      hostname: new URL(API_BASE).hostname,
      port: 443,
      path: '/api' + req.url.replace('/api', ''),
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ERP-Frontend-Server/1.0',
      },
    };
    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    req.pipe(proxyReq);
    proxyReq.on('error', () => res.writeHead(502).end('Backend unavailable'));
    return;
  }

  // Serve static files
  let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`ERP Frontend running on port ${PORT}`);
});
