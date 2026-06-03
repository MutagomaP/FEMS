import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationEngineService } from '../notifications/notification-engine.service';

@Injectable()
export class DeliveryCronService {
  private readonly logger = new Logger(DeliveryCronService.name);

  constructor(private readonly engine: NotificationEngineService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processPendingDeliveries() {
    this.logger.debug('Processing pending/failed notification deliveries');
    const count = await this.engine.processPendingDeliveries();
    this.logger.log(`Processed ${count} pending deliveries`);
  }
}
