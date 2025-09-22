import { MessageClassification, IntakeMessage } from '@/shared/types';
import { logger } from '@/shared/utils/logger';
import { llmService, LLMClassificationResult } from '../../../shared/services/llm.service.simple';

export class ClassificationService {
    private ruleBasedClassifier: RuleBasedClassifier;
    private confidenceThreshold: number = 0.7; // Use LLM if rule-based confidence is below this

    constructor() {
        this.ruleBasedClassifier = new RuleBasedClassifier();
    }

    /**
     * Enable or disable LLM fallback
     */
    setLLMEnabled(enabled: boolean): void {
        llmService.setEnabled(enabled);
    }

    /**
     * Get LLM service status
     */
    async getLLMStatus(): Promise<{ enabled: boolean; available: boolean; config: any }> {
        const config = llmService.getConfig();
        const available = await llmService.isAvailable();
        
        return {
            enabled: config.enabled,
            available,
            config: {
                model: config.model,
                baseUrl: config.baseUrl
            }
        };
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
            
            let classification = ruleBasedResult.classification;
            let confidence = ruleBasedResult.confidence;
            let method = 'rule-based';
            let reasoning = 'Rule-based keyword matching';

            // If confidence is low and LLM is available, use LLM classification
            if (confidence < this.confidenceThreshold) {
                try {
                    const llmAvailable = await llmService.isAvailable();
                    if (llmAvailable) {
                        logger.info('Using LLM fallback for low-confidence classification', {
                            messageId,
                            ruleBasedConfidence: confidence,
                            ruleBasedClassification: classification
                        });

                        const llmResult = await llmService.classifyMessage(message.maskedContent);
                        
                        // Use LLM result if it has higher confidence
                        if (llmResult.confidence > confidence) {
                            classification = llmResult.classification;
                            confidence = llmResult.confidence;
                            method = 'llm-fallback';
                            reasoning = llmResult.reasoning || 'LLM classification';
                        }
                    }
                } catch (error) {
                    logger.warn('LLM classification failed, using rule-based result', {
                        error: error instanceof Error ? error.message : String(error),
                        messageId
                    });
                }
            }

            // Update message with classification
            message.classification = classification;
            message.updatedAt = new Date();

            // TODO: Save to database

            logger.info('Message classified', {
                messageId,
                classification,
                confidence,
                method,
                reasoning
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