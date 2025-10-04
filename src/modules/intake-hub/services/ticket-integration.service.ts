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
      'call': '[통화]',
      'kakaotalk': '[카카오톡]'
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
      'call': '통화 접수',
      'kakaotalk': '카카오톡 접수'
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

    // 긴급상황 키워드
    if (lowerContent.includes('응급') || lowerContent.includes('긴급') || 
        lowerContent.includes('위험') || lowerContent.includes('화재') || 
        lowerContent.includes('가스') || lowerContent.includes('정전') ||
        lowerContent.includes('단수') || lowerContent.includes('누출')) {
      return MessageClassification.EMERGENCY;
    }

    // 공용시설 키워드
    if (lowerContent.includes('엘리베이터') || lowerContent.includes('복도') || 
        lowerContent.includes('주차장') || lowerContent.includes('고장') || 
        lowerContent.includes('파손') || lowerContent.includes('수리')) {
      return MessageClassification.COMMON_FACILITY;
    }

    // 소음 키워드
    if (lowerContent.includes('소음') || lowerContent.includes('시끄') || 
        lowerContent.includes('층간') || lowerContent.includes('기계실')) {
      return MessageClassification.NOISE;
    }

    // 주차 키워드
    if (lowerContent.includes('주차') || lowerContent.includes('차량') || 
        lowerContent.includes('불법') || lowerContent.includes('방문차')) {
      return MessageClassification.PARKING;
    }

    // 위생 키워드
    if (lowerContent.includes('악취') || lowerContent.includes('곰팡이') || 
        lowerContent.includes('해충') || lowerContent.includes('벌레') || 
        lowerContent.includes('쓰레기')) {
      return MessageClassification.HYGIENE;
    }

    // 관리비 키워드
    if (lowerContent.includes('관리비') || lowerContent.includes('요금') || 
        lowerContent.includes('청구') || lowerContent.includes('납부')) {
      return MessageClassification.BILLING;
    }

    // 출입통제 키워드
    if (lowerContent.includes('비밀번호') || lowerContent.includes('출입') || 
        lowerContent.includes('현관') || lowerContent.includes('카드')) {
      return MessageClassification.ACCESS_CONTROL;
    }

    // 조경 키워드
    if (lowerContent.includes('정원') || lowerContent.includes('놀이터') || 
        lowerContent.includes('운동시설') || lowerContent.includes('조경')) {
      return MessageClassification.LANDSCAPING;
    }

    // 조명 키워드
    if (lowerContent.includes('조명') || lowerContent.includes('전등') || 
        lowerContent.includes('점등') || lowerContent.includes('소등')) {
      return MessageClassification.LIGHTING;
    }

    // 흡연 키워드
    if (lowerContent.includes('흡연') || lowerContent.includes('담배') || 
        lowerContent.includes('베란다')) {
      return MessageClassification.SMOKING;
    }

    // 택배 키워드
    if (lowerContent.includes('택배') || lowerContent.includes('우편') || 
        lowerContent.includes('배송') || lowerContent.includes('분실')) {
      return MessageClassification.DELIVERY;
    }

    // 안전 키워드
    if (lowerContent.includes('안전') || lowerContent.includes('비상벨') || 
        lowerContent.includes('cctv') || lowerContent.includes('소화기')) {
      return MessageClassification.SAFETY;
    }

    return MessageClassification.INQUIRY; // Default
  }
}