import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtinguisherFilterOptions } from '../dtos/list-extinguishers-query.dto';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';

@Injectable()
export class ExtinguishersRepository {
  constructor(
    @InjectRepository(FireExtinguisher)
    private readonly repo: Repository<FireExtinguisher>,
  ) {}

  create(data: Partial<FireExtinguisher>): FireExtinguisher {
    return this.repo.create(data);
  }

  save(extinguisher: FireExtinguisher): Promise<FireExtinguisher> {
    return this.repo.save(extinguisher);
  }

  saveMany(extinguishers: FireExtinguisher[]): Promise<FireExtinguisher[]> {
    return this.repo.save(extinguishers);
  }

  findById(id: string): Promise<FireExtinguisher | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySerialNumber(
    serialNumber: string,
    excludeId?: string,
  ): Promise<FireExtinguisher | null> {
    const qb = this.repo
      .createQueryBuilder('e')
      .where('LOWER(e.serialNumber) = LOWER(:serial)', {
        serial: serialNumber.trim(),
      });
    if (excludeId) {
      qb.andWhere('e.id != :excludeId', { excludeId });
    }
    return qb.getOne();
  }

  findAll(): Promise<FireExtinguisher[]> {
    return this.repo.find();
  }

  findPaginated(
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions = {},
  ): Promise<[FireExtinguisher[], number]> {
    const sortBy = filters.sortBy ?? 'expiryDate';
    const sortOrder = filters.sortOrder ?? 'ASC';
    const sortColumnMap: Record<string, string> = {
      expiryDate: 'e.expiryDate',
      serialNumber: 'e.serialNumber',
      installationDate: 'e.installationDate',
      createdAt: 'e.createdAt',
    };
    const qb = this.repo
      .createQueryBuilder('e')
      .orderBy(sortColumnMap[sortBy] ?? 'e.expiryDate', sortOrder);

    if (filters.status) {
      qb.andWhere('e.status = :status', { status: filters.status });
    }
    if (filters.inStock === true) {
      qb.andWhere('e.customer_id IS NULL');
    } else if (filters.assignedOnly === true) {
      qb.andWhere('e.customer_id IS NOT NULL');
    } else if (filters.customerId) {
      qb.andWhere('e.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }
    if (filters.expiryFrom) {
      qb.andWhere('e.expiryDate >= :expiryFrom', {
        expiryFrom: filters.expiryFrom,
      });
    }
    if (filters.expiryTo) {
      qb.andWhere('e.expiryDate <= :expiryTo', {
        expiryTo: filters.expiryTo,
      });
    }
    if (filters.search?.trim()) {
      qb.andWhere('e.serialNumber ILIKE :search', {
        search: `%${filters.search.trim()}%`,
      });
    }

    return qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  remove(extinguisher: FireExtinguisher): Promise<FireExtinguisher> {
    return this.repo.remove(extinguisher);
  }
}
