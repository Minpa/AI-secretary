import { Router } from 'express';
import { IntakeController } from '../controllers/intake.controller';

const router = Router();
const intakeController = new IntakeController();

// Message intake endpoints
router.post('/sms', intakeController.handleSMS);
router.post('/email', intakeController.handleEmail);
router.post('/web', intakeController.handleWeb);
router.post('/call', intakeController.handleCall);

// Message management
router.get('/messages', intakeController.getMessages);
router.get('/messages/:id', intakeController.getMessage);
router.patch('/messages/:id/classify', intakeController.classifyMessage);
router.patch('/messages/:id/status', intakeController.updateStatus);

// Dashboard stats
router.get('/stats', intakeController.getStats);

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API is working', timestamp: new Date() });
});

export { router as intakeHubRoutes };