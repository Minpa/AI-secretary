import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();
const reportController = new ReportController();

// Report generation
router.post('/generate', reportController.generateReport);
router.get('/templates', reportController.getTemplates);
router.get('/:id', reportController.getReport);
router.get('/:id/download', reportController.downloadReport);

export { router as reportsRoutes };