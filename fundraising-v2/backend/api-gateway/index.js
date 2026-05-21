// api-gateway/index.js
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const jwt     = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = express();

// ── CORS: allow React dev server ───────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'fundraising_secret_key';

// ── Service base URLs ───────────────────────────────────────────────────────
const SVC = {
  user:     process.env.USER_SERVICE_URL         || 'http://localhost:3001',
  claim:    process.env.CLAIM_SERVICE_URL        || 'http://localhost:3002',
  donation: process.env.DONATION_SERVICE_URL     || 'http://localhost:3003',
  notify:   process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
  admin:    process.env.ADMIN_SERVICE_URL        || 'http://localhost:3005',
};

// ── JWT middleware ──────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid or expired token' }); }
};

const requireAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

// ── Forward helper (pure Node http — no extra packages needed) ─────────────
function forward(targetBase, stripPrefix) {
  return (req, res) => {
    const url    = new URL(targetBase);
    const path   = req.originalUrl.replace(stripPrefix, '');
    const body   = JSON.stringify(req.body);
    const isBody = ['POST','PUT','PATCH'].includes(req.method);

    const options = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     path || '/',
      method:   req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(isBody ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(req.headers['authorization']
          ? { Authorization: req.headers['authorization'] } : {}),
      },
    };

    const proxy = http.request(options, svcRes => {
      res.status(svcRes.statusCode);
      svcRes.pipe(res, { end: true });
    });

    proxy.on('error', err => {
      console.error(`❌ Service error [${targetBase}]:`, err.message);
      res.status(502).json({
        error: 'Service unavailable. Make sure all backend services are running.',
        detail: err.message
      });
    });

    if (isBody) proxy.write(body);
    proxy.end();
  };
}

// ── PUBLIC routes ───────────────────────────────────────────────────────────
app.all('/api/auth/*',             forward(SVC.user,     '/api'));
app.all('/api/claims/approved',    forward(SVC.claim,    '/api'));

// ── Protected routes ────────────────────────────────────────────────────────
app.all('/api/claims/*',           authenticate, forward(SVC.claim,    '/api'));
app.all('/api/claims',             authenticate, forward(SVC.claim,    '/api'));
app.all('/api/donations/stats',    authenticate, forward(SVC.donation, '/api'));
app.all('/api/donations/*',        authenticate, forward(SVC.donation, '/api'));
app.all('/api/donations',          authenticate, forward(SVC.donation, '/api'));
app.all('/api/messages/*',         authenticate, forward(SVC.notify,   '/api'));
app.all('/api/messages',           authenticate, forward(SVC.notify,   '/api'));

// ── Admin routes ────────────────────────────────────────────────────────────
app.all('/api/admin/users/*',       requireAdmin, forward(SVC.user,  '/api/admin'));
app.all('/api/admin/users',         requireAdmin, forward(SVC.user,  '/api/admin'));
app.all('/api/admin/stats',         requireAdmin, forward(SVC.admin, '/api/admin'));
app.all('/api/admin/departments/*', requireAdmin, forward(SVC.admin, '/api/admin'));
app.all('/api/admin/departments',   requireAdmin, forward(SVC.admin, '/api/admin'));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'OK', gateway: 'running', services: SVC,
  timestamp: new Date().toISOString()
}));

const PORT = process.env.GATEWAY_PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway  →  http://localhost:${PORT}`);
  console.log('📡 Services:');
  Object.entries(SVC).forEach(([k, v]) => console.log(`   ${k.padEnd(10)}: ${v}`));
});
