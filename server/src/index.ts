import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import communicationRoutes from './routes/communication.js';
import healthcareRoutes from './routes/healthcare.js';
import medicationRoutes from './routes/medication.js';
import ngoRoutes from './routes/ngo.js';
import sosRoutes from './routes/sos.js';
import shelterRoutes from './routes/shelters.js';
import volunteerRoutes from './routes/volunteers.js';
import analyticsRoutes from './routes/analytics.js';
import providerRoutes from './routes/providers.js';
import routingRoutes from './routes/routing.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AidLine API', timestamp: new Date().toISOString() });
});

// API Routes - Operational Pipeline
app.use('/api/auth', authRoutes);              // User management
app.use('/api/requests', requestRoutes);        // 1. Request Entry + 2. AI Triage + 3. Routing
app.use('/api/routing', routingRoutes);         // 3. Service Routing Engine
app.use('/api/communication', communicationRoutes); // 4. Secure Communication
app.use('/api/healthcare', healthcareRoutes);   // 5. Healthcare Service Interaction
app.use('/api/medication', medicationRoutes);   // 6. Medication Coordination
app.use('/api/ngo', ngoRoutes);                 // 7. NGO Assistance Workflow
app.use('/api/sos', sosRoutes);                 // SOS Alerts
app.use('/api/shelters', shelterRoutes);        // Shelters
app.use('/api/volunteers', volunteerRoutes);    // Volunteers
app.use('/api/analytics', analyticsRoutes);     // 8. Crisis Intelligence + 9. Institutional
app.use('/api/providers', providerRoutes);      // Service Providers management

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`AidLine API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  await testConnection();
});

export default app;
