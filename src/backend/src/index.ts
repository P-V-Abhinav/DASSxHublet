import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
app.listen(PORT, () => {
  console.log(`🚀 Hublet API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
