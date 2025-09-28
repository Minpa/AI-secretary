import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';

const router = Router();
const ticketController = new TicketController();

// Ticket CRUD
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);

// SLA monitoring (must be before /:id route)
router.get('/sla/dashboard', ticketController.getSLADashboard);
router.get('/sla/violations', ticketController.getSLAViolations);

// Workload and assignment management (must be before /:id route)
router.get('/workload/analytics', ticketController.getWorkloadAnalytics);
router.get('/staff', ticketController.getStaffList);
router.get('/assignee/:assigneeId', ticketController.getTicketsByAssignee);

// Specific message-based routes (must be before /:id route)
router.get('/by-message/:messageId', ticketController.getTicketByMessageId);

// Generic ID-based routes (must be last)
router.get('/:id', ticketController.getTicket);
router.patch('/:id', ticketController.updateTicket);
router.patch('/:id/assign', ticketController.assignTicket);
router.patch('/:id/status', ticketController.updateStatus);
router.patch('/:id/reassign', ticketController.reassignTicket);

export { router as ticketingRoutes };