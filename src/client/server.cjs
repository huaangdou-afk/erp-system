const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || '';

// Proxy API requests
app.use(express.json());
app.use('/api', (req, res) => {
  const target = `${API_URL}/api${req.path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  const url = new URL(target);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: req.method,
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ERP-Frontend' },
  };
  const proxyReq = http.request(options, (r) => {
    let data = '';
    r.on('data', c => data += c);
    r.on('end', () => {
      try { res.json(JSON.parse(data)); }
      catch { res.status(502).send(data || 'Backend error'); }
    });
  });
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && Object.keys(req.body || {}).length) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.on('error', () => res.status(502).json({ error: 'Backend unavailable' }));
  proxyReq.end();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => console.log(`ERP Frontend on port ${PORT}`));
