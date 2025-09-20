import { Request, Response, NextFunction } from 'express';
import { TicketService } from '../services/ticket.service';
import { SLAService } from '../services/sla.service';
import { ApiResponse } from '@/shared/types';
import { AppError } from '@/shared/middleware/error-handler';

export class TicketController {
  private ticketService: TicketService;
  private slaService: SLAService;

  constructor() {
    this.ticketService = new TicketService();
    this.slaService = new SLAService();
  }

  createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await this.ticketService.createTicket(req.body);

      const response: ApiResponse = {
        success: true,
        data: ticket,
        message: 'Ticket created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tickets = await this.ticketService.getTickets(req.query);

      const response: ApiResponse = {
        success: true,
        data: tickets
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const ticket = await this.ticketService.getTicketById(id);

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: ticket
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const ticket = await this.ticketService.updateTicket(id, req.body);

      const response: ApiResponse = {
        success: true,
        data: ticket,
        message: 'Ticket updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  assignTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;

      if (!assigneeId) {
        throw new AppError('Assignee ID is required', 400);
      }

      const ticket = await this.ticketService.assignTicket(id, assigneeId);

      const response: ApiResponse = {
        success: true,
        data: ticket,
        message: 'Ticket assigned successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const ticket = await this.ticketService.updateStatus(id, status);

      const response: ApiResponse = {
        success: true,
        data: ticket,
        message: 'Ticket status updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getSLADashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await this.slaService.getDashboard();

      const response: ApiResponse = {
        success: true,
        data: dashboard
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  getSLAViolations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const violations = await this.slaService.getViolations(req.query);

      const response: ApiResponse = {
        success: true,
        data: violations
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}