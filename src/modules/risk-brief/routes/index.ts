import { Router } from 'express';
import { RiskBriefController } from '../controllers/risk-brief.controller';

const router = Router();
const riskBriefController = new RiskBriefController();

// Risk analysis
router.get('/dashboard', riskBriefController.getRiskDashboard);
router.get('/forecast', riskBriefController.getForecast);
router.get('/calendar', riskBriefController.getActionCalendar);

export { router as riskBriefRoutes };