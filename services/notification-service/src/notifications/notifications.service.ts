import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload, paginate } from '@fems/shared';
import { Repository } from 'typeorm';
import { CustomerClient } from '../clients/customer.client';
import { Notification } from '../entities/notification.entity';
import { NotificationStatus } from '../enums/notification-status.enum';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly customerClient: CustomerClient,
  ) {}

  async findAll(query: ListNotificationsQueryDto, user: JwtPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.notificationRepo.createQueryBuilder('n');

    if (query.customerId) {
      qb.andWhere('n.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.extinguisherId) {
      qb.andWhere('n.extinguisher_id = :extinguisherId', {
        extinguisherId: query.extinguisherId,
      });
    }
    if (query.status) {
      qb.andWhere('n.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    qb.orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findForCustomer(query: ListNotificationsQueryDto, user: JwtPayload) {
    const customerId = await this.customerClient.resolveCustomerIdForUser(user);
    return this.findAll({ ...query, customerId }, user);
  }

  async markRead(id: string, user: JwtPayload): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const customerId = await this.customerClient.resolveCustomerIdForUser(user);
    if (notification.customerId !== customerId) {
      throw new ForbiddenException('Cannot access this notification');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markReadAdmin(id: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }
}
