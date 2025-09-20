import { IntakeMessage, IntakeChannel, IntakeStatus, Priority } from '@/shared/types';
import { PIIMaskingService } from './pii-masking.service';
import { logger } from '@/shared/utils/logger';
import { inMemoryStore } from '@/shared/database/in-memory-store';

interface CreateMessageInput {
  channel: IntakeChannel;
  content: string;
  sender: string;
}

export class IntakeService {
  private piiMaskingService: PIIMaskingService;

  constructor() {
    this.piiMaskingService = new PIIMaskingService();
  }

  async processMessage(input: CreateMessageInput): Promise<IntakeMessage> {
    try {
      // Mask PII in content and sender
      const maskedContent = await this.piiMaskingService.maskContent(input.content);
      const maskedSender = await this.piiMaskingService.maskSender(input.sender);

      // Determine initial priority based on channel and content
      const priority = this.determinePriority(input.channel, input.content);

      const message: IntakeMessage = {
        id: this.generateId(),
        channel: input.channel,
        content: input.content,
        maskedContent,
        sender: input.sender,
        maskedSender,
        priority,
        status: IntakeStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to in-memory store (TODO: Replace with database)
      inMemoryStore.saveMessage(message);
      logger.info('Message processed and saved', { messageId: message.id, channel: input.channel });

      return message;
    } catch (error) {
      logger.error('Error processing message', { error, input });
      throw error;
    }
  }

  async getMessages(query: any): Promise<IntakeMessage[]> {
    try {
      const limit = query.limit ? parseInt(query.limit) : 50;
      const messages = inMemoryStore.getMessages(limit);
      logger.info('Retrieved messages', { count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Error getting messages', { error });
      throw error;
    }
  }

  async getMessageById(id: string): Promise<IntakeMessage | null> {
    try {
      const message = inMemoryStore.getMessage(id);
      logger.info('Retrieved message', { messageId: id, found: !!message });
      return message;
    } catch (error) {
      logger.error('Error getting message', { error, id });
      throw error;
    }
  }

  async getMessageCount(): Promise<number> {
    return inMemoryStore.getMessageCount();
  }

  async updateMessageStatus(id: string, status: IntakeStatus): Promise<IntakeMessage | null> {
    try {
      const message = inMemoryStore.getMessage(id);
      if (!message) {
        return null;
      }

      message.status = status;
      message.updatedAt = new Date();
      inMemoryStore.saveMessage(message);

      logger.info('Message status updated', { messageId: id, status });
      return message;
    } catch (error) {
      logger.error('Error updating message status', { error, id, status });
      throw error;
    }
  }

  private determinePriority(channel: IntakeChannel, content: string): Priority {
    const urgentKeywords = ['응급', '긴급', '위험', '화재', '가스', '누수'];
    const highKeywords = ['소음', '민원', '고장', '문제'];

    const lowerContent = content.toLowerCase();

    if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
      return Priority.URGENT;
    }

    if (channel === IntakeChannel.CALL || highKeywords.some(keyword => lowerContent.includes(keyword))) {
      return Priority.HIGH;
    }

    return Priority.MEDIUM;
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}