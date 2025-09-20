import { logger } from '@/shared/utils/logger';

export class AggregationService {
  async aggregateDaily(): Promise<void> {
    try {
      // TODO: Implement daily aggregation job
      logger.info('Running daily aggregation');
    } catch (error) {
      logger.error('Error in daily aggregation', { error });
      throw error;
    }
  }

  async aggregateMonthly(): Promise<void> {
    try {
      // TODO: Implement monthly aggregation job
      logger.info('Running monthly aggregation');
    } catch (error) {
      logger.error('Error in monthly aggregation', { error });
      throw error;
    }
  }
}