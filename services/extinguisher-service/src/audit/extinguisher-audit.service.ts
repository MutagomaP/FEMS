import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtinguisherAuditLog } from '../entities/extinguisher-audit-log.entity';

@Injectable()
export class ExtinguisherAuditService {
  constructor(
    @InjectRepository(ExtinguisherAuditLog)
    private readonly auditRepo: Repository<ExtinguisherAuditLog>,
  ) {}

  async log(input: {
    userId?: string;
    action: string;
    entityId: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    const entry = this.auditRepo.create({
      userId: input.userId ?? null,
      action: input.action,
      entityId: input.entityId,
      details: input.details ? JSON.stringify(input.details) : null,
    });
    await this.auditRepo.save(entry);
  }
}
