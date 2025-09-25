import { logger } from '@/shared/utils/logger';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

export class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

    /**
     * Get cached data
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            logger.debug('Cache entry expired and removed', { key });
            return null;
        }

        logger.debug('Cache hit', { key });
        return entry.data as T;
    }

    /**
     * Set cached data
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL
        };

        this.cache.set(key, entry);
        logger.debug('Cache entry set', { key, ttl: entry.ttl });
    }

    /**
     * Delete cached data
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug('Cache entry deleted', { key });
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.debug('Cache cleared', { entriesRemoved: size });
    }

    /**
     * Clear expired entries
     */
    clearExpired(): number {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            logger.debug('Expired cache entries cleared', { removedCount });
        }

        return removedCount;
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        totalEntries: number;
        expiredEntries: number;
        memoryUsage: number;
    } {
        const now = Date.now();
        let expiredCount = 0;

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp > entry.ttl) {
                expiredCount++;
            }
        }

        return {
            totalEntries: this.cache.size,
            expiredEntries: expiredCount,
            memoryUsage: this.getMemoryUsage()
        };
    }

    /**
     * Generate cache key from parameters
     */
    generateKey(prefix: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${JSON.stringify(params[key])}`)
            .join('|');
        
        return `${prefix}:${sortedParams}`;
    }

    /**
     * Estimate memory usage (rough calculation)
     */
    private getMemoryUsage(): number {
        let size = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            size += key.length * 2; // Rough string size
            size += JSON.stringify(entry.data).length * 2; // Rough data size
            size += 24; // Rough overhead per entry
        }

        return size;
    }

    /**
     * Start automatic cleanup of expired entries
     */
    startCleanupInterval(intervalMs: number = 60000): NodeJS.Timeout {
        return setInterval(() => {
            this.clearExpired();
        }, intervalMs);
    }
}

// Global cache instance
export const cacheService = new CacheService();

// Start automatic cleanup
cacheService.startCleanupInterval();