import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InspectionsService } from '../inspections/inspections.service';

@Injectable()
export class InspectionOverdueCron {
  private readonly logger = new Logger(InspectionOverdueCron.name);

  constructor(private readonly inspectionsService: InspectionsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue() {
    const count = await this.inspectionsService.markOverdueSchedules();
    if (count > 0) {
      this.logger.log(`Marked ${count} inspection(s) as OVERDUE`);
    }
  }
}
