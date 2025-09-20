import { IntakeMessage, MessageClassification } from '@/shared/types';
import { TicketService } from '@/modules/ticketing/services/ticket.service';
import { logger } from '@/shared/utils/logger';

export class TicketIntegrationService {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  async createTicketFromMessage(message: IntakeMessage): Promise<string | null> {
    try {
      // Create tickets for classified messages OR high/urgent priority messages
      const shouldCreateTicket = message.status === 'classified' || 
                                message.priority === 'high' || 
                                message.priority === 'urgent';
      
      if (!shouldCreateTicket) {
        logger.info('Skipping ticket creation - message not ready', { 
          messageId: message.id, 
          status: message.status, 
          priority: message.priority 
        });
        return null;
      }

      // Generate ticket title and description from message
      const title = this.generateTicketTitle(message);
      const description = this.generateTicketDescription(message);
      const category = message.classification || this.inferCategory(message.content);

      const ticket = await this.ticketService.createTicket({
        title,
        description,
        category,
        priority: message.priority,
        reporterId: message.maskedSender, // Use masked sender for privacy
        intakeMessageId: message.id
      });

      logger.info('Ticket created from intake message', { 
        messageId: message.id, 
        ticketId: ticket.id,
        ticketNumber: ticket.number
      });

      return ticket.id;
    } catch (error) {
      logger.error('Error creating ticket from message', { error, messageId: message.id });
      throw error;
    }
  }

  private generateTicketTitle(message: IntakeMessage): string {
    const channelPrefix = {
      'sms': '[SMS]',
      'email': '[이메일]',
      'web': '[웹폼]',
      'call': '[통화]'
    };

    const prefix = channelPrefix[message.channel] || '[접수]';
    
    // Extract first sentence or first 50 characters as title
    const content = message.maskedContent || message.content;
    const firstSentence = content.split(/[.!?]/)[0];
    const title = firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...'
      : firstSentence;

    return `${prefix} ${title}`;
  }

  private generateTicketDescription(message: IntakeMessage): string {
    const channelInfo = {
      'sms': 'SMS 접수',
      'email': '이메일 접수',
      'web': '웹폼 접수',
      'call': '통화 접수'
    };

    return `
**접수 정보**
- 채널: ${channelInfo[message.channel] || message.channel}
- 발신자: ${message.maskedSender}
- 우선순위: ${message.priority}
- 접수시간: ${message.createdAt.toLocaleString('ko-KR')}

**내용**
${message.maskedContent || message.content}

**원본 메시지 ID**: ${message.id}
    `.trim();
  }

  private inferCategory(content: string): MessageClassification {
    const lowerContent = content.toLowerCase();

    // Simple keyword-based classification
    if (lowerContent.includes('소음') || lowerContent.includes('시끄')) {
      return MessageClassification.NOISE;
    }
    if (lowerContent.includes('주차') || lowerContent.includes('차량')) {
      return MessageClassification.PARKING;
    }
    if (lowerContent.includes('고장') || lowerContent.includes('수리') || lowerContent.includes('엘리베이터')) {
      return MessageClassification.MAINTENANCE;
    }
    if (lowerContent.includes('관리비') || lowerContent.includes('요금')) {
      return MessageClassification.BILLING;
    }
    if (lowerContent.includes('보안') || lowerContent.includes('출입')) {
      return MessageClassification.SECURITY;
    }
    if (lowerContent.includes('응급') || lowerContent.includes('긴급')) {
      return MessageClassification.EMERGENCY;
    }

    return MessageClassification.INQUIRY; // Default
  }
}