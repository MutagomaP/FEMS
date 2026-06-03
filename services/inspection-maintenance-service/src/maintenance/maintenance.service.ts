import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload, paginate, PaginatedResult } from '@fems/shared';
import { Repository } from 'typeorm';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { ListMaintenanceQueryDto } from './dto/list-maintenance-query.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly maintenanceRepo: Repository<MaintenanceLog>,
  ) {}

  async create(
    dto: CreateMaintenanceDto,
    user: JwtPayload,
  ): Promise<MaintenanceLog> {
    const log = this.maintenanceRepo.create({
      extinguisherId: dto.extinguisherId,
      inspectorUserId: user.sub,
      actionTaken: dto.actionTaken,
      maintenanceDate: dto.maintenanceDate,
      issuesIdentified: dto.issuesIdentified ?? null,
      notes: dto.notes ?? null,
      recommendations: dto.recommendations ?? null,
    });
    return this.maintenanceRepo.save(log);
  }

  async findAll(
    query: ListMaintenanceQueryDto,
  ): Promise<PaginatedResult<MaintenanceLog>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.maintenanceRepo.createQueryBuilder('m');

    if (query.extinguisherId) {
      qb.andWhere('m.extinguisher_id = :extinguisherId', {
        extinguisherId: query.extinguisherId,
      });
    }
    if (query.inspectorUserId) {
      qb.andWhere('m.inspector_user_id = :inspectorUserId', {
        inspectorUserId: query.inspectorUserId,
      });
    }

    qb.orderBy('m.maintenance_date', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findForReport(limit = 1000): Promise<MaintenanceLog[]> {
    return this.maintenanceRepo.find({
      order: { maintenanceDate: 'DESC' },
      take: limit,
    });
  }

  async findById(id: string): Promise<MaintenanceLog> {
    const row = await this.maintenanceRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Maintenance log not found');
    return row;
  }

  async remove(id: string): Promise<void> {
    const row = await this.findById(id);
    await this.maintenanceRepo.remove(row);
  }
}
