import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.VITE_API_URL || '';

// Proxy API requests
app.use(express.json());
app.use('/api', async (req, res) => {
  const target = `${API_URL}/api${req.path}`;
  try {
    const http = await import('node:http');
    const url = new URL(target);
    const options = { method: req.method, hostname: url.hostname, port: url.port || 80, path: url.pathname + url.search, headers: { 'Content-Type': 'application/json', 'User-Agent': 'ERP-Frontend' } };
    const proxyReq = http.request(options, (r) => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => {
        try { res.json(JSON.parse(data)); }
        catch { res.send(data); }
      });
    });
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && Object.keys(req.body || {}).length) {
      proxyReq.write(JSON.stringify(req.body));
    }
    proxyReq.end();
  } catch {
    res.status(502).json({ error: 'Backend unavailable' });
  }
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
