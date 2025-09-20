import { Priority, MessageClassification, Ticket } from '@/shared/types';
import { logger } from '@/shared/utils/logger';
import { inMemoryStore } from '@/shared/database/in-memory-store';

interface SLARule {
  priority: Priority;
  category?: MessageClassification;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

interface SLADashboard {
  totalTickets: number;
  withinSLA: number;
  violatedSLA: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaPerformance: number;
}

export class SLAService {
  private slaRules: SLARule[] = [
    // Emergency tickets
    { priority: Priority.URGENT, responseTimeHours: 1, resolutionTimeHours: 4 },
    
    // High priority tickets
    { priority: Priority.HIGH, responseTimeHours: 4, resolutionTimeHours: 24 },
    
    // Medium priority tickets
    { priority: Priority.MEDIUM, responseTimeHours: 8, resolutionTimeHours: 72 },
    
    // Low priority tickets
    { priority: Priority.LOW, responseTimeHours: 24, resolutionTimeHours: 168 },
    
    // Category-specific overrides
    { 
      priority: Priority.HIGH, 
      category: MessageClassification.EMERGENCY, 
      responseTimeHours: 0.5, 
      resolutionTimeHours: 2 
    },
    { 
      priority: Priority.MEDIUM, 
      category: MessageClassification.MAINTENANCE, 
      responseTimeHours: 4, 
      resolutionTimeHours: 48 
    }
  ];

  calculateSLADeadline(priority: Priority, category?: MessageClassification): Date {
    const rule = this.findSLARule(priority, category);
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + rule.resolutionTimeHours);
    
    return deadline;
  }

  calculateResponseDeadline(priority: Priority, category?: MessageClassification): Date {
    const rule = this.findSLARule(priority, category);
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + rule.responseTimeHours);
    
    return deadline;
  }

  async getDashboard(): Promise<SLADashboard> {
    try {
      const totalTickets = inMemoryStore.getTicketCount();
      const activeTickets = inMemoryStore.getActiveTicketCount();
      const allTickets = inMemoryStore.getTickets();
      
      // Calculate SLA metrics
      const now = new Date();
      let violatedSLA = 0;
      let withinSLA = 0;
      
      allTickets.forEach(ticket => {
        const isViolated = now > ticket.slaDeadline && 
                          ticket.status !== 'resolved' && 
                          ticket.status !== 'closed';
        if (isViolated) {
          violatedSLA++;
        } else {
          withinSLA++;
        }
      });
      
      const slaPerformance = totalTickets > 0 ? (withinSLA / totalTickets) * 100 : 100;

      return {
        totalTickets,
        withinSLA,
        violatedSLA,
        averageResponseTime: 0, // TODO: Calculate from actual data
        averageResolutionTime: 0, // TODO: Calculate from actual data
        slaPerformance
      };
    } catch (error) {
      logger.error('Error getting SLA dashboard', { error });
      throw error;
    }
  }

  async getViolations(query: any): Promise<Ticket[]> {
    try {
      const allTickets = inMemoryStore.getTickets();
      const now = new Date();
      
      const violations = allTickets.filter(ticket => {
        return now > ticket.slaDeadline && 
               ticket.status !== 'resolved' && 
               ticket.status !== 'closed';
      });

      logger.info('Retrieved SLA violations', { count: violations.length });
      return violations;
    } catch (error) {
      logger.error('Error getting SLA violations', { error });
      throw error;
    }
  }

  async checkSLAViolation(ticket: Ticket): Promise<boolean> {
    const now = new Date();
    const isViolated = now > ticket.slaDeadline && 
                      ticket.status !== 'resolved' && 
                      ticket.status !== 'closed';

    if (isViolated) {
      logger.warn('SLA violation detected', { 
        ticketId: ticket.id, 
        deadline: ticket.slaDeadline,
        currentTime: now 
      });
    }

    return isViolated;
  }

  async getUpcomingSLADeadlines(hoursAhead: number = 24): Promise<Ticket[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() + hoursAhead);

      // TODO: Implement database query for tickets with upcoming deadlines
      return [];
    } catch (error) {
      logger.error('Error getting upcoming SLA deadlines', { error });
      throw error;
    }
  }

  private findSLARule(priority: Priority, category?: MessageClassification): SLARule {
    // First try to find category-specific rule
    if (category) {
      const categoryRule = this.slaRules.find(rule => 
        rule.priority === priority && rule.category === category
      );
      if (categoryRule) {
        return categoryRule;
      }
    }

    // Fall back to priority-only rule
    const priorityRule = this.slaRules.find(rule => 
      rule.priority === priority && !rule.category
    );

    if (!priorityRule) {
      logger.warn('No SLA rule found, using default', { priority, category });
      return { priority, responseTimeHours: 24, resolutionTimeHours: 168 };
    }

    return priorityRule;
  }
}