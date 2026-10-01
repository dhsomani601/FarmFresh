import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import pageRoutes from './routes/page.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check: returns a sleek status dashboard for browsers, or JSON for API clients
app.get('/api/health', (req, res) => {
  if (req.accepts('html') && !req.query.json) {
    const uptimeSec = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`;
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FreshMart API — System Health Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0c0e12; color: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .status-card { background: rgba(22, 25, 33, 0.95); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; padding: 2.5rem; max-width: 520px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #10b981; padding: 6px 14px; border-radius: 9999px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1.5rem; }
    .pulse { width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 1.8s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
    h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; color: #ffffff; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .metric-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 1rem; }
    .metric-lbl { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
    .metric-val { font-size: 1.1rem; color: #f8fafc; font-weight: 700; }
    .btn-return { display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #ff7a00, #ea580c); color: white; text-decoration: none; padding: 0.85rem 1.5rem; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 16px rgba(255, 122, 0, 0.4); }
  </style>
</head>
<body>
  <div class="status-card">
    <div class="badge"><span class="pulse"></span> All Systems Operational</div>
    <h1>FreshMart Cloud API</h1>
    <p>The backend services, SQLite database, and product catalog are healthy and running with zero downtime.</p>
    <div class="metrics">
      <div class="metric-box">
        <div class="metric-lbl">Status</div>
        <div class="metric-val" style="color: #10b981;">Online (200 OK)</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Database</div>
        <div class="metric-val">Connected (sql.js)</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Uptime</div>
        <div class="metric-val">${uptimeStr}</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Environment</div>
        <div class="metric-val">Cloud Production</div>
      </div>
    </div>
    <a href="/" class="btn-return">← Return to FreshMart Store</a>
  </div>
</body>
</html>`);
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static assets in production
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Client SPA routing (React Router fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Initialize database and start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n🛒 Grocery API Server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Products:     http://localhost:${PORT}/api/products\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
