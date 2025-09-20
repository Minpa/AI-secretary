import { Router } from 'express';
import { ERPController } from '../controllers/erp.controller';

const router = Router();
const erpController = new ERPController();

// CSV file upload and processing
router.post('/upload', erpController.uploadCSV);
router.get('/imports', erpController.getImports);
router.get('/imports/:id', erpController.getImport);

export { router as erpReaderRoutes };