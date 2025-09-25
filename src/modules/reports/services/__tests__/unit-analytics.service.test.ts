import { UnitAnalyticsService, AnalyticsFilters } from '../unit-analytics.service';

// Mock in-memory store
class MockInMemoryStore {
    private messages: any[] = [];

    constructor(testMessages: any[] = []) {
        this.messages = testMessages;
    }

    getMessages(limit: number = 1000): any[] {
        return this.messages.slice(0, limit);
    }

    addMessage(message: any): void {
        this.messages.push(message);
    }

    clear(): void {
        this.messages = [];
    }
}

describe('UnitAnalyticsService', () => {
    let service: UnitAnalyticsService;
    let mockStore: MockInMemoryStore;

    // Sample test data
    const sampleMessages = [
        {
            id: 'msg_1',
            content: '101동 1502호에서 소음 문제입니다.',
            maskedContent: '101동 1502호*서 소* 문제입니다.',
            channel: 'sms',
            priority: 'high',
            status: 'classified',
            classification: 'noise',
            createdAt: new Date('2025-09-25T10:00:00Z'),
            sender: '010-1111-2222',
            maskedSender: '010-****-2222',
            apartmentUnit: {
                dong: 101,
                ho: 1502,
                floor: 15,
                formatted: '101동 1502호',
                confidence: 0.95,
                rawMatches: ['101동 1502호']
            }
        },
        {
            id: 'msg_2',
            content: '101동 1502호 또 소음입니다.',
            maskedContent: '101동 1502호 또 소*입니다.',
            channel: 'sms',
            priority: 'high',
            status: 'processed',
            classification: 'noise',
            createdAt: new Date('2025-09-25T11:00:00Z'),
            sender: '010-2222-3333',
            maskedSender: '010-****-3333',
            apartmentUnit: {
                dong: 101,
                ho: 1502,
                floor: 15,
                formatted: '101동 1502호',
                confidence: 0.95,
                rawMatches: ['101동 1502호']
            }
        },
        {
            id: 'msg_3',
            content: '203동 805호 엘리베이터 고장',
            maskedContent: '203동 805호 엘리베**터 고장',
            channel: 'email',
            priority: 'medium',
            status: 'classified',
            classification: 'maintenance',
            createdAt: new Date('2025-09-25T12:00:00Z'),
            sender: 'resident@example.com',
            maskedSender: 're***@example.com',
            apartmentUnit: {
                dong: 203,
                ho: 805,
                floor: 8,
                formatted: '203동 805호',
                confidence: 0.95,
                rawMatches: ['203동 805호']
            }
        },
        {
            id: 'msg_4',
            content: '일반 문의입니다.',
            maskedContent: '일* 문의입니다.',
            channel: 'web',
            priority: 'low',
            status: 'pending',
            classification: 'inquiry',
            createdAt: new Date('2025-09-25T13:00:00Z'),
            sender: 'user@example.com',
            maskedSender: 'us***@example.com',
            apartmentUnit: null // No apartment unit info
        }
    ];

    beforeEach(() => {
        mockStore = new MockInMemoryStore(sampleMessages);
        service = new UnitAnalyticsService(mockStore);
    });

    describe('getTopUnits', () => {
        it('should return top units with correct ranking', async () => {
            const result = await service.getTopUnits({}, 10);

            expect(result.success).toBe(true);
            expect(result.topUnits).toHaveLength(2); // Only units with apartment info
            
            // Check ranking (101동 1502호 should be first with 2 requests)
            expect(result.topUnits[0].apartmentUnit.formatted).toBe('101동 1502호');
            expect(result.topUnits[0].requestCount).toBe(2);
            expect(result.topUnits[1].apartmentUnit.formatted).toBe('203동 805호');
            expect(result.topUnits[1].requestCount).toBe(1);
        });

        it('should calculate correct metrics', async () => {
            const result = await service.getTopUnits({}, 10);

            expect(result.metrics.totalActiveUnits).toBe(2);
            expect(result.metrics.averageRequestsPerUnit).toBe(1.5); // (2 + 1) / 2
            expect(result.metrics.mostActiveBuilding).toBe('101동');
            expect(result.metrics.peakPeriod).toMatch(/\d{1,2}:00-\d{1,2}:00/);
        });

        it('should return correct summary statistics', async () => {
            const result = await service.getTopUnits({}, 10);

            expect(result.summary.totalActiveUnits).toBe(2);
            expect(result.summary.totalRequests).toBe(3); // Only messages with apartment units
            expect(result.summary.dateRange.start).toBeDefined();
            expect(result.summary.dateRange.end).toBeDefined();
        });

        it('should respect limit parameter', async () => {
            const result = await service.getTopUnits({}, 1);

            expect(result.topUnits).toHaveLength(1);
            expect(result.topUnits[0].apartmentUnit.formatted).toBe('101동 1502호');
        });

        it('should filter by date range', async () => {
            const filters: AnalyticsFilters = {
                startDate: '2025-09-25T11:30:00Z',
                endDate: '2025-09-25T13:30:00Z'
            };

            const result = await service.getTopUnits(filters, 10);

            expect(result.topUnits).toHaveLength(1);
            expect(result.topUnits[0].apartmentUnit.formatted).toBe('203동 805호');
            expect(result.summary.totalRequests).toBe(1);
        });

        it('should filter by categories', async () => {
            const filters: AnalyticsFilters = {
                categories: ['noise']
            };

            const result = await service.getTopUnits(filters, 10);

            expect(result.topUnits).toHaveLength(1);
            expect(result.topUnits[0].apartmentUnit.formatted).toBe('101동 1502호');
            expect(result.topUnits[0].requestCount).toBe(2);
            expect(result.summary.totalRequests).toBe(2);
        });

        it('should calculate category distribution correctly', async () => {
            const result = await service.getTopUnits({}, 10);

            const unit101 = result.topUnits.find(u => u.apartmentUnit.formatted === '101동 1502호');
            expect(unit101?.categoryDistribution).toEqual({
                'noise': 2
            });
            expect(unit101?.primaryCategory).toBe('noise');

            const unit203 = result.topUnits.find(u => u.apartmentUnit.formatted === '203동 805호');
            expect(unit203?.categoryDistribution).toEqual({
                'maintenance': 1
            });
            expect(unit203?.primaryCategory).toBe('maintenance');
        });

        it('should handle empty results gracefully', async () => {
            const emptyStore = new MockInMemoryStore([]);
            const emptyService = new UnitAnalyticsService(emptyStore);

            const result = await emptyService.getTopUnits({}, 10);

            expect(result.topUnits).toHaveLength(0);
            expect(result.metrics.totalActiveUnits).toBe(0);
            expect(result.metrics.averageRequestsPerUnit).toBe(0);
            expect(result.metrics.mostActiveBuilding).toBe('N/A');
            expect(result.summary.totalActiveUnits).toBe(0);
            expect(result.summary.totalRequests).toBe(0);
        });
    });

    describe('getUnitHistory', () => {
        it('should return correct unit history', async () => {
            const result = await service.getUnitHistory(101, 1502, {}, 1, 10);

            expect(result.unit.dong).toBe(101);
            expect(result.unit.ho).toBe(1502);
            expect(result.unit.floor).toBe(15);
            expect(result.unit.formatted).toBe('101동 1502호');
            expect(result.totalRequests).toBe(2);
            expect(result.requests).toHaveLength(2);
        });

        it('should return requests in chronological order (newest first)', async () => {
            const result = await service.getUnitHistory(101, 1502, {}, 1, 10);

            expect(result.requests[0].id).toBe('msg_2'); // More recent
            expect(result.requests[1].id).toBe('msg_1'); // Older
        });

        it('should handle pagination correctly', async () => {
            const result = await service.getUnitHistory(101, 1502, {}, 1, 1);

            expect(result.requests).toHaveLength(1);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(1);
            expect(result.pagination.total).toBe(2);
            expect(result.pagination.totalPages).toBe(2);
        });

        it('should filter by date range', async () => {
            const filters: AnalyticsFilters = {
                startDate: '2025-09-25T10:30:00Z',
                endDate: '2025-09-25T11:30:00Z'
            };

            const result = await service.getUnitHistory(101, 1502, filters, 1, 10);

            expect(result.requests).toHaveLength(1);
            expect(result.requests[0].id).toBe('msg_2');
        });

        it('should filter by categories', async () => {
            const filters: AnalyticsFilters = {
                categories: ['noise']
            };

            const result = await service.getUnitHistory(101, 1502, filters, 1, 10);

            expect(result.requests).toHaveLength(2);
            expect(result.requests.every(r => r.classification === 'noise')).toBe(true);
        });

        it('should throw error for non-existent unit', async () => {
            await expect(service.getUnitHistory(999, 9999, {}, 1, 10))
                .rejects.toThrow('Unit 999동 9999호 not found');
        });

        it('should handle unit with no requests in date range', async () => {
            const filters: AnalyticsFilters = {
                startDate: '2025-09-26T00:00:00Z',
                endDate: '2025-09-26T23:59:59Z'
            };

            await expect(service.getUnitHistory(101, 1502, filters, 1, 10))
                .rejects.toThrow('Unit 101동 1502호 not found or has no requests in the specified period');
        });
    });

    describe('getExportData', () => {
        it('should return correct export data structure', async () => {
            const result = await service.getExportData({});

            expect(result).toHaveLength(2);
            
            const unit101 = result.find(r => r.formatted_address === '101동 1502호');
            expect(unit101).toEqual({
                dong: 101,
                ho: 1502,
                floor: 15,
                formatted_address: '101동 1502호',
                total_requests: 2,
                noise_requests: 2,
                maintenance_requests: 0,
                parking_requests: 0,
                billing_requests: 0,
                inquiry_requests: 0,
                first_request_date: '2025-09-25T10:00:00.000Z',
                last_request_date: '2025-09-25T11:00:00.000Z',
                primary_category: 'noise',
                high_priority_requests: 2,
                processed_requests: 1
            });
        });

        it('should sort by total requests descending', async () => {
            const result = await service.getExportData({});

            expect(result[0].formatted_address).toBe('101동 1502호');
            expect(result[0].total_requests).toBe(2);
            expect(result[1].formatted_address).toBe('203동 805호');
            expect(result[1].total_requests).toBe(1);
        });

        it('should filter by date range', async () => {
            const filters: AnalyticsFilters = {
                startDate: '2025-09-25T11:30:00Z',
                endDate: '2025-09-25T13:30:00Z'
            };

            const result = await service.getExportData(filters);

            expect(result).toHaveLength(1);
            expect(result[0].formatted_address).toBe('203동 805호');
        });

        it('should filter by categories', async () => {
            const filters: AnalyticsFilters = {
                categories: ['maintenance']
            };

            const result = await service.getExportData(filters);

            expect(result).toHaveLength(1);
            expect(result[0].formatted_address).toBe('203동 805호');
            expect(result[0].maintenance_requests).toBe(1);
        });

        it('should handle empty results', async () => {
            const emptyStore = new MockInMemoryStore([]);
            const emptyService = new UnitAnalyticsService(emptyStore);

            const result = await emptyService.getExportData({});

            expect(result).toHaveLength(0);
        });
    });

    describe('calculateUnitMetrics', () => {
        it('should calculate building statistics correctly', async () => {
            const result = await service.calculateUnitMetrics({});

            expect(result.totalActiveUnits).toBe(2);
            expect(result.averageRequestsPerUnit).toBe(1.5);
            expect(result.mostActiveBuilding).toBe('101동');
        });

        it('should calculate peak period correctly', async () => {
            const result = await service.calculateUnitMetrics({});

            // Should find the hour with most requests
            expect(result.peakPeriod).toMatch(/\d{1,2}:00-\d{1,2}:00/);
        });

        it('should handle single unit correctly', async () => {
            const singleUnitMessages = [sampleMessages[2]]; // Only 203동 805호
            const singleStore = new MockInMemoryStore(singleUnitMessages);
            const singleService = new UnitAnalyticsService(singleStore);

            const result = await singleService.calculateUnitMetrics({});

            expect(result.totalActiveUnits).toBe(1);
            expect(result.averageRequestsPerUnit).toBe(1);
            expect(result.mostActiveBuilding).toBe('203동');
        });

        it('should handle no data gracefully', async () => {
            const emptyStore = new MockInMemoryStore([]);
            const emptyService = new UnitAnalyticsService(emptyStore);

            const result = await emptyService.calculateUnitMetrics({});

            expect(result.totalActiveUnits).toBe(0);
            expect(result.averageRequestsPerUnit).toBe(0);
            expect(result.mostActiveBuilding).toBe('N/A');
            expect(result.peakPeriod).toBe('N/A');
        });
    });

    describe('error handling', () => {
        it('should handle invalid date filters gracefully', async () => {
            const filters: AnalyticsFilters = {
                startDate: 'invalid-date',
                endDate: 'also-invalid'
            };

            // Should not throw, but use default dates
            const result = await service.getTopUnits(filters, 10);
            expect(result.topUnits).toBeDefined();
        });

        it('should handle empty categories filter', async () => {
            const filters: AnalyticsFilters = {
                categories: []
            };

            const result = await service.getTopUnits(filters, 10);
            expect(result.topUnits).toHaveLength(2); // Should return all units
        });

        it('should handle null apartment unit data', async () => {
            const messagesWithNulls = [
                ...sampleMessages,
                {
                    id: 'msg_null',
                    content: 'Message without apartment unit',
                    apartmentUnit: null,
                    createdAt: new Date('2025-09-25T14:00:00Z'),
                    classification: 'inquiry'
                }
            ];

            const storeWithNulls = new MockInMemoryStore(messagesWithNulls);
            const serviceWithNulls = new UnitAnalyticsService(storeWithNulls);

            const result = await serviceWithNulls.getTopUnits({}, 10);
            
            // Should still only return units with apartment info
            expect(result.topUnits).toHaveLength(2);
            expect(result.summary.totalRequests).toBe(3); // Only messages with apartment units
        });
    });
});