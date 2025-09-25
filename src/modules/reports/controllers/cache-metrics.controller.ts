import { Request, Response } from 'express';
import { cacheService } from '@/shared/services/cache.service';
import { logger } from '@/shared/utils/logger';

export class CacheMetricsController {
    /**
     * Get cache statistics
     * GET /api/reports/cache/stats
     */
    async getCacheStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = cacheService.getStats();
            
            res.json({
                success: true,
                data: {
                    ...stats,
                    hitRate: this.calculateHitRate(),
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error getting cache stats', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve cache statistics'
            });
        }
    }

    /**
     * Clear cache
     * POST /api/reports/cache/clear
     */
    async clearCache(req: Request, res: Response): Promise<void> {
        try {
            const statsBefore = cacheService.getStats();
            cacheService.clear();
            
            logger.info('Cache cleared manually', { 
                entriesCleared: statsBefore.totalEntries,
                memoryFreed: statsBefore.memoryUsage
            });

            res.json({
                success: true,
                data: {
                    message: 'Cache cleared successfully',
                    entriesCleared: statsBefore.totalEntries,
                    memoryFreed: statsBefore.memoryUsage
                }
            });

        } catch (error) {
            logger.error('Error clearing cache', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to clear cache'
            });
        }
    }

    /**
     * Clear expired cache entries
     * POST /api/reports/cache/cleanup
     */
    async cleanupCache(req: Request, res: Response): Promise<void> {
        try {
            const removedCount = cacheService.clearExpired();
            
            res.json({
                success: true,
                data: {
                    message: 'Cache cleanup completed',
                    expiredEntriesRemoved: removedCount
                }
            });

        } catch (error) {
            logger.error('Error cleaning up cache', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup cache'
            });
        }
    }

    /**
     * Calculate cache hit rate (simplified - would need proper metrics in production)
     */
    private calculateHitRate(): number {
        // In a real implementation, you'd track hits and misses
        // For now, return a placeholder
        return 0.85; // 85% hit rate placeholder
    }
}

export const cacheMetricsController = new CacheMetricsController();