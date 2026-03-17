import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import requestRoutes from './routes/requests.js';
import triageRoutes from './routes/triage.js';
import routingRoutes from './routes/routing.js';
import messagingRoutes from './routes/messaging.js';
import analyticsRoutes from './routes/analytics.js';
import providerRoutes from './routes/providers.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.SERVER_PORT || '3001');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'aidline-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/providers', providerRoutes);

async function start() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('Warning: MySQL not available. Server starting without database.');
  }

  app.listen(PORT, () => {
    console.log(`AidLine API server running on port ${PORT}`);
  });
}

start();
