import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { Notification } from '../entities/notification.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';
import { EmailService } from '../email/email.service';
import {
  buildNotificationEmail,
  daysUntilExpiry,
} from '../email/notification-email.builder';
import { SMS_PROVIDER, SmsProvider } from '../sms/sms-provider.interface';
import { CustomerClient } from '../clients/customer.client';
import { ExtinguisherClient } from '../clients/extinguisher.client';
import { TriggerNotificationDto } from './dto/trigger-notification.dto';

@Injectable()
export class NotificationEngineService {
  private readonly logger = new Logger(NotificationEngineService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    private readonly emailService: EmailService,
    private readonly customerClient: CustomerClient,
    private readonly extinguisherClient: ExtinguisherClient,
    private readonly config: ConfigService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  private async resolveRecipientEmail(
    dto: TriggerNotificationDto,
  ): Promise<string | undefined> {
    if (dto.recipientEmail) {
      return dto.recipientEmail;
    }
    const customer = await this.customerClient.findById(dto.customerId);
    return customer?.email;
  }

  async createIdempotent(dto: TriggerNotificationDto): Promise<Notification> {
    const channel = dto.channel ?? NotificationChannel.EMAIL;

    const existing = dto.skipIdempotency
      ? null
      : await this.notificationRepo.findOne({
          where: {
            type: dto.type,
            extinguisherId: dto.extinguisherId,
            customerId: dto.customerId,
          },
        });

    if (existing) {
      this.logger.debug(
        `Notification already exists for type=${dto.type} extinguisher=${dto.extinguisherId}`,
      );
      await this.retryFailedDelivery(existing, dto);
      return existing;
    }

    const notification = this.notificationRepo.create({
      customerId: dto.customerId,
      extinguisherId: dto.extinguisherId,
      message: dto.message,
      type: dto.type,
      channel,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    const saved = await this.notificationRepo.save(notification);

    const delivery = this.deliveryRepo.create({
      notificationId: saved.id,
      channel,
      status: DeliveryStatus.SENT,
      sentAt: new Date(),
    });
    await this.deliveryRepo.save(delivery);

    const recipientEmail = await this.resolveRecipientEmail(dto);
    await this.sendNotification(saved, dto, delivery.id, recipientEmail);
    return saved;
  }

  async sendNotification(
    notification: Notification,
    dto: TriggerNotificationDto,
    deliveryId: string,
    recipientEmail?: string,
  ): Promise<void> {
    const to =
      recipientEmail ?? (await this.resolveRecipientEmail(dto));

    try {
      if (notification.channel === NotificationChannel.EMAIL && to) {
        const emailContent = await this.composeEmail(notification, dto);
        const result = await this.emailService.send({
          to,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        await this.deliveryRepo.update(deliveryId, {
          status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: result.delivered ? new Date() : null,
          errorMessage: result.delivered ? null : (result.error ?? 'SMTP delivery failed'),
        });
      } else if (notification.channel === NotificationChannel.SMS && dto.recipientPhone) {
        const result = await this.smsProvider.send(dto.recipientPhone, notification.message);
        await this.deliveryRepo.update(deliveryId, {
          status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: result.delivered ? new Date() : null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Delivery failed for notification ${notification.id}: ${message}`);
      await this.deliveryRepo.update(deliveryId, {
        status: DeliveryStatus.FAILED,
        errorMessage: message,
      });
    }
  }

  private async retryFailedDelivery(
    notification: Notification,
    dto: TriggerNotificationDto,
  ): Promise<void> {
    const delivery = await this.deliveryRepo.findOne({
      where: {
        notificationId: notification.id,
        channel: notification.channel,
        status: DeliveryStatus.FAILED,
      },
    });
    if (!delivery) {
      return;
    }

    this.logger.log(
      `Retrying failed ${notification.channel} delivery for notification ${notification.id}`,
    );
    const recipientEmail = await this.resolveRecipientEmail(dto);
    await this.sendNotification(notification, dto, delivery.id, recipientEmail);
  }

  async processPendingDeliveries(): Promise<number> {
    const pending = await this.deliveryRepo.find({
      where: { status: In([DeliveryStatus.SENT, DeliveryStatus.FAILED]) },
      relations: ['notification'],
      take: 100,
    });

    let processed = 0;
    for (const delivery of pending) {
      if (delivery.notification.channel === NotificationChannel.EMAIL) {
        const to = await this.resolveRecipientEmail({
          customerId: delivery.notification.customerId,
          extinguisherId: delivery.notification.extinguisherId,
          type: delivery.notification.type,
          message: delivery.notification.message,
        });
        if (!to) {
          continue;
        }
        const emailContent = await this.composeEmail(delivery.notification, {
          customerId: delivery.notification.customerId,
          extinguisherId: delivery.notification.extinguisherId,
          type: delivery.notification.type,
          message: delivery.notification.message,
        });
        const result = await this.emailService.send({
          to,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        await this.deliveryRepo.update(delivery.id, {
          status: result.delivered ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: result.delivered ? new Date() : null,
          errorMessage: result.delivered ? null : (result.error ?? 'SMTP delivery failed'),
        });
        processed++;
      }
    }
    return processed;
  }

  private async composeEmail(
    notification: Notification,
    dto: TriggerNotificationDto,
  ): Promise<{ subject: string; text: string; html: string }> {
    const customer = await this.customerClient.findById(notification.customerId);
    const recipientName = customer?.fullName ?? 'Valued Customer';

    let serialNumber = dto.serialNumber;
    let expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : undefined;
    let daysLeft = dto.daysUntilExpiry;
    let status = dto.extinguisherStatus;

    const extinguisher = await this.extinguisherClient.findById(
      notification.extinguisherId,
    );
    if (extinguisher) {
      serialNumber = serialNumber ?? extinguisher.serialNumber;
      expiryDate = expiryDate ?? new Date(extinguisher.expiryDate);
      status = status ?? extinguisher.status;
    }

    if (!expiryDate) {
      expiryDate = new Date();
    }
    if (daysLeft === undefined) {
      daysLeft = daysUntilExpiry(expiryDate);
    }

    return buildNotificationEmail({
      recipientName,
      type: notification.type,
      serialNumber: serialNumber ?? 'N/A',
      expiryDate,
      daysUntilExpiry: daysLeft,
      extinguisherStatus: status,
      appUrl: this.config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
      summaryLine: notification.message,
    });
  }
}
