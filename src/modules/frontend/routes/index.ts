import { Router } from 'express';
import { FrontendController } from '../controllers/frontend.controller';

const router = Router();
const frontendController = new FrontendController();

// Frontend routes
router.get('/', frontendController.getHomePage);
router.get('/dashboard', frontendController.getDashboard);
router.get('/test', frontendController.getTestPage);
router.get('/ticket-detail', frontendController.getTicketDetailPage);
router.get('/reports', frontendController.getReportsPage);

export { router as frontendRoutes };