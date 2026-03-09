import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import buyerRoutes from './routes/buyer.routes';
import sellerRoutes from './routes/seller.routes';
import propertyRoutes from './routes/property.routes';
import leadRoutes from './routes/lead.routes';
import matchingRoutes from './routes/matching.routes';
import workflowEventRoutes from './routes/workflow-event.routes';
import authRoutes from './routes/auth.routes';
import { authenticateJwt, requireRoles } from './middleware/auth.middleware';
import { sanitizeResponsePayload } from './utils/response-sanitizer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow origins from env, comma-separated, fallback to localhost for dev.
// Each entry can be:
//   - an exact origin:  https://dass-hublet-frontend.vercel.app
//   - a wildcard glob:  *.vercel.app  (matches all Vercel preview deployments)
//   - a bare wildcard:  *             (allow all — dev only)
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

/** Returns true if `origin` matches an allowed entry (exact or *.domain glob). */
function isOriginAllowed(origin: string): boolean {
  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed === '*') return true;
    if (allowed === origin) return true;
    // Wildcard prefix: *.example.com matches anything.example.com (http or https)
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1); // e.g. ".vercel.app"
      try {
        const { hostname } = new URL(origin);
        if (hostname.endsWith(suffix)) return true;
      } catch { /* invalid URL, skip */ }
    }
  }
  return false;
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Render health checks, mobile apps, etc.)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => originalJson(sanitizeResponsePayload(body))) as typeof res.json;
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Hublet API is running' });
});

// Public authentication routes
app.use('/api/auth', authRoutes);

// Python environment debug endpoint (no auth — diagnostic only)
app.get('/api/admin/debug-python', (req, res) => {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const results: Record<string, string> = {};

    const run = (cmd: string) => {
        try { return execSync(cmd, { timeout: 5000 }).toString().trim(); }
        catch (e: any) { return `ERROR: ${e.message}`; }
    };

    const scraperDir = path.join(process.cwd(), 'scraper');
    const venvPython = path.join(scraperDir, 'venv/bin/python');
    const resolvedPython = fs.existsSync(venvPython)
        ? venvPython
        : (process.env.PYTHON_PATH || 'python3');

    results['__dirname'] = __dirname;
    results['process_cwd'] = process.cwd();
    results['PYTHON_PATH_env'] = process.env.PYTHON_PATH || '(not set)';
    results['resolved_python'] = resolvedPython;
    results['venv_python_exists'] = fs.existsSync(venvPython) ? 'YES' : 'NO';
    results['venv_python_path'] = venvPython;
    results['scraper_dir'] = scraperDir;
    results['scraper_dir_exists'] = fs.existsSync(scraperDir) ? 'YES' : 'NO';
    results['scraper_py_exists'] = fs.existsSync(path.join(scraperDir, 'scraper.py')) ? 'YES' : 'NO';
    results['which_python3'] = run('which python3');
    results['python3_version'] = run('python3 --version');
    results['requests_check'] = run(`${resolvedPython} -c "import requests; print('requests OK:', requests.__version__)"`);
    results['sys_path'] = run(`${resolvedPython} -c "import sys; print(sys.path)"`);

    res.json(results);
});

// All other /api routes are protected by JWT
app.use('/api', authenticateJwt);

// Scheduler
import { setupScheduler, runManualScrape } from './cron/scheduler';
import { ScrapingService } from './services/scraping.service';
import { exportUsersList } from './utils/export-users';
setupScheduler();

// List available scrapers
app.get('/api/admin/scrapers', requireRoles('admin'), async (req, res) => {
    try {
        const scrapers = await ScrapingService.listScrapers();
        res.json({ success: true, scrapers });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin scraping trigger
app.post('/api/admin/trigger-scrape', requireRoles('admin'), async (req, res) => {
    const { city, scraper } = req.body;
    try {
        const results = await runManualScrape(city, scraper);
        // Auto-export users list after scrape
        try { await exportUsersList(); } catch (e) { /* ignore */ }
        res.json({ success: true, results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Routes
app.use('/api/buyers', buyerRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/matches', matchingRoutes);
app.use('/api/workflow-events', workflowEventRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    console.log(`🚀 Hublet API server running on port ${PORT}`);
    console.log(`📍 Health check: ${baseUrl}/health`);
    console.log(`🕷️  Default scraper: ${process.env.SCRAPER || 'magicbricks-direct'}`);
    console.log(`🌐 Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);

    // Export users list on startup
    try {
        await exportUsersList();
        console.log('📋 Users list exported to users_list.md');
    } catch (e) { /* db might be empty */ }

    console.log('\n  To trigger a scrape:');
    console.log(`  curl -X POST ${baseUrl}/api/admin/trigger-scrape \\`);
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"city": "pune", "scraper": "99acres-apify"}\'');
    console.log(`\n  To list scrapers: curl ${baseUrl}/api/admin/scrapers\n`);
});

export default app;
