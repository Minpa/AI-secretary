import { logger } from '@/shared/utils/logger';
import { cacheService } from '@/shared/services/cache.service';

export interface ApartmentUnit {
    dong: number;
    ho: number;
    floor: number;
    formatted: string;
    confidence: number;
}

export interface TopUnit {
    apartmentUnit: ApartmentUnit;
    requestCount: number;
    lastRequestDate: string;
    primaryCategory: string;
    categoryDistribution: Record<string, number>;
}

export interface UnitMetrics {
    totalActiveUnits: number;
    averageRequestsPerUnit: number;
    mostActiveBuilding: string;
    peakPeriod: string;
}

export interface UnitRequest {
    id: string;
    content: string;
    maskedContent: string;
    channel: 'sms' | 'email' | 'web' | 'call';
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'classified' | 'assigned' | 'processed';
    classification: string;
    createdAt: string;
    sender: string;
    maskedSender: string;
}

export interface UnitHistoryData {
    unit: ApartmentUnit;
    totalRequests: number;
    dateRange: { start: string; end: string };
    requests: UnitRequest[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface AnalyticsFilters {
    startDate?: string;
    endDate?: string;
    categories?: string[];
}

export class UnitAnalyticsService {
    private store: any; // In-memory store will be injected

    constructor(store: any) {
        this.store = store;
    }

    /**
     * Get top requesting apartment units with analytics
     */
    async getTopUnits(filters: AnalyticsFilters = {}, limit: number = 10): Promise<{
        topUnits: TopUnit[];
        metrics: UnitMetrics;
        summary: {
            totalActiveUnits: number;
            totalRequests: number;
            dateRange: { start: string; end: string };
        };
    }> {
        try {
            logger.info('Getting top requesting units', { filters, limit });

            // Generate cache key
            const cacheKey = cacheService.generateKey('unit-analytics', { filters, limit });
            
            // Try to get from cache first
            const cachedResult = cacheService.get(cacheKey);
            if (cachedResult) {
                logger.info('Returning cached unit analytics', { cacheKey });
                return cachedResult;
            }

            // Build date range
            const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            const endDate = new Date(filters.endDate || new Date().toISOString());

            // Get all messages from in-memory store
            const allMessages = this.store.getMessages(1000); // Get more messages for analysis

            // Filter messages based on criteria
            const filteredMessages = allMessages.filter(message => {
                // Must have apartment unit info
                if (!message.apartmentUnit || !message.apartmentUnit.dong || !message.apartmentUnit.ho) {
                    return false;
                }

                // Date range filter
                const messageDate = new Date(message.createdAt);
                if (messageDate < startDate || messageDate > endDate) {
                    return false;
                }

                // Category filter
                if (filters.categories && filters.categories.length > 0) {
                    if (!message.classification || !filters.categories.includes(message.classification)) {
                        return false;
                    }
                }

                return true;
            });

            // Group messages by apartment unit
            const unitGroups = new Map<string, any[]>();
            filteredMessages.forEach(message => {
                const unitKey = message.apartmentUnit.formatted;
                if (!unitGroups.has(unitKey)) {
                    unitGroups.set(unitKey, []);
                }
                unitGroups.get(unitKey)!.push(message);
            });

            // Calculate top units
            const topUnitsData: TopUnit[] = [];
            unitGroups.forEach((messages, unitKey) => {
                const firstMessage = messages[0];
                const apartmentUnit = firstMessage.apartmentUnit;

                // Count requests
                const requestCount = messages.length;

                // Find last request date
                const lastRequestDate = messages
                    .map(m => new Date(m.createdAt))
                    .sort((a, b) => b.getTime() - a.getTime())[0]
                    .toISOString();

                // Calculate category distribution
                const categoryDistribution: Record<string, number> = {};
                messages.forEach(message => {
                    const category = message.classification || 'unknown';
                    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
                });

                // Find primary category (most frequent)
                const primaryCategory = Object.entries(categoryDistribution)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

                topUnitsData.push({
                    apartmentUnit,
                    requestCount,
                    lastRequestDate,
                    primaryCategory,
                    categoryDistribution
                });
            });

            // Sort by request count and take top N
            const topUnits = topUnitsData
                .sort((a, b) => {
                    if (b.requestCount !== a.requestCount) {
                        return b.requestCount - a.requestCount;
                    }
                    return new Date(b.lastRequestDate).getTime() - new Date(a.lastRequestDate).getTime();
                })
                .slice(0, limit);

            // Calculate metrics
            const metrics = await this.calculateUnitMetrics(filters);

            // Calculate summary
            const summary = {
                totalActiveUnits: unitGroups.size,
                totalRequests: filteredMessages.length,
                dateRange: { 
                    start: startDate.toISOString(), 
                    end: endDate.toISOString() 
                }
            };

            const result = {
                topUnits,
                metrics,
                summary
            };

            // Cache the result for 2 minutes (analytics data changes frequently)
            cacheService.set(cacheKey, result, 2 * 60 * 1000);

            logger.info('Top units retrieved successfully', { 
                topUnitsCount: topUnits.length,
                totalActiveUnits: summary.totalActiveUnits,
                totalRequests: summary.totalRequests,
                cached: true
            });

            return result;

        } catch (error) {
            logger.error('Error getting top units', { error, filters, limit });
            throw new Error('Failed to retrieve unit analytics');
        }
    }

    /**
     * Calculate unit metrics (averages, most active building, peak periods)
     */
    async calculateUnitMetrics(filters: AnalyticsFilters = {}): Promise<UnitMetrics> {
        try {
            const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            const endDate = new Date(filters.endDate || new Date().toISOString());

            // Get all messages from in-memory store
            const allMessages = this.store.getMessages(1000);

            // Filter messages based on criteria
            const filteredMessages = allMessages.filter(message => {
                if (!message.apartmentUnit || !message.apartmentUnit.dong || !message.apartmentUnit.ho) {
                    return false;
                }

                const messageDate = new Date(message.createdAt);
                if (messageDate < startDate || messageDate > endDate) {
                    return false;
                }

                if (filters.categories && filters.categories.length > 0) {
                    if (!message.classification || !filters.categories.includes(message.classification)) {
                        return false;
                    }
                }

                return true;
            });

            // Calculate building-level statistics
            const buildingStats = new Map<string, { requestCount: number; unitCount: Set<string> }>();
            const unitRequestCounts: number[] = [];
            const hourCounts = new Map<number, number>();

            // Group by building and collect stats
            const unitGroups = new Map<string, any[]>();
            filteredMessages.forEach(message => {
                const building = message.apartmentUnit.dong.toString();
                const unitKey = message.apartmentUnit.formatted;
                const hour = new Date(message.createdAt).getHours();

                // Building stats
                if (!buildingStats.has(building)) {
                    buildingStats.set(building, { requestCount: 0, unitCount: new Set() });
                }
                const buildingStat = buildingStats.get(building)!;
                buildingStat.requestCount++;
                buildingStat.unitCount.add(unitKey);

                // Unit groups for average calculation
                if (!unitGroups.has(unitKey)) {
                    unitGroups.set(unitKey, []);
                }
                unitGroups.get(unitKey)!.push(message);

                // Hour counts for peak period
                hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
            });

            // Calculate unit request counts for average
            unitGroups.forEach((messages) => {
                unitRequestCounts.push(messages.length);
            });

            // Find most active building
            let mostActiveBuilding = 'N/A';
            let maxBuildingRequests = 0;
            buildingStats.forEach((stats, building) => {
                if (stats.requestCount > maxBuildingRequests) {
                    maxBuildingRequests = stats.requestCount;
                    mostActiveBuilding = `${building}동`;
                }
            });

            // Calculate average requests per unit
            const averageRequestsPerUnit = unitRequestCounts.length > 0 
                ? unitRequestCounts.reduce((sum, count) => sum + count, 0) / unitRequestCounts.length 
                : 0;

            // Find peak period
            let peakPeriod = 'N/A';
            let maxHourRequests = 0;
            hourCounts.forEach((count, hour) => {
                if (count > maxHourRequests) {
                    maxHourRequests = count;
                    peakPeriod = `${hour}:00-${hour + 1}:00`;
                }
            });

            const metrics: UnitMetrics = {
                totalActiveUnits: unitGroups.size,
                averageRequestsPerUnit: Math.round(averageRequestsPerUnit * 100) / 100, // Round to 2 decimal places
                mostActiveBuilding,
                peakPeriod
            };

            logger.info('Unit metrics calculated', metrics);
            return metrics;

        } catch (error) {
            logger.error('Error calculating unit metrics', { error, filters });
            throw new Error('Failed to calculate unit metrics');
        }
    }

    /**
     * Get detailed request history for a specific apartment unit
     */
    async getUnitHistory(
        dong: number, 
        ho: number, 
        filters: AnalyticsFilters = {},
        page: number = 1,
        limit: number = 10
    ): Promise<UnitHistoryData> {
        try {
            logger.info('Getting unit history', { dong, ho, filters, page, limit });

            // Generate cache key
            const cacheKey = cacheService.generateKey('unit-history', { dong, ho, filters, page, limit });
            
            // Try to get from cache first
            const cachedResult = cacheService.get<UnitHistoryData>(cacheKey);
            if (cachedResult) {
                logger.info('Returning cached unit history', { dong, ho, cacheKey });
                return cachedResult;
            }

            const startDate = new Date(filters.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
            const endDate = new Date(filters.endDate || new Date().toISOString());

            // Get all messages from in-memory store
            const allMessages = this.store.getMessages(1000);

            // Filter messages for this specific unit
            const unitMessages = allMessages.filter(message => {
                if (!message.apartmentUnit || 
                    message.apartmentUnit.dong !== dong || 
                    message.apartmentUnit.ho !== ho) {
                    return false;
                }

                const messageDate = new Date(message.createdAt);
                if (messageDate < startDate || messageDate > endDate) {
                    return false;
                }

                if (filters.categories && filters.categories.length > 0) {
                    if (!message.classification || !filters.categories.includes(message.classification)) {
                        return false;
                    }
                }

                return true;
            });

            if (unitMessages.length === 0) {
                throw new Error(`Unit ${dong}동 ${ho}호 not found or has no requests in the specified period`);
            }

            // Get unit information from the first message
            const firstMessage = unitMessages[0];
            const unit: ApartmentUnit = firstMessage.apartmentUnit;

            // Sort messages by date (newest first)
            unitMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Calculate pagination
            const totalRequests = unitMessages.length;
            const totalPages = Math.ceil(totalRequests / limit);
            const offset = (page - 1) * limit;

            // Get paginated results
            const paginatedMessages = unitMessages.slice(offset, offset + limit);

            // Transform to UnitRequest format
            const requests: UnitRequest[] = paginatedMessages.map(message => ({
                id: message.id,
                content: message.content,
                maskedContent: message.maskedContent,
                channel: message.channel,
                priority: message.priority,
                status: message.status,
                classification: message.classification || 'unknown',
                createdAt: message.createdAt.toISOString(),
                sender: message.sender,
                maskedSender: message.maskedSender
            }));

            const historyData: UnitHistoryData = {
                unit,
                totalRequests,
                dateRange: { 
                    start: startDate.toISOString(), 
                    end: endDate.toISOString() 
                },
                requests,
                pagination: {
                    page,
                    limit,
                    total: totalRequests,
                    totalPages
                }
            };

            // Cache the result for 5 minutes (history data is relatively stable)
            cacheService.set(cacheKey, historyData, 5 * 60 * 1000);

            logger.info('Unit history retrieved successfully', { 
                dong, 
                ho, 
                totalRequests, 
                requestsReturned: requests.length,
                page,
                totalPages,
                cached: true
            });

            return historyData;

        } catch (error) {
            logger.error('Error getting unit history', { error, dong, ho, filters, page, limit });
            throw new Error('Failed to retrieve unit history');
        }
    }

    /**
     * Invalidate cache when new data is added
     */
    invalidateCache(): void {
        // Clear all unit analytics related cache entries
        const stats = cacheService.getStats();
        
        // In a production system, you might want a more sophisticated approach
        // to only clear relevant cache entries
        cacheService.clear();
        
        logger.info('Unit analytics cache invalidated', { 
            previousEntries: stats.totalEntries,
            clearedCount: stats.totalEntries
        });
    }

    /**
     * Warm up cache with common queries
     */
    async warmUpCache(): Promise<void> {
        try {
            logger.info('Warming up unit analytics cache...');

            // Warm up common analytics queries
            const commonQueries = [
                { filters: {}, limit: 10 }, // Default query
                { filters: {}, limit: 5 },  // Smaller limit
                { filters: { categories: ['noise'] }, limit: 10 }, // Noise filter
                { filters: { categories: ['maintenance'] }, limit: 10 }, // Maintenance filter
            ];

            const warmupPromises = commonQueries.map(async ({ filters, limit }) => {
                try {
                    await this.getTopUnits(filters, limit);
                } catch (error) {
                    logger.warn('Cache warmup query failed', { filters, limit, error });
                }
            });

            await Promise.all(warmupPromises);
            
            const stats = cacheService.getStats();
            logger.info('Unit analytics cache warmed up', { 
                cacheEntries: stats.totalEntries,
                memoryUsage: stats.memoryUsage
            });

        } catch (error) {
            logger.error('Error warming up cache', { error });
        }
    }

    /**
     * Get export data for all units
     */
    async getExportData(filters: AnalyticsFilters = {}): Promise<any[]> {
        try {
            logger.info('Getting export data for units', { filters });

            const startDate = new Date(filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
            const endDate = new Date(filters.endDate || new Date().toISOString());

            // Get all messages from in-memory store
            const allMessages = this.store.getMessages(1000);

            // Filter messages based on criteria
            const filteredMessages = allMessages.filter(message => {
                if (!message.apartmentUnit || !message.apartmentUnit.dong || !message.apartmentUnit.ho) {
                    return false;
                }

                const messageDate = new Date(message.createdAt);
                if (messageDate < startDate || messageDate > endDate) {
                    return false;
                }

                if (filters.categories && filters.categories.length > 0) {
                    if (!message.classification || !filters.categories.includes(message.classification)) {
                        return false;
                    }
                }

                return true;
            });

            // Group messages by apartment unit
            const unitGroups = new Map<string, any[]>();
            filteredMessages.forEach(message => {
                const unitKey = message.apartmentUnit.formatted;
                if (!unitGroups.has(unitKey)) {
                    unitGroups.set(unitKey, []);
                }
                unitGroups.get(unitKey)!.push(message);
            });

            // Calculate export data for each unit
            const exportData: any[] = [];
            unitGroups.forEach((messages, unitKey) => {
                const firstMessage = messages[0];
                const apartmentUnit = firstMessage.apartmentUnit;

                // Count requests by category
                const categoryCounts = {
                    noise: 0,
                    maintenance: 0,
                    parking: 0,
                    billing: 0,
                    inquiry: 0
                };

                let highPriorityCount = 0;
                let processedCount = 0;
                const categoryDistribution: Record<string, number> = {};

                messages.forEach(message => {
                    // Category counts
                    const category = message.classification || 'unknown';
                    if (category in categoryCounts) {
                        (categoryCounts as any)[category]++;
                    }

                    // Category distribution for primary category
                    categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;

                    // Priority and status counts
                    if (message.priority === 'high') {
                        highPriorityCount++;
                    }
                    if (message.status === 'processed') {
                        processedCount++;
                    }
                });

                // Find primary category (most frequent)
                const primaryCategory = Object.entries(categoryDistribution)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

                // Find date range
                const dates = messages.map(m => new Date(m.createdAt));
                const firstRequestDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
                const lastRequestDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();

                exportData.push({
                    dong: apartmentUnit.dong,
                    ho: apartmentUnit.ho,
                    floor: apartmentUnit.floor,
                    formatted_address: apartmentUnit.formatted,
                    total_requests: messages.length,
                    noise_requests: categoryCounts.noise,
                    maintenance_requests: categoryCounts.maintenance,
                    parking_requests: categoryCounts.parking,
                    billing_requests: categoryCounts.billing,
                    inquiry_requests: categoryCounts.inquiry,
                    first_request_date: firstRequestDate,
                    last_request_date: lastRequestDate,
                    primary_category: primaryCategory,
                    high_priority_requests: highPriorityCount,
                    processed_requests: processedCount
                });
            });

            // Sort by total requests (descending) and last request date
            exportData.sort((a, b) => {
                if (b.total_requests !== a.total_requests) {
                    return b.total_requests - a.total_requests;
                }
                return new Date(b.last_request_date).getTime() - new Date(a.last_request_date).getTime();
            });

            logger.info('Export data retrieved successfully', { 
                unitsCount: exportData.length,
                dateRange: { 
                    start: startDate.toISOString(), 
                    end: endDate.toISOString() 
                }
            });

            return exportData;

        } catch (error) {
            logger.error('Error getting export data', { error, filters });
            throw new Error('Failed to retrieve export data');
        }
    }
}