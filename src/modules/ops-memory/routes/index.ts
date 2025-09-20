import { Router } from 'express';
import { OpsMemoryController } from '../controllers/ops-memory.controller';

const router = Router();
const opsMemoryController = new OpsMemoryController();

// Historical data queries
router.get('/patterns', opsMemoryController.getPatterns);
router.get('/trends', opsMemoryController.getTrends);
router.get('/insights', opsMemoryController.getInsights);

// Data export
router.get('/export', opsMemoryController.exportData);

export { router as opsMemoryRoutes };