import { Request, Response } from 'express';
import { UnitAnalyticsController } from '../unit-analytics.controller';

// Mock the in-memory store
const mockStore = {
    getMessages: jest.fn()
};

// Mock the UnitAnalyticsService
jest.mock('../unit-analytics.service', () => {
    return {
        UnitAnalyticsService: jest.fn().mockImplementation(() => ({
            getTopUnits: jest.fn(),
            getUnitHistory: jest.fn(),
            getExportData: jest.fn()
        }))
    };
});

describe('UnitAnalyticsController', () => {
    let controller: UnitAnalyticsController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockService: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        controller = new UnitAnalyticsController();
        mockService = (controller as any).unitAnalyticsService;

        mockRequest = {
            query: {},
            params: {}
        };

        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            send: jest.fn()
        };
    });

    describe('getUnitAnalytics', () => {
        it('should return unit analytics successfully', async () => {
            const mockData = {
                topUnits: [
                    {
                        apartmentUnit: { dong: 101, ho: 1502, formatted: '101동 1502호' },
                        requestCount: 2,
                        primaryCategory: 'noise'
                    }
                ],
                metrics: {
                    totalActiveUnits: 1,
                    averageRequestsPerUnit: 2,
                    mostActiveBuilding: '101동',
                    peakPeriod: '10:00-11:00'
                },
                summary: {
                    totalActiveUnits: 1,
                    totalRequests: 2,
                    dateRange: { start: '2025-09-01', end: '2025-09-25' }
                }
            };

            mockService.getTopUnits.mockResolvedValue(mockData);

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockService.getTopUnits).toHaveBeenCalledWith({}, 10);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockData
            });
        });

        it('should handle query parameters correctly', async () => {
            mockRequest.query = {
                startDate: '2025-09-01',
                endDate: '2025-09-25',
                categories: 'noise,maintenance',
                limit: '5'
            };

            mockService.getTopUnits.mockResolvedValue({
                topUnits: [],
                metrics: {},
                summary: {}
            });

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockService.getTopUnits).toHaveBeenCalledWith({
                startDate: '2025-09-01T00:00:00.000Z',
                endDate: '2025-09-25T00:00:00.000Z',
                categories: ['noise', 'maintenance']
            }, 5);
        });

        it('should validate date parameters', async () => {
            mockRequest.query = {
                startDate: 'invalid-date'
            };

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid startDate format. Use ISO 8601 format.'
            });
        });

        it('should validate limit parameter', async () => {
            mockRequest.query = {
                limit: '150' // Over maximum
            };

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid limit. Must be a number between 1 and 100.'
            });
        });

        it('should handle service errors', async () => {
            mockService.getTopUnits.mockRejectedValue(new Error('Database error'));

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve unit analytics'
            });
        });
    });

    describe('getUnitHistory', () => {
        beforeEach(() => {
            mockRequest.params = {
                dong: '101',
                ho: '1502'
            };
        });

        it('should return unit history successfully', async () => {
            const mockHistoryData = {
                unit: { dong: 101, ho: 1502, formatted: '101동 1502호' },
                totalRequests: 5,
                requests: [
                    {
                        id: 'msg_1',
                        content: 'Test message',
                        createdAt: '2025-09-25T10:00:00Z'
                    }
                ],
                pagination: { page: 1, limit: 10, total: 5, totalPages: 1 }
            };

            mockService.getUnitHistory.mockResolvedValue(mockHistoryData);

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockService.getUnitHistory).toHaveBeenCalledWith(101, 1502, {}, 1, 10);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockHistoryData
            });
        });

        it('should validate dong parameter', async () => {
            mockRequest.params = { dong: 'invalid', ho: '1502' };

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid dong parameter. Must be a positive number.'
            });
        });

        it('should validate ho parameter', async () => {
            mockRequest.params = { dong: '101', ho: 'invalid' };

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid ho parameter. Must be a positive number.'
            });
        });

        it('should handle pagination parameters', async () => {
            mockRequest.query = {
                page: '2',
                limit: '5'
            };

            mockService.getUnitHistory.mockResolvedValue({
                unit: {},
                totalRequests: 0,
                requests: [],
                pagination: {}
            });

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockService.getUnitHistory).toHaveBeenCalledWith(101, 1502, {}, 2, 5);
        });

        it('should handle unit not found error', async () => {
            mockService.getUnitHistory.mockRejectedValue(new Error('Unit 101동 1502호 not found'));

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Unit 101동 1502호 not found'
            });
        });

        it('should handle general service errors', async () => {
            mockService.getUnitHistory.mockRejectedValue(new Error('Database connection failed'));

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to retrieve unit history'
            });
        });
    });

    describe('exportUnitAnalytics', () => {
        it('should export CSV successfully', async () => {
            const mockExportData = [
                {
                    dong: 101,
                    ho: 1502,
                    floor: 15,
                    formatted_address: '101동 1502호',
                    total_requests: 2,
                    noise_requests: 1,
                    maintenance_requests: 1,
                    parking_requests: 0,
                    billing_requests: 0,
                    inquiry_requests: 0,
                    first_request_date: '2025-09-25T10:00:00Z',
                    last_request_date: '2025-09-25T11:00:00Z',
                    primary_category: 'noise',
                    high_priority_requests: 2,
                    processed_requests: 1
                }
            ];

            mockService.getExportData.mockResolvedValue(mockExportData);

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockService.getExportData).toHaveBeenCalledWith({});
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment; filename='));
            expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('Dong,Ho,Floor'));
        });

        it('should validate format parameter', async () => {
            mockRequest.query = {
                format: 'json' // Invalid format
            };

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid format. Only CSV format is supported.'
            });
        });

        it('should handle empty export data', async () => {
            mockService.getExportData.mockResolvedValue([]);

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'No data available for export with the specified filters.'
            });
        });

        it('should handle CSV generation with special characters', async () => {
            const mockExportData = [
                {
                    dong: 101,
                    ho: 1502,
                    floor: 15,
                    formatted_address: '101동 1502호',
                    total_requests: 1,
                    noise_requests: 0,
                    maintenance_requests: 0,
                    parking_requests: 0,
                    billing_requests: 0,
                    inquiry_requests: 0,
                    first_request_date: '2025-09-25T10:00:00Z',
                    last_request_date: '2025-09-25T10:00:00Z',
                    primary_category: 'inquiry, with comma',
                    high_priority_requests: 0,
                    processed_requests: 1
                }
            ];

            mockService.getExportData.mockResolvedValue(mockExportData);

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            const csvContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
            expect(csvContent).toContain('"inquiry, with comma"'); // Should be quoted
        });

        it('should handle service errors during export', async () => {
            mockService.getExportData.mockRejectedValue(new Error('Export failed'));

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to export unit analytics'
            });
        });

        it('should apply filters to export', async () => {
            mockRequest.query = {
                startDate: '2025-09-01',
                endDate: '2025-09-25',
                categories: 'noise,maintenance'
            };

            mockService.getExportData.mockResolvedValue([]);

            await controller.exportUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockService.getExportData).toHaveBeenCalledWith({
                startDate: '2025-09-01T00:00:00.000Z',
                endDate: '2025-09-25T00:00:00.000Z',
                categories: ['noise', 'maintenance']
            });
        });
    });

    describe('parameter validation edge cases', () => {
        it('should handle array categories parameter', async () => {
            mockRequest.query = {
                categories: ['noise', 'maintenance'] // Array instead of string
            };

            mockService.getTopUnits.mockResolvedValue({
                topUnits: [],
                metrics: {},
                summary: {}
            });

            await controller.getUnitAnalytics(mockRequest as Request, mockResponse as Response);

            expect(mockService.getTopUnits).toHaveBeenCalledWith({
                categories: ['noise', 'maintenance']
            }, 10);
        });

        it('should handle zero dong parameter', async () => {
            mockRequest.params = { dong: '0', ho: '1502' };

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid dong parameter. Must be a positive number.'
            });
        });

        it('should handle negative ho parameter', async () => {
            mockRequest.params = { dong: '101', ho: '-1' };

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid ho parameter. Must be a positive number.'
            });
        });

        it('should handle zero page parameter', async () => {
            mockRequest.params = { dong: '101', ho: '1502' };
            mockRequest.query = { page: '0' };

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid page parameter. Must be a positive number.'
            });
        });

        it('should handle limit over maximum for history', async () => {
            mockRequest.params = { dong: '101', ho: '1502' };
            mockRequest.query = { limit: '100' }; // Over max of 50

            await controller.getUnitHistory(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid limit. Must be a number between 1 and 50.'
            });
        });
    });
});