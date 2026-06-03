import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload, paginate, PaginatedResult, UserRole } from '@fems/shared';
import { Repository } from 'typeorm';
import { AuthClient, NotificationClient } from '../clients/service.clients';
import { InspectionSchedule } from '../entities/inspection-schedule.entity';
import { InspectionStatus } from '../enums/inspection-status.enum';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ListInspectionsQueryDto } from './dto/list-inspections-query.dto';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectRepository(InspectionSchedule)
    private readonly inspectionRepo: Repository<InspectionSchedule>,
    private readonly notificationClient: NotificationClient,
    private readonly authClient: AuthClient,
  ) {}

  async create(
    dto: CreateInspectionDto,
    user: JwtPayload,
    customerId: string,
  ): Promise<InspectionSchedule> {
    const schedule = this.inspectionRepo.create({
      extinguisherId: dto.extinguisherId,
      customerId,
      scheduledByUserId: user.sub,
      inspectorUserId: dto.inspectorUserId ?? null,
      inspectionDate: dto.inspectionDate,
      inspectionTime: dto.inspectionTime,
      status: InspectionStatus.PENDING,
      notes: dto.notes ?? null,
    });
    const saved = await this.inspectionRepo.save(schedule);

    await this.notifyInspectionScheduled({
      customerId,
      extinguisherId: dto.extinguisherId,
      inspectionDate: dto.inspectionDate,
      inspectionTime: dto.inspectionTime,
      scheduledBy: user,
      inspectorUserId: dto.inspectorUserId ?? null,
    });

    return saved;
  }

  private async notifyInspectionScheduled(params: {
    customerId: string;
    extinguisherId: string;
    inspectionDate: string;
    inspectionTime: string;
    scheduledBy: JwtPayload;
    inspectorUserId: string | null;
  }): Promise<void> {
    const { customerId, extinguisherId, inspectionDate, inspectionTime, scheduledBy, inspectorUserId } =
      params;
    const when = `${inspectionDate} at ${inspectionTime}`;

    await this.notificationClient.trigger({
      customerId,
      extinguisherId,
      type: 'INSPECTION_SCHEDULED',
      message: `Inspection scheduled on ${when}.`,
      recipientEmail: scheduledBy.email,
    });

    if (inspectorUserId) {
      const inspector = await this.authClient.findById(inspectorUserId);
      await this.notificationClient.trigger({
        customerId,
        extinguisherId,
        type: 'INSPECTION_ASSIGNED',
        message: `You have been assigned an inspection on ${when}.`,
        recipientEmail: inspector.email,
        skipIdempotency: true,
      });
    }

    if (scheduledBy.role === UserRole.CUSTOMER) {
      const admins = await this.authClient.listAdmins();
      const requestMessage = `A customer requested an inspection on ${when}. Please review and assign an inspector if needed.`;
      for (const admin of admins) {
        await this.notificationClient.trigger({
          customerId,
          extinguisherId,
          type: 'INSPECTION_REQUEST',
          message: requestMessage,
          recipientEmail: admin.email,
          skipIdempotency: true,
        });
      }
    }
  }

  async findAll(
    query: ListInspectionsQueryDto,
  ): Promise<PaginatedResult<InspectionSchedule>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.inspectionRepo.createQueryBuilder('i');

    if (query.status) {
      qb.andWhere('i.status = :status', { status: query.status });
    }
    if (query.customerId) {
      qb.andWhere('i.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.extinguisherId) {
      qb.andWhere('i.extinguisher_id = :extinguisherId', {
        extinguisherId: query.extinguisherId,
      });
    }
    if (query.inspectorUserId) {
      qb.andWhere('i.inspector_user_id = :inspectorUserId', {
        inspectorUserId: query.inspectorUserId,
      });
    }

    qb.orderBy('i.inspection_date', 'ASC').addOrderBy('i.inspection_time', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<InspectionSchedule> {
    const row = await this.inspectionRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Inspection schedule not found');
    return row;
  }

  async complete(id: string, inspectorUserId: string): Promise<InspectionSchedule> {
    const row = await this.findById(id);
    row.status = InspectionStatus.COMPLETED;
    row.inspectorUserId = inspectorUserId;
    return this.inspectionRepo.save(row);
  }

  async cancel(id: string): Promise<InspectionSchedule> {
    const row = await this.findById(id);
    row.status = InspectionStatus.CANCELLED;
    return this.inspectionRepo.save(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findById(id);
    await this.inspectionRepo.remove(row);
  }

  async markOverdueSchedules(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const result = await this.inspectionRepo
      .createQueryBuilder()
      .update(InspectionSchedule)
      .set({ status: InspectionStatus.OVERDUE })
      .where('status = :pending', { pending: InspectionStatus.PENDING })
      .andWhere('inspection_date < :today', { today })
      .execute();
    return result.affected ?? 0;
  }

  async findForReport(filters: {
    status?: InspectionStatus;
    limit?: number;
  }): Promise<InspectionSchedule[]> {
    const qb = this.inspectionRepo.createQueryBuilder('i');
    if (filters.status) {
      qb.andWhere('i.status = :status', { status: filters.status });
    }
    qb.orderBy('i.inspection_date', 'DESC');
    qb.take(filters.limit ?? 1000);
    return qb.getMany();
  }
}
