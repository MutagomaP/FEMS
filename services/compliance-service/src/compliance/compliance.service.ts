import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from '@fems/shared';
import { Repository } from 'typeorm';
import { ComplianceCase } from '../entities/compliance-case.entity';
import { CaseStatus } from '../enums/case-status.enum';
import {
  CreateComplianceCaseDto,
  EscalateComplianceDto,
  UpdateComplianceCaseDto,
} from './dto/compliance-case.dto';
import { ListComplianceCasesQueryDto } from './dto/list-compliance-cases-query.dto';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(ComplianceCase)
    private readonly caseRepo: Repository<ComplianceCase>,
  ) {}

  async findAll(query: ListComplianceCasesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.caseRepo.createQueryBuilder('c');

    if (query.customerId) {
      qb.andWhere('c.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.extinguisherId) {
      qb.andWhere('c.extinguisher_id = :extinguisherId', {
        extinguisherId: query.extinguisherId,
      });
    }
    if (query.caseStatus) {
      qb.andWhere('c.case_status = :caseStatus', { caseStatus: query.caseStatus });
    }

    qb.orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const complianceCase = await this.caseRepo.findOne({ where: { id } });
    if (!complianceCase) {
      throw new NotFoundException('Compliance case not found');
    }
    return complianceCase;
  }

  async create(dto: CreateComplianceCaseDto) {
    const complianceCase = this.caseRepo.create({
      customerId: dto.customerId,
      extinguisherId: dto.extinguisherId,
      caseStatus: dto.caseStatus ?? CaseStatus.OPEN,
      notes: dto.notes ?? null,
    });
    return this.caseRepo.save(complianceCase);
  }

  async update(id: string, dto: UpdateComplianceCaseDto) {
    const complianceCase = await this.findOne(id);
    if (dto.caseStatus !== undefined) {
      complianceCase.caseStatus = dto.caseStatus;
      if (dto.caseStatus === CaseStatus.CLOSED) {
        complianceCase.closedAt = new Date();
      }
    }
    if (dto.notes !== undefined) {
      complianceCase.notes = dto.notes;
    }
    return this.caseRepo.save(complianceCase);
  }

  async close(id: string, notes?: string) {
    return this.update(id, { caseStatus: CaseStatus.CLOSED, notes });
  }

  async remove(id: string) {
    const complianceCase = await this.findOne(id);
    await this.caseRepo.remove(complianceCase);
    return { deleted: true };
  }

  async escalate(dto: EscalateComplianceDto) {
    let complianceCase = await this.caseRepo.findOne({
      where: {
        customerId: dto.customerId,
        extinguisherId: dto.extinguisherId,
      },
    });

    const targetStatus = dto.targetStatus ?? CaseStatus.ESCALATED;

    if (!complianceCase) {
      complianceCase = this.caseRepo.create({
        customerId: dto.customerId,
        extinguisherId: dto.extinguisherId,
        caseStatus: targetStatus,
        notes: dto.notes ?? null,
      });
    } else {
      complianceCase.caseStatus = targetStatus;
      if (dto.notes) {
        complianceCase.notes = dto.notes;
      }
    }

    return this.caseRepo.save(complianceCase);
  }

  async findOpenCasesForEscalation() {
    return this.caseRepo.find({
      where: [
        { caseStatus: CaseStatus.OPEN },
        { caseStatus: CaseStatus.WARNING_SENT },
      ],
    });
  }
}
