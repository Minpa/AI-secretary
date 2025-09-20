import { MessageClassification, IntakeMessage } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

export class ClassificationService {
  private ruleBasedClassifier: RuleBasedClassifier;

  constructor() {
    this.ruleBasedClassifier = new RuleBasedClassifier();
  }

  async classifyMessage(messageId: string): Promise<IntakeMessage> {
    try {
      // TODO: Get message from database
      const message = await this.getMessageById(messageId);
      
      if (!message) {
        throw new Error('Message not found');
      }

      // Use rule-based classification first
      const ruleBasedResult = this.ruleBasedClassifier.classify(message.maskedContent);
      
      // TODO: If confidence is low, use LLM classification
      const classification = ruleBasedResult.classification;
      const confidence = ruleBasedResult.confidence;

      // Update message with classification
      message.classification = classification;
      message.updatedAt = new Date();

      // TODO: Save to database

      logger.info('Message classified', { 
        messageId, 
        classification, 
        confidence,
        method: 'rule-based'
      });

      return message;
    } catch (error) {
      logger.error('Error classifying message', { error, messageId });
      throw error;
    }
  }

  private async getMessageById(id: string): Promise<IntakeMessage | null> {
    // TODO: Implement database query
    return null;
  }
}

class RuleBasedClassifier {
  private rules: ClassificationRule[] = [
    {
      keywords: ['소음', '시끄러운', '층간소음', '윗집', '아래집'],
      classification: MessageClassification.NOISE,
      weight: 1.0
    },
    {
      keywords: ['주차', '차량', '주차장', '주차위반'],
      classification: MessageClassification.PARKING,
      weight: 1.0
    },
    {
      keywords: ['수리', '고장', '망가진', '작동안함', '엘리베이터'],
      classification: MessageClassification.MAINTENANCE,
      weight: 0.9
    },
    {
      keywords: ['관리비', '요금', '청구서', '납부'],
      classification: MessageClassification.BILLING,
      weight: 1.0
    },
    {
      keywords: ['보안', '출입', '도어락', '키', '분실'],
      classification: MessageClassification.SECURITY,
      weight: 0.8
    },
    {
      keywords: ['응급', '긴급', '위험', '화재', '가스누출'],
      classification: MessageClassification.EMERGENCY,
      weight: 1.0
    }
  ];

  classify(content: string): { classification: MessageClassification; confidence: number } {
    const lowerContent = content.toLowerCase();
    let bestMatch: { classification: MessageClassification; score: number } | null = null;

    for (const rule of this.rules) {
      const matchCount = rule.keywords.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > 0) {
        const score = (matchCount / rule.keywords.length) * rule.weight;
        
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { classification: rule.classification, score };
        }
      }
    }

    if (bestMatch) {
      return {
        classification: bestMatch.classification,
        confidence: Math.min(bestMatch.score, 1.0)
      };
    }

    // Default classification
    return {
      classification: MessageClassification.INQUIRY,
      confidence: 0.3
    };
  }
}

interface ClassificationRule {
  keywords: string[];
  classification: MessageClassification;
  weight: number;
}