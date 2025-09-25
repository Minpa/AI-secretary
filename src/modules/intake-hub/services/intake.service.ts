import { IntakeMessage, IntakeChannel, IntakeStatus, Priority, MessageClassification, ApartmentUnitInfo } from '@/shared/types';
import { PIIMaskingService } from './pii-masking.service';
import { TicketIntegrationService } from './ticket-integration.service';
import { apartmentParser } from '@/shared/services/apartment-parser.service';
import { logger } from '@/shared/utils/logger';
import { inMemoryStore } from '@/shared/database/in-memory-store';

interface CreateMessageInput {
  channel: IntakeChannel;
  content: string;
  sender: string;
  createdAt?: Date; // Optional custom timestamp for dummy data generation
}

export class IntakeService {
  private piiMaskingService: PIIMaskingService;
  private ticketIntegrationService: TicketIntegrationService;

  constructor() {
    this.piiMaskingService = new PIIMaskingService();
    this.ticketIntegrationService = new TicketIntegrationService();
  }

  async processMessage(input: CreateMessageInput): Promise<IntakeMessage> {
    try {
      // Mask PII in content and sender
      const maskedContent = await this.piiMaskingService.maskContent(input.content);
      const maskedSender = await this.piiMaskingService.maskSender(input.sender);

      // Parse apartment unit information
      const apartmentInfo = this.parseApartmentUnit(input.content);

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
        apartmentUnit: apartmentInfo,
        createdAt: input.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Save to in-memory store (TODO: Replace with database)
      inMemoryStore.saveMessage(message);
      logger.info('Message processed and saved', { messageId: message.id, channel: input.channel });

      // Auto-create ticket for high/urgent priority messages from all channels
      if (message.priority === Priority.HIGH || message.priority === Priority.URGENT) {
        try {
          // Auto-classify high/urgent messages and create tickets
          message.status = IntakeStatus.CLASSIFIED;
          message.classification = this.autoClassifyMessage(message.content);
          inMemoryStore.saveMessage(message); // Update with classification
          
          const ticketId = await this.ticketIntegrationService.createTicketFromMessage(message);
          if (ticketId) {
            logger.info('Ticket auto-created for high/urgent priority message', { 
              messageId: message.id, 
              ticketId,
              channel: input.channel,
              priority: message.priority
            });
          }
        } catch (error) {
          logger.error('Failed to auto-create ticket for high/urgent message', { 
            error, 
            messageId: message.id,
            channel: input.channel 
          });
          // Don't fail the message processing if ticket creation fails
        }
      }

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

      const oldStatus = message.status;
      message.status = status;
      message.updatedAt = new Date();
      inMemoryStore.saveMessage(message);

      // Auto-create ticket when message is classified or becomes high/urgent priority
      if (status === 'classified' && oldStatus !== 'classified') {
        try {
          const ticketId = await this.ticketIntegrationService.createTicketFromMessage(message);
          if (ticketId) {
            logger.info('Ticket auto-created from classified message', { 
              messageId: id, 
              ticketId 
            });
          }
        } catch (error) {
          logger.error('Failed to auto-create ticket', { error, messageId: id });
          // Don't fail the status update if ticket creation fails
        }
      }

      logger.info('Message status updated', { messageId: id, status, oldStatus });
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

  private autoClassifyMessage(content: string): MessageClassification {
    const lowerContent = content.toLowerCase();

    // Emergency keywords
    if (lowerContent.includes('응급') || lowerContent.includes('긴급') || 
        lowerContent.includes('위험') || lowerContent.includes('화재') || 
        lowerContent.includes('가스')) {
      return MessageClassification.EMERGENCY;
    }

    // Maintenance keywords
    if (lowerContent.includes('고장') || lowerContent.includes('수리') || 
        lowerContent.includes('엘리베이터') || lowerContent.includes('문제')) {
      return MessageClassification.MAINTENANCE;
    }

    // Noise keywords
    if (lowerContent.includes('소음') || lowerContent.includes('시끄')) {
      return MessageClassification.NOISE;
    }

    // Parking keywords
    if (lowerContent.includes('주차') || lowerContent.includes('차량')) {
      return MessageClassification.PARKING;
    }

    // Billing keywords
    if (lowerContent.includes('관리비') || lowerContent.includes('요금')) {
      return MessageClassification.BILLING;
    }

    // Security keywords
    if (lowerContent.includes('보안') || lowerContent.includes('출입')) {
      return MessageClassification.SECURITY;
    }

    return MessageClassification.INQUIRY; // Default
  }

  private parseApartmentUnit(content: string): ApartmentUnitInfo | undefined {
    try {
      const parsed = apartmentParser.parseApartmentUnits(content);
      
      if (!parsed.hasLocation || parsed.units.length === 0) {
        return undefined;
      }

      // Use the highest confidence unit
      const bestUnit = parsed.units[0];
      
      // Only include if confidence is reasonable and unit is valid
      if (bestUnit.confidence >= 0.6 && apartmentParser.validateUnit(bestUnit)) {
        return {
          dong: bestUnit.dong,
          ho: bestUnit.ho,
          floor: bestUnit.floor,
          formatted: apartmentParser.formatUnit(bestUnit),
          confidence: bestUnit.confidence,
          rawMatches: parsed.rawMatches
        };
      }

      return undefined;
    } catch (error) {
      logger.warn('Failed to parse apartment unit', { error, content: content.substring(0, 100) });
      return undefined;
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}