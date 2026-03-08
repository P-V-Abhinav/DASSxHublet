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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Hublet API is running' });
});

// Scheduler
import { setupScheduler, runManualScrape } from './cron/scheduler';
import { ScrapingService } from './services/scraping.service';
import { exportUsersList } from './utils/export-users';
setupScheduler();

// List available scrapers
app.get('/api/admin/scrapers', async (req, res) => {
    try {
        const scrapers = await ScrapingService.listScrapers();
        res.json({ success: true, scrapers });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin scraping trigger
app.post('/api/admin/trigger-scrape', async (req, res) => {
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
    console.log(`🚀 Hublet API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🕷️  Default scraper: ${process.env.SCRAPER || 'magicbricks-direct'}`);

    // Export users list on startup
    try {
        await exportUsersList();
        console.log('📋 Users list exported to users_list.md');
    } catch (e) { /* db might be empty */ }

    console.log('\n  To trigger a scrape:');
    console.log('  curl -X POST http://localhost:3000/api/admin/trigger-scrape \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"city": "pune", "scraper": "99acres-apify"}\'');
    console.log('\n  To list scrapers: curl http://localhost:3000/api/admin/scrapers\n');
});

export default app;

