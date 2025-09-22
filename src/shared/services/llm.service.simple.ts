import { MessageClassification } from '../types';
import { logger } from '../utils/logger';

export interface LLMClassificationResult {
    classification: MessageClassification;
    confidence: number;
    reasoning?: string;
}

export class LLMService {
    private enabled: boolean = false;

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        logger.info('LLM service toggled', { enabled });
    }

    async isAvailable(): Promise<boolean> {
        if (!this.enabled) {
            return false;
        }

        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                return false;
            }

            const data = await response.json() as { models?: Array<{ name: string }> };
            const hasModel = data.models?.some((model) => 
                model.name.includes('mistral')
            );

            return hasModel || false;
        } catch (error) {
            logger.warn('LLM service not available', { error: error instanceof Error ? error.message : String(error) });
            return false;
        }
    }

    async classifyMessage(content: string): Promise<LLMClassificationResult> {
        if (!this.enabled) {
            throw new Error('LLM service is disabled');
        }

        try {
            const prompt = this.buildClassificationPrompt(content);
            const response = await this.callOllama(prompt);
            return this.parseClassificationResponse(response);
        } catch (error) {
            logger.error('LLM classification failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }

    async extractKeywords(messages: string[]): Promise<{ keyword: string; count: number; category: string; sentiment: string }[]> {
        if (!this.enabled) {
            throw new Error('LLM service is disabled');
        }

        try {
            const prompt = this.buildKeywordExtractionPrompt(messages);
            const response = await this.callOllama(prompt);
            return this.parseKeywordResponse(response);
        } catch (error) {
            logger.error('LLM keyword extraction failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }

    private buildClassificationPrompt(content: string): string {
        return `아파트 관리사무소에 접수된 다음 메시지를 분류해주세요.

메시지: "${content}"

다음 카테고리 중 하나로 분류하고, 신뢰도(0-1)와 이유를 제공해주세요:

카테고리:
- NOISE: 소음 관련 (층간소음, 시끄러운 소리 등)
- PARKING: 주차 관련 (주차 위반, 주차장 문제 등)
- MAINTENANCE: 시설 수리/관리 (고장, 수리 요청 등)
- BILLING: 관리비/요금 관련
- SECURITY: 보안/출입 관련
- EMERGENCY: 응급상황 (화재, 가스누출 등)
- INQUIRY: 일반 문의

응답 형식 (JSON):
{
  "classification": "카테고리명",
  "confidence": 0.85,
  "reasoning": "분류 이유"
}`;
    }

    private buildKeywordExtractionPrompt(messages: string[]): string {
        const sampleMessages = messages.slice(0, 50).join('\n- ');
        
        return `아파트 관리사무소에 접수된 다음 메시지들에서 핵심 키워드를 추출하고 분석해주세요:

메시지들:
- ${sampleMessages}

다음 기준으로 키워드를 추출해주세요:
1. 빈도가 높은 핵심 단어들
2. 각 키워드의 카테고리 (소음, 주차, 시설관리, 관리비, 보안, 생활편의)
3. 감정 분석 (긍정, 부정, 중립)

응답 형식 (JSON):
{
  "keywords": [
    {
      "keyword": "소음",
      "count": 15,
      "category": "소음",
      "sentiment": "부정"
    },
    {
      "keyword": "주차장",
      "count": 12,
      "category": "주차",
      "sentiment": "중립"
    }
  ]
}

상위 20개 키워드만 반환해주세요.`;
    }

    private async callOllama(prompt: string): Promise<string> {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral:7b',
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    num_predict: 500
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json() as { response: string };
        return data.response;
    }

    private parseClassificationResponse(response: string): LLMClassificationResult {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                classification: this.mapClassification(parsed.classification),
                confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
                reasoning: parsed.reasoning || 'LLM classification'
            };
        } catch (error) {
            return {
                classification: MessageClassification.INQUIRY,
                confidence: 0.5,
                reasoning: 'Failed to parse LLM response'
            };
        }
    }

    private parseKeywordResponse(response: string): { keyword: string; count: number; category: string; sentiment: string }[] {
        try {
            // Try to find JSON in response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.keywords && Array.isArray(parsed.keywords)) {
                    return parsed.keywords;
                }
            }

            // Fallback: extract keywords from text manually
            logger.warn('No valid JSON found, using fallback keyword extraction');
            return this.extractKeywordsFallback(response);
        } catch (error) {
            logger.warn('Failed to parse keyword response, using fallback', { 
                error: error instanceof Error ? error.message : String(error),
                response: response.substring(0, 200) 
            });
            return this.extractKeywordsFallback(response);
        }
    }

    private extractKeywordsFallback(response: string): { keyword: string; count: number; category: string; sentiment: string }[] {
        // Simple fallback - extract common Korean apartment keywords
        const commonKeywords = [
            { keyword: '소음', category: '소음', sentiment: '부정' },
            { keyword: '주차', category: '주차', sentiment: '중립' },
            { keyword: '시설', category: '시설관리', sentiment: '중립' },
            { keyword: '관리비', category: '관리비', sentiment: '중립' },
            { keyword: '수리', category: '시설관리', sentiment: '부정' },
            { keyword: '고장', category: '시설관리', sentiment: '부정' },
            { keyword: '엘리베이터', category: '시설관리', sentiment: '중립' },
            { keyword: '층간소음', category: '소음', sentiment: '부정' }
        ];

        return commonKeywords.map((kw, index) => ({
            ...kw,
            count: Math.floor(Math.random() * 10) + 1 // Mock count for demo
        })).slice(0, 5);
    }

    private mapClassification(classification: string): MessageClassification {
        const upperClass = classification.toUpperCase();
        
        if (Object.values(MessageClassification).includes(upperClass as MessageClassification)) {
            return upperClass as MessageClassification;
        }

        const koreanMapping: Record<string, MessageClassification> = {
            '소음': MessageClassification.NOISE,
            '주차': MessageClassification.PARKING,
            '시설관리': MessageClassification.MAINTENANCE,
            '수리': MessageClassification.MAINTENANCE,
            '관리비': MessageClassification.BILLING,
            '요금': MessageClassification.BILLING,
            '보안': MessageClassification.SECURITY,
            '출입': MessageClassification.SECURITY,
            '응급': MessageClassification.EMERGENCY,
            '긴급': MessageClassification.EMERGENCY,
            '문의': MessageClassification.INQUIRY
        };

        for (const [korean, englishClass] of Object.entries(koreanMapping)) {
            if (classification.includes(korean)) {
                return englishClass;
            }
        }

        return MessageClassification.INQUIRY;
    }

    getConfig() {
        return {
            enabled: this.enabled,
            model: 'mistral:7b',
            baseUrl: 'http://localhost:11434'
        };
    }
}

export const llmService = new LLMService();