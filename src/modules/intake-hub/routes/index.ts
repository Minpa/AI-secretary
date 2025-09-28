import { Router } from 'express';
import { IntakeController } from '../controllers/intake.controller';
import { LLMController } from '../controllers/llm.controller';

const router = Router();
const intakeController = new IntakeController();
const llmController = new LLMController();

// Message intake endpoints
router.post('/sms', intakeController.handleSMS);
router.post('/email', intakeController.handleEmail);
router.post('/web', intakeController.handleWeb);
router.post('/call', intakeController.handleCall);
router.post('/twilio-call', intakeController.handleTwilioCall);

// Message management
router.get('/messages', intakeController.getMessages);
router.get('/messages/:id', intakeController.getMessage);
router.patch('/messages/:id/classify', intakeController.classifyMessage);
router.patch('/messages/:id/status', intakeController.updateStatus);

// Dashboard stats
router.get('/stats', intakeController.getStats);

// LLM management routes
router.get('/llm/status', llmController.getStatus.bind(llmController));
router.post('/llm/toggle', llmController.toggleLLM.bind(llmController));
router.post('/llm/test', llmController.testClassification.bind(llmController));
router.post('/llm/keywords', llmController.extractKeywords.bind(llmController));
router.post('/llm/apartment', llmController.testApartmentParsing.bind(llmController));
router.get('/llm/config', llmController.getConfig.bind(llmController));

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API is working', timestamp: new Date() });
});

export { router as intakeHubRoutes };