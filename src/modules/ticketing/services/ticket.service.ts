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
  assigneeId?: string;
}

// Management staff for auto-assignment
const MANAGEMENT_STAFF = [
  { id: 'staff_001', name: '김관리', role: '관리소장', specialties: ['billing', 'inquiry', 'complaint'] },
  { id: 'staff_002', name: '이수리', role: '시설관리', specialties: ['maintenance', 'facility'] },
  { id: 'staff_003', name: '박보안', role: '경비팀장', specialties: ['security', 'parking'] },
  { id: 'staff_004', name: '최청소', role: '환경관리', specialties: ['maintenance', 'facility'] },
  { id: 'staff_005', name: '정전기', role: '전기기사', specialties: ['maintenance'] },
  { id: 'staff_006', name: '한소음', role: '민원담당', specialties: ['noise', 'complaint'] }
];

export class TicketService {
  private slaService: SLAService;

  constructor() {
    this.slaService = new SLAService();
  }

  private getAutoAssignee(category: MessageClassification): string {
    const availableStaff = MANAGEMENT_STAFF.filter(staff => 
      staff.specialties.includes(category) || staff.specialties.includes('inquiry')
    );
    
    if (availableStaff.length === 0) {
      return MANAGEMENT_STAFF[0].id; // Default to manager
    }
    
    // Simple round-robin assignment (in production, consider workload balancing)
    const randomIndex = Math.floor(Math.random() * availableStaff.length);
    return availableStaff[randomIndex].id;
  }

  getStaffInfo(staffId: string) {
    return MANAGEMENT_STAFF.find(staff => staff.id === staffId);
  }

  getAllStaff() {
    return MANAGEMENT_STAFF;
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    try {
      const ticketNumber = this.generateTicketNumber();
      const slaDeadline = this.slaService.calculateSLADeadline(input.priority, input.category);

      const assigneeId = input.assigneeId || this.getAutoAssignee(input.category);

      const ticket: Ticket = {
        id: this.generateId(),
        number: ticketNumber,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: TicketStatus.OPEN,
        assigneeId,
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

  async getTicketByMessageId(messageId: string): Promise<Ticket | null> {
    try {
      const tickets = inMemoryStore.getTickets(1000); // Get all tickets
      const ticket = tickets.find(t => t.intakeMessageId === messageId);
      logger.info('Retrieved ticket by message ID', { messageId, ticketId: ticket?.id, found: !!ticket });
      return ticket || null;
    } catch (error) {
      logger.error('Error getting ticket by message ID', { error, messageId });
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

  async getTicketsByAssignee(assigneeId: string): Promise<Ticket[]> {
    try {
      const allTickets = await this.getTickets({ limit: 1000 });
      return allTickets.filter(ticket => ticket.assigneeId === assigneeId);
    } catch (error) {
      logger.error('Error getting tickets by assignee', { error, assigneeId });
      throw error;
    }
  }

  async getWorkloadAnalytics() {
    try {
      const allTickets = await this.getTickets({ limit: 1000 });
      const workloadMap = new Map<string, {
        staffInfo: any;
        totalTickets: number;
        openTickets: number;
        inProgressTickets: number;
        resolvedTickets: number;
      }>();

      // Initialize workload for all staff
      MANAGEMENT_STAFF.forEach(staff => {
        workloadMap.set(staff.id, {
          staffInfo: staff,
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0
        });
      });

      // Calculate workload metrics
      allTickets.forEach(ticket => {
        if (!ticket.assigneeId) return;

        const workload = workloadMap.get(ticket.assigneeId);
        if (!workload) return;

        workload.totalTickets++;
        
        switch (ticket.status) {
          case TicketStatus.OPEN:
            workload.openTickets++;
            break;
          case TicketStatus.IN_PROGRESS:
            workload.inProgressTickets++;
            break;
          case TicketStatus.RESOLVED:
          case TicketStatus.CLOSED:
            workload.resolvedTickets++;
            break;
        }
      });

      return Array.from(workloadMap.values()).sort((a, b) => b.totalTickets - a.totalTickets);
    } catch (error) {
      logger.error('Error getting workload analytics', { error });
      throw error;
    }
  }

  async reassignTicket(ticketId: string, newAssigneeId: string): Promise<Ticket | null> {
    try {
      const ticket = await this.updateTicket(ticketId, { assigneeId: newAssigneeId });
      logger.info('Ticket reassigned', { ticketId, newAssigneeId });
      return ticket;
    } catch (error) {
      logger.error('Error reassigning ticket', { error, ticketId, newAssigneeId });
      throw error;
    }
  }
}