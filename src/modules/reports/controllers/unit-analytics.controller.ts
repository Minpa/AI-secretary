import { Request, Response } from 'express';
import { UnitAnalyticsService, AnalyticsFilters } from '../services/unit-analytics.service';
import { inMemoryStore } from '@/shared/database/in-memory-store';
import { logger } from '@/shared/utils/logger';

export class UnitAnalyticsController {
    private unitAnalyticsService: UnitAnalyticsService;

    constructor() {
        this.unitAnalyticsService = new UnitAnalyticsService(inMemoryStore);
    }

    /**
     * Get unit analytics data
     * GET /api/reports/units/analytics
     */
    async getUnitAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, categories, limit } = req.query;

            // Validate and parse query parameters
            const filters: AnalyticsFilters = {};
            
            if (startDate) {
                const parsedStartDate = new Date(startDate as string);
                if (isNaN(parsedStartDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.startDate = parsedStartDate.toISOString();
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate as string);
                if (isNaN(parsedEndDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid endDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.endDate = parsedEndDate.toISOString();
            }

            if (categories) {
                if (typeof categories === 'string') {
                    filters.categories = categories.split(',').map(c => c.trim());
                } else if (Array.isArray(categories)) {
                    filters.categories = categories as string[];
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid categories format. Use comma-separated string or array.'
                    });
                    return;
                }
            }

            const limitNum = limit ? parseInt(limit as string, 10) : 10;
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid limit. Must be a number between 1 and 100.'
                });
                return;
            }

            logger.info('Getting unit analytics', { filters, limit: limitNum });

            const analyticsData = await this.unitAnalyticsService.getTopUnits(filters, limitNum);

            res.json({
                success: true,
                data: analyticsData
            });

        } catch (error) {
            logger.error('Error in getUnitAnalytics', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve unit analytics'
            });
        }
    }

    /**
     * Get unit request history
     * GET /api/reports/units/:dong/:ho/history
     */
    async getUnitHistory(req: Request, res: Response): Promise<void> {
        try {
            const { dong, ho } = req.params;
            const { startDate, endDate, categories, page, limit } = req.query;

            // Validate dong and ho parameters
            const dongNum = parseInt(dong, 10);
            const hoNum = parseInt(ho, 10);

            if (isNaN(dongNum) || dongNum < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid dong parameter. Must be a positive number.'
                });
                return;
            }

            if (isNaN(hoNum) || hoNum < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid ho parameter. Must be a positive number.'
                });
                return;
            }

            // Validate and parse query parameters
            const filters: AnalyticsFilters = {};
            
            if (startDate) {
                const parsedStartDate = new Date(startDate as string);
                if (isNaN(parsedStartDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.startDate = parsedStartDate.toISOString();
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate as string);
                if (isNaN(parsedEndDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid endDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.endDate = parsedEndDate.toISOString();
            }

            if (categories) {
                if (typeof categories === 'string') {
                    filters.categories = categories.split(',').map(c => c.trim());
                } else if (Array.isArray(categories)) {
                    filters.categories = categories as string[];
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid categories format. Use comma-separated string or array.'
                    });
                    return;
                }
            }

            const pageNum = page ? parseInt(page as string, 10) : 1;
            if (isNaN(pageNum) || pageNum < 1) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid page parameter. Must be a positive number.'
                });
                return;
            }

            const limitNum = limit ? parseInt(limit as string, 10) : 10;
            if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid limit. Must be a number between 1 and 50.'
                });
                return;
            }

            logger.info('Getting unit history', { dong: dongNum, ho: hoNum, filters, page: pageNum, limit: limitNum });

            const historyData = await this.unitAnalyticsService.getUnitHistory(
                dongNum, 
                hoNum, 
                filters, 
                pageNum, 
                limitNum
            );

            res.json({
                success: true,
                data: historyData
            });

        } catch (error) {
            logger.error('Error in getUnitHistory', { error, params: req.params });
            
            if (error instanceof Error && error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve unit history'
                });
            }
        }
    }

    /**
     * Export unit analytics data as CSV
     * GET /api/reports/units/export
     */
    async exportUnitAnalytics(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, categories, format } = req.query;

            // Validate format parameter
            if (format && format !== 'csv') {
                res.status(400).json({
                    success: false,
                    error: 'Invalid format. Only CSV format is supported.'
                });
                return;
            }

            // Validate and parse query parameters
            const filters: AnalyticsFilters = {};
            
            if (startDate) {
                const parsedStartDate = new Date(startDate as string);
                if (isNaN(parsedStartDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid startDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.startDate = parsedStartDate.toISOString();
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate as string);
                if (isNaN(parsedEndDate.getTime())) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid endDate format. Use ISO 8601 format.'
                    });
                    return;
                }
                filters.endDate = parsedEndDate.toISOString();
            }

            if (categories) {
                if (typeof categories === 'string') {
                    filters.categories = categories.split(',').map(c => c.trim());
                } else if (Array.isArray(categories)) {
                    filters.categories = categories as string[];
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid categories format. Use comma-separated string or array.'
                    });
                    return;
                }
            }

            logger.info('Exporting unit analytics', { filters });

            const exportData = await this.unitAnalyticsService.getExportData(filters);

            if (exportData.length === 0) {
                res.status(404).json({
                    success: false,
                    error: 'No data available for export with the specified filters.'
                });
                return;
            }

            // Generate CSV content
            const csvHeaders = [
                'Dong',
                'Ho',
                'Floor',
                'Formatted Address',
                'Total Requests',
                'Noise Requests',
                'Maintenance Requests',
                'Parking Requests',
                'Billing Requests',
                'Inquiry Requests',
                'First Request Date',
                'Last Request Date',
                'Primary Category',
                'High Priority Requests',
                'Processed Requests'
            ];

            const csvRows = exportData.map(row => [
                row.dong,
                row.ho,
                row.floor,
                row.formatted_address,
                row.total_requests,
                row.noise_requests,
                row.maintenance_requests,
                row.parking_requests,
                row.billing_requests,
                row.inquiry_requests,
                row.first_request_date,
                row.last_request_date,
                row.primary_category,
                row.high_priority_requests,
                row.processed_requests
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(cell => 
                    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
                ).join(','))
            ].join('\n');

            // Set response headers for CSV download
            const filename = `unit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

            logger.info('Unit analytics exported successfully', { 
                recordCount: exportData.length,
                filename,
                filters
            });

            res.send(csvContent);

        } catch (error) {
            logger.error('Error in exportUnitAnalytics', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to export unit analytics'
            });
        }
    }
}