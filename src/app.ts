import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import { errorHandler } from '@/shared/middleware/error-handler';
import { requestLogger } from '@/shared/middleware/request-logger';

// Module routes
import { intakeHubRoutes } from '@/modules/intake-hub';
import { ticketingRoutes } from '@/modules/ticketing';
import { opsMemoryRoutes } from '@/modules/ops-memory';
import { reportsRoutes } from '@/modules/reports';
import { erpReaderRoutes } from '@/modules/erp-reader';
import { riskBriefRoutes } from '@/modules/risk-brief';
import { adminRoutes } from '@/modules/admin';
import { frontendRoutes } from '@/modules/frontend';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Frontend routes
app.use('/', frontendRoutes);

// API routes
app.use('/api/intake', intakeHubRoutes);
app.use('/api/tickets', ticketingRoutes);
app.use('/api/ops-memory', opsMemoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/erp', erpReaderRoutes);
app.use('/api/risk', riskBriefRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.server.port || 3000;

app.listen(PORT, () => {
  logger.info(`AI Secretary server running on port ${PORT}`);
});

export default app;