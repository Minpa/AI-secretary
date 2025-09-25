import request from 'supertest';
import express from 'express';
import { reportsRoutes } from '../routes';
import { inMemoryStore } from '@/shared/database/in-memory-store';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/reports', reportsRoutes);

describe('Unit Analytics Integration Tests', () => {
    beforeEach(() => {
        // Clear store and add test data
        inMemoryStore.clear();
        
        // Add test messages with apartment units
        const testMessages = [
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
                content: '203동 805호 엘리베이터 고장',
                maskedContent: '203동 805호 엘리베**터 고장',
                channel: 'email',
                priority: 'medium',
                status: 'processed',
                classification: 'maintenance',
                createdAt: new Date('2025-09-25T11:00:00Z'),
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
            }
        ];

        testMessages.forEach(msg => inMemoryStore.saveMessage(msg));
    });

    afterEach(() => {
        inMemoryStore.clear();
    });

    describe('GET /api/reports/units/analytics', () => {
        it('should return unit analytics data', async () => {
            const response = await request(app)
                .get('/api/reports/units/analytics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('topUnits');
            expect(response.body.data).toHaveProperty('metrics');
            expect(response.body.data).toHaveProperty('summary');
            
            expect(response.body.data.topUnits).toHaveLength(2);
            expect(response.body.data.summary.totalActiveUnits).toBe(2);
            expect(response.body.data.summary.totalRequests).toBe(2);
        });

        it('should respect limit parameter', async () => {
            const response = await request(app)
                .get('/api/reports/units/analytics?limit=1')
                .expect(200);

            expect(response.body.data.topUnits).toHaveLength(1);
        });

        it('should filter by categories', async () => {
            const response = await request(app)
                .get('/api/reports/units/analytics?categories=noise')
                .expect(200);

            expect(response.body.data.topUnits).toHaveLength(1);
            expect(response.body.data.topUnits[0].apartmentUnit.formatted).toBe('101동 1502호');
            expect(response.body.data.summary.totalRequests).toBe(1);
        });

        it('should validate invalid limit', async () => {
            const response = await request(app)
                .get('/api/reports/units/analytics?limit=invalid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid limit');
        });
    });

    describe('GET /api/reports/units/:dong/:ho/history', () => {
        it('should return unit history', async () => {
            const response = await request(app)
                .get('/api/reports/units/101/1502/history')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('unit');
            expect(response.body.data).toHaveProperty('requests');
            expect(response.body.data).toHaveProperty('pagination');
            
            expect(response.body.data.unit.dong).toBe(101);
            expect(response.body.data.unit.ho).toBe(1502);
            expect(response.body.data.totalRequests).toBe(1);
        });

        it('should handle pagination', async () => {
            const response = await request(app)
                .get('/api/reports/units/101/1502/history?page=1&limit=1')
                .expect(200);

            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(1);
        });

        it('should return 404 for non-existent unit', async () => {
            const response = await request(app)
                .get('/api/reports/units/999/9999/history')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        it('should validate dong parameter', async () => {
            const response = await request(app)
                .get('/api/reports/units/invalid/1502/history')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid dong parameter');
        });
    });

    describe('GET /api/reports/units/export', () => {
        it('should export CSV data', async () => {
            const response = await request(app)
                .get('/api/reports/units/export?format=csv')
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
            
            const csvContent = response.text;
            expect(csvContent).toContain('Dong,Ho,Floor');
            expect(csvContent).toContain('101,1502,15');
            expect(csvContent).toContain('203,805,8');
        });

        it('should return 404 when no data to export', async () => {
            // Clear all data
            inMemoryStore.clear();

            const response = await request(app)
                .get('/api/reports/units/export?format=csv')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('No data available');
        });

        it('should validate format parameter', async () => {
            const response = await request(app)
                .get('/api/reports/units/export?format=json')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid format');
        });
    });

    describe('End-to-end workflow', () => {
        it('should support complete analytics workflow', async () => {
            // 1. Get analytics overview
            const analyticsResponse = await request(app)
                .get('/api/reports/units/analytics')
                .expect(200);

            const topUnit = analyticsResponse.body.data.topUnits[0];
            expect(topUnit).toBeDefined();

            // 2. Get detailed history for top unit
            const historyResponse = await request(app)
                .get(`/api/reports/units/${topUnit.apartmentUnit.dong}/${topUnit.apartmentUnit.ho}/history`)
                .expect(200);

            expect(historyResponse.body.data.unit.dong).toBe(topUnit.apartmentUnit.dong);
            expect(historyResponse.body.data.unit.ho).toBe(topUnit.apartmentUnit.ho);

            // 3. Export all data
            const exportResponse = await request(app)
                .get('/api/reports/units/export?format=csv')
                .expect(200);

            expect(exportResponse.text).toContain(topUnit.apartmentUnit.formatted);
        });

        it('should handle date filtering across all endpoints', async () => {
            const dateFilter = '?startDate=2025-09-25T10:30:00Z&endDate=2025-09-25T11:30:00Z';

            // Analytics with date filter
            const analyticsResponse = await request(app)
                .get(`/api/reports/units/analytics${dateFilter}`)
                .expect(200);

            expect(analyticsResponse.body.data.topUnits).toHaveLength(1);
            expect(analyticsResponse.body.data.topUnits[0].apartmentUnit.formatted).toBe('203동 805호');

            // History with date filter
            const historyResponse = await request(app)
                .get(`/api/reports/units/203/805/history${dateFilter}`)
                .expect(200);

            expect(historyResponse.body.data.totalRequests).toBe(1);

            // Export with date filter
            const exportResponse = await request(app)
                .get(`/api/reports/units/export${dateFilter}&format=csv`)
                .expect(200);

            expect(exportResponse.text).toContain('203,805,8');
            expect(exportResponse.text).not.toContain('101,1502,15');
        });
    });

    describe('Performance and edge cases', () => {
        it('should handle large number of units efficiently', async () => {
            // Add many units
            for (let dong = 100; dong < 110; dong++) {
                for (let ho = 1001; ho < 1011; ho++) {
                    inMemoryStore.saveMessage({
                        id: `msg_${dong}_${ho}`,
                        content: `${dong}동 ${ho}호 문의`,
                        maskedContent: `${dong}동 ${ho}호 문*`,
                        channel: 'sms',
                        priority: 'medium',
                        status: 'pending',
                        classification: 'inquiry',
                        createdAt: new Date(),
                        sender: '010-0000-0000',
                        maskedSender: '010-****-0000',
                        apartmentUnit: {
                            dong,
                            ho,
                            floor: Math.floor(ho / 100),
                            formatted: `${dong}동 ${ho}호`,
                            confidence: 0.95,
                            rawMatches: [`${dong}동 ${ho}호`]
                        }
                    });
                }
            }

            const startTime = Date.now();
            const response = await request(app)
                .get('/api/reports/units/analytics')
                .expect(200);
            const endTime = Date.now();

            // Should complete within reasonable time (< 1 second)
            expect(endTime - startTime).toBeLessThan(1000);
            expect(response.body.data.topUnits.length).toBeGreaterThan(0);
        });

        it('should handle empty store gracefully', async () => {
            inMemoryStore.clear();

            const response = await request(app)
                .get('/api/reports/units/analytics')
                .expect(200);

            expect(response.body.data.topUnits).toHaveLength(0);
            expect(response.body.data.summary.totalActiveUnits).toBe(0);
        });

        it('should handle malformed apartment unit data', async () => {
            inMemoryStore.clear();
            
            // Add message with incomplete apartment unit
            inMemoryStore.saveMessage({
                id: 'msg_malformed',
                content: 'Test message',
                maskedContent: 'Test message',
                channel: 'sms',
                priority: 'medium',
                status: 'pending',
                classification: 'inquiry',
                createdAt: new Date(),
                sender: '010-0000-0000',
                maskedSender: '010-****-0000',
                apartmentUnit: {
                    dong: null, // Missing dong
                    ho: 1502,
                    floor: 15,
                    formatted: '1502호',
                    confidence: 0.5
                }
            });

            const response = await request(app)
                .get('/api/reports/units/analytics')
                .expect(200);

            // Should handle gracefully and not include malformed data
            expect(response.body.data.topUnits).toHaveLength(0);
        });
    });
});