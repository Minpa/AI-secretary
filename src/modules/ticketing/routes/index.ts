import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';

const router = Router();
const ticketController = new TicketController();

// Ticket CRUD
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/by-message/:messageId', ticketController.getTicketByMessageId);
router.get('/:id', ticketController.getTicket);
router.patch('/:id', ticketController.updateTicket);
router.patch('/:id/assign', ticketController.assignTicket);
router.patch('/:id/status', ticketController.updateStatus);

// SLA monitoring
router.get('/sla/dashboard', ticketController.getSLADashboard);
router.get('/sla/violations', ticketController.getSLAViolations);

export { router as ticketingRoutes };