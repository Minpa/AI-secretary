import { Request, Response } from 'express';
import { ClassificationService } from '../services/classification.service';
import { llmService } from '../../../shared/services/llm.service.simple';
import { logger } from '@/shared/utils/logger';

export class LLMController {
    private classificationService: ClassificationService;

    constructor() {
        this.classificationService = new ClassificationService();
    }

    /**
     * Get LLM service status
     */
    async getStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = await this.classificationService.getLLMStatus();
            
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Error getting LLM status', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get LLM status'
            });
        }
    }

    /**
     * Enable or disable LLM service
     */
    async toggleLLM(req: Request, res: Response): Promise<void> {
        try {
            const { enabled } = req.body;
            
            if (typeof enabled !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: 'enabled must be a boolean'
                });
                return;
            }

            this.classificationService.setLLMEnabled(enabled);
            
            const status = await this.classificationService.getLLMStatus();
            
            logger.info('LLM service toggled', { enabled, status });
            
            res.json({
                success: true,
                data: {
                    message: `LLM service ${enabled ? 'enabled' : 'disabled'}`,
                    status
                }
            });
        } catch (error) {
            logger.error('Error toggling LLM service', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to toggle LLM service'
            });
        }
    }

    /**
     * Test LLM classification with sample text
     */
    async testClassification(req: Request, res: Response): Promise<void> {
        try {
            const { text } = req.body;
            
            if (!text || typeof text !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'text is required and must be a string'
                });
                return;
            }

            const available = await llmService.isAvailable();
            if (!available) {
                res.status(503).json({
                    success: false,
                    error: 'LLM service is not available'
                });
                return;
            }

            const result = await llmService.classifyMessage(text);
            
            res.json({
                success: true,
                data: {
                    input: text,
                    result
                }
            });
        } catch (error) {
            logger.error('Error testing LLM classification', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to test LLM classification'
            });
        }
    }

    /**
     * Extract keywords using LLM
     */
    async extractKeywords(req: Request, res: Response): Promise<void> {
        try {
            const { messages } = req.body;
            
            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({
                    success: false,
                    error: 'messages array is required'
                });
                return;
            }

            const available = await llmService.isAvailable();
            if (!available) {
                res.status(503).json({
                    success: false,
                    error: 'LLM service is not available'
                });
                return;
            }

            const keywords = await llmService.extractKeywords(messages);
            
            res.json({
                success: true,
                data: {
                    keywords,
                    total: keywords.length,
                    method: 'llm-analysis'
                }
            });
        } catch (error) {
            logger.error('Error extracting keywords with LLM', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to extract keywords'
            });
        }
    }

    /**
     * Get LLM configuration
     */
    async getConfig(req: Request, res: Response): Promise<void> {
        try {
            const config = llmService.getConfig();
            
            // Don't expose sensitive information
            const safeConfig = {
                enabled: config.enabled,
                model: config.model,
                baseUrl: config.baseUrl
            };
            
            res.json({
                success: true,
                data: safeConfig
            });
        } catch (error) {
            logger.error('Error getting LLM config', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get LLM configuration'
            });
        }
    }
}