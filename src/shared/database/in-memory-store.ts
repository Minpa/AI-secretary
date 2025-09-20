import { IntakeMessage, Ticket } from '@/shared/types';

// Simple in-memory storage for development/testing
class InMemoryStore {
  private messages: Map<string, IntakeMessage> = new Map();
  private tickets: Map<string, Ticket> = new Map();

  // Message operations
  saveMessage(message: IntakeMessage): void {
    this.messages.set(message.id, message);
  }

  getMessage(id: string): IntakeMessage | null {
    return this.messages.get(id) || null;
  }

  getMessages(limit: number = 50): IntakeMessage[] {
    const allMessages = Array.from(this.messages.values());
    return allMessages
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getMessageCount(): number {
    return this.messages.size;
  }

  // Ticket operations
  saveTicket(ticket: Ticket): void {
    this.tickets.set(ticket.id, ticket);
  }

  getTicket(id: string): Ticket | null {
    return this.tickets.get(id) || null;
  }

  getTickets(limit: number = 50): Ticket[] {
    const allTickets = Array.from(this.tickets.values());
    return allTickets
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getTicketCount(): number {
    return this.tickets.size;
  }

  getActiveTicketCount(): number {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.status !== 'closed' && ticket.status !== 'resolved')
      .length;
  }

  getTicketByIntakeMessageId(intakeMessageId: string): Ticket | null {
    return Array.from(this.tickets.values())
      .find(ticket => ticket.intakeMessageId === intakeMessageId) || null;
  }

  // Clear all data (for testing)
  clear(): void {
    this.messages.clear();
    this.tickets.clear();
  }
}

export const inMemoryStore = new InMemoryStore();