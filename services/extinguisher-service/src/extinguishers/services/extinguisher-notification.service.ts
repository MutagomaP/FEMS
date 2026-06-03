import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationClient,
  NotificationTriggerType,
} from '../../clients/service.clients';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { daysUntilExpiry } from './extinguishers.service';

@Injectable()
export class ExtinguisherNotificationService {
  private readonly logger = new Logger(ExtinguisherNotificationService.name);

  constructor(private readonly notificationClient: NotificationClient) {}

  /**
   * Picks the alert band for the current days-until-expiry.
   * e.g. 6 days → EXPIRY_7; 45 days → EXPIRY_60; 100 days → none.
   */
  resolveApplicableType(days: number): NotificationTriggerType | null {
    if (days <= 0) {
      return 'EXPIRY_0';
    }
    if (days <= 7) {
      return 'EXPIRY_7';
    }
    if (days <= 30) {
      return 'EXPIRY_30';
    }
    if (days <= 60) {
      return 'EXPIRY_60';
    }
    if (days <= 90) {
      return 'EXPIRY_90';
    }
    return null;
  }

  /**
   * Sends the current expiry alert immediately if the extinguisher is within 90 days
   * of expiry. Idempotent per type + extinguisher on the notification service.
   */
  async notifyIfExpiringSoon(extinguisher: FireExtinguisher): Promise<void> {
    if (!extinguisher.customerId || extinguisher.status === ExtinguisherStatus.IN_STOCK) {
      return;
    }
    const days = daysUntilExpiry(extinguisher.expiryDate);
    const type = this.resolveApplicableType(days);

    if (!type) {
      return;
    }

    const message = this.buildMessage(extinguisher, type, days);

    this.logger.log(
      `Triggering ${type} for extinguisher ${extinguisher.serialNumber} (${days} day(s) until expiry)`,
    );

    const expiryIso = new Date(extinguisher.expiryDate).toISOString();

    await this.notificationClient.triggerNotification({
      customerId: extinguisher.customerId,
      extinguisherId: extinguisher.id,
      type,
      message,
      serialNumber: extinguisher.serialNumber,
      expiryDate: expiryIso,
      daysUntilExpiry: days,
      extinguisherStatus: extinguisher.status ?? ExtinguisherStatus.ACTIVE,
    });
  }

  private formatExpiryDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private buildMessage(
    extinguisher: FireExtinguisher,
    type: NotificationTriggerType,
    days: number,
  ): string {
    const expiryLabel = this.formatExpiryDate(extinguisher.expiryDate);

    if (type === 'EXPIRY_0' || days <= 0) {
      return `Fire extinguisher ${extinguisher.serialNumber} expired on ${expiryLabel}. Please schedule renewal immediately.`;
    }

    return `Fire extinguisher ${extinguisher.serialNumber} expires on ${expiryLabel}. Please schedule renewal.`;
  }
}
