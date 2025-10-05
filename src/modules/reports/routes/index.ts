import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { UnitAnalyticsController } from '../controllers/unit-analytics.controller';
import { cacheMetricsController } from '../controllers/cache-metrics.controller';

const router = Router();
const reportController = new ReportController();
const unitAnalyticsController = new UnitAnalyticsController();

// Report generation
router.post('/generate', reportController.generateReport);
router.get('/templates', reportController.getTemplates);

// Analytics endpoints (must be before /:id route)
router.get('/analytics/summary', reportController.getAnalyticsSummary);
router.get('/analytics/trends', reportController.getTrends);
router.get('/keyword-analysis', reportController.getKeywordAnalysis);

// Unit analytics endpoints (must be before /:id route)
router.get('/units/analytics', unitAnalyticsController.getUnitAnalytics.bind(unitAnalyticsController));
router.get('/units/:dong/:ho/history', unitAnalyticsController.getUnitHistory.bind(unitAnalyticsController));
router.get('/units/export', unitAnalyticsController.exportUnitAnalytics.bind(unitAnalyticsController));

// Generic ID-based routes (must be after specific routes)
router.get('/:id', reportController.getReport);
router.get('/:id/download', reportController.downloadReport);

// Cache management endpoints
router.get('/cache/stats', cacheMetricsController.getCacheStats.bind(cacheMetricsController));
router.post('/cache/clear', cacheMetricsController.clearCache.bind(cacheMetricsController));
router.post('/cache/cleanup', cacheMetricsController.cleanupCache.bind(cacheMetricsController));

export { router as reportsRoutes };