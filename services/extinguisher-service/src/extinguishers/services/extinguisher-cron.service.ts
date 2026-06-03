import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { computeExtinguisherStatus, ExtinguishersService } from './extinguishers.service';
import { ExtinguisherNotificationService } from './extinguisher-notification.service';

@Injectable()
export class ExtinguisherCronService {
  private readonly logger = new Logger(ExtinguisherCronService.name);

  constructor(
    private readonly extinguishersService: ExtinguishersService,
    private readonly extinguisherNotificationService: ExtinguisherNotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyStatusUpdate(): Promise<void> {
    this.logger.log('Running daily extinguisher status update');
    const extinguishers = await this.extinguishersService.findAllForCron();
    const toSave: FireExtinguisher[] = [];

    for (const extinguisher of extinguishers) {
      const nextStatus = computeExtinguisherStatus(extinguisher.expiryDate);
      if (extinguisher.status !== nextStatus) {
        extinguisher.status = nextStatus;
        toSave.push(extinguisher);
      }

      await this.extinguisherNotificationService.notifyIfExpiringSoon(extinguisher);
    }

    if (toSave.length) {
      await this.extinguishersService.saveMany(toSave);
      this.logger.log(`Updated status for ${toSave.length} extinguisher(s)`);
    }
  }
}
