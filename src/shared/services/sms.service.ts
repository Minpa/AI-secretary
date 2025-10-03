import twilio from 'twilio';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import { MessageClassification } from '@/shared/types';
import { conversationService } from './conversation.service';

export class SMSService {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.sms.provider === 'twilio' && config.sms.apiKey && config.sms.apiSecret) {
      this.client = twilio(config.sms.apiKey, config.sms.apiSecret);
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('SMS service not configured, skipping SMS send');
      return false;
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890' // Default fallback
      });

      logger.info(`SMS sent successfully`, { 
        to, 
        messageId: result.sid,
        status: result.status 
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send SMS', { error, to });
      return false;
    }
  }

  async startConversation(to: string, messageId: string, classification: MessageClassification): Promise<boolean> {
    const conversationMessage = conversationService.startConversation(messageId, classification);
    return this.sendSMS(to, conversationMessage);
  }

  async processConversationResponse(to: string, messageId: string, userResponse: string): Promise<boolean> {
    const responseMessage = conversationService.processResponse(messageId, userResponse);
    return this.sendSMS(to, responseMessage);
  }

  async sendDetailRequest(to: string, classification: string): Promise<boolean> {
    // Legacy method - kept for backward compatibility
    const messages = {
      maintenance: '안녕하세요. 시설 관련 문의 접수되었습니다. 더 정확한 처리를 위해 다음 정보를 알려주세요:\n1) 정확한 위치 (동/호수)\n2) 문제 상황 상세 설명\n3) 긴급도 (긴급/보통)',
      complaint: '안녕하세요. 민원이 접수되었습니다. 신속한 처리를 위해 추가 정보를 알려주세요:\n1) 발생 위치\n2) 발생 시간\n3) 구체적인 상황',
      inquiry: '안녕하세요. 문의사항이 접수되었습니다. 정확한 답변을 위해 다음을 알려주세요:\n1) 문의 내용 상세\n2) 연락 가능한 시간\n3) 회신 방법 (SMS/전화)',
      emergency: '긴급상황이 접수되었습니다. 즉시 담당자가 확인하겠습니다. 추가 연락이 필요한 경우 이 번호로 회신해 주세요.',
      default: '접수되었습니다. 더 정확한 처리를 위해 상세한 정보를 알려주시면 신속히 처리하겠습니다.'
    };

    const message = messages[classification as keyof typeof messages] || messages.default;
    return this.sendSMS(to, message);
  }
}

export const smsService = new SMSService();