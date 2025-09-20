import { Ticket, TicketStatus, MessageClassification, Priority } from '@/shared/types';
import { SLAService } from './sla.service';
import { logger } from '@/shared/utils/logger';
import { inMemoryStore } from '@/shared/database/in-memory-store';

interface CreateTicketInput {
  title: string;
  description: string;
  category: MessageClassification;
  priority: Priority;
  reporterId: string;
  intakeMessageId: string;
}

export class TicketService {
  private slaService: SLAService;

  constructor() {
    this.slaService = new SLAService();
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    try {
      const ticketNumber = this.generateTicketNumber();
      const slaDeadline = this.slaService.calculateSLADeadline(input.priority, input.category);

      const ticket: Ticket = {
        id: this.generateId(),
        number: ticketNumber,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: TicketStatus.OPEN,
        reporterId: input.reporterId,
        intakeMessageId: input.intakeMessageId,
        slaDeadline,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to in-memory store (TODO: Replace with database)
      inMemoryStore.saveTicket(ticket);
      logger.info('Ticket created and saved', { ticketId: ticket.id, number: ticketNumber });

      return ticket;
    } catch (error) {
      logger.error('Error creating ticket', { error, input });
      throw error;
    }
  }

  async getTickets(query: any): Promise<Ticket[]> {
    try {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const tickets = inMemoryStore.getTickets(limit);
      logger.info('Retrieved tickets', { count: tickets.length });
      return tickets;
    } catch (error) {
      logger.error('Error getting tickets', { error });
      throw error;
    }
  }

  async getTicketById(id: string): Promise<Ticket | null> {
    try {
      const ticket = inMemoryStore.getTicket(id);
      logger.info('Retrieved ticket', { ticketId: id, found: !!ticket });
      return ticket;
    } catch (error) {
      logger.error('Error getting ticket', { error, id });
      throw error;
    }
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    try {
      // TODO: Get existing ticket from database
      const existingTicket = await this.getTicketById(id);
      
      if (!existingTicket) {
        throw new Error('Ticket not found');
      }

      const updatedTicket: Ticket = {
        ...existingTicket,
        ...updates,
        updatedAt: new Date()
      };

      // Save to in-memory store (TODO: Replace with database)
      inMemoryStore.saveTicket(updatedTicket);
      logger.info('Ticket updated and saved', { ticketId: id, updates });

      return updatedTicket;
    } catch (error) {
      logger.error('Error updating ticket', { error, id, updates });
      throw error;
    }
  }

  async assignTicket(id: string, assigneeId: string): Promise<Ticket> {
    try {
      const ticket = await this.updateTicket(id, {
        assigneeId,
        status: TicketStatus.IN_PROGRESS
      });

      logger.info('Ticket assigned', { ticketId: id, assigneeId });
      return ticket;
    } catch (error) {
      logger.error('Error assigning ticket', { error, id, assigneeId });
      throw error;
    }
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    try {
      const updates: Partial<Ticket> = { status };

      // Set resolved timestamp if ticket is being resolved
      if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
        updates.resolvedAt = new Date();
      }

      const ticket = await this.updateTicket(id, updates);

      logger.info('Ticket status updated', { ticketId: id, status });
      return ticket;
    } catch (error) {
      logger.error('Error updating ticket status', { error, id, status });
      throw error;
    }
  }

  private generateTicketNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    return `TK${year}${month}${day}${sequence}`;
  }

  private generateId(): string {
    return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}