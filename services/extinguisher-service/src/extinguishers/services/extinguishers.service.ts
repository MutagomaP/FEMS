import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from '@fems/shared';
import {
  getExtinguisherDateErrors,
  getExtinguisherExpiryDateError,
  paginate,
  PaginatedResult,
} from '@fems/shared';
import { ExtinguisherFilterOptions } from '../dtos/list-extinguishers-query.dto';
import { AssignExtinguisherDto } from '../dtos/assign-extinguisher.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import { CreateStockExtinguisherDto } from '../dtos/create-stock-extinguisher.dto';
import { RenewExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { UpdateExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { FireExtinguisher } from '../entities/fire-extinguisher.entity';
import { ExtinguishersRepository } from '../repositories/extinguishers.repository';
import { ExtinguisherAuditService } from '../../audit/extinguisher-audit.service';
import { ExtinguisherNotificationService } from './extinguisher-notification.service';

export function computeExtinguisherStatus(
  expiryDate: string,
  referenceDate = new Date(),
): ExtinguisherStatus {
  const today = startOfDay(referenceDate);
  const expiry = startOfDay(new Date(expiryDate));

  if (expiry < today) {
    return ExtinguisherStatus.EXPIRED;
  }

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExpiry <= 90) {
    return ExtinguisherStatus.EXPIRING_SOON;
  }

  return ExtinguisherStatus.ACTIVE;
}

export function daysUntilExpiry(
  expiryDate: string,
  referenceDate = new Date(),
): number {
  const today = startOfDay(referenceDate);
  const expiry = startOfDay(new Date(expiryDate));
  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

@Injectable()
export class ExtinguishersService {
  constructor(
    private readonly extinguishersRepo: ExtinguishersRepository,
    private readonly extinguisherNotificationService: ExtinguisherNotificationService,
    private readonly auditService: ExtinguisherAuditService,
  ) {}

  async create(
    dto: CreateExtinguisherDto,
    actor?: JwtPayload,
  ): Promise<FireExtinguisher> {
    this.assertExtinguisherDates(dto.installationDate, dto.expiryDate);
    await this.assertUniqueSerial(dto.serialNumber);
    const status = computeExtinguisherStatus(dto.expiryDate);
    const extinguisher = this.extinguishersRepo.create({
      ...dto,
      status,
    });
    const saved = await this.extinguishersRepo.save(extinguisher);
    await this.auditService.log({
      userId: actor?.sub,
      action: 'EXTINGUISHER_CREATED',
      entityId: saved.id,
      details: { serialNumber: saved.serialNumber },
    });
    await this.extinguisherNotificationService.notifyIfExpiringSoon(saved);
    return saved;
  }

  async createStock(
    dto: CreateStockExtinguisherDto,
    actor?: JwtPayload,
  ): Promise<FireExtinguisher> {
    this.assertExtinguisherDates(dto.installationDate, dto.expiryDate);
    await this.assertUniqueSerial(dto.serialNumber);
    const extinguisher = this.extinguishersRepo.create({
      serialNumber: dto.serialNumber,
      location: dto.location?.trim() || 'Central warehouse',
      type: dto.type,
      size: dto.size,
      installationDate: dto.installationDate,
      expiryDate: dto.expiryDate,
      status: ExtinguisherStatus.IN_STOCK,
      customerId: null,
    });
    const saved = await this.extinguishersRepo.save(extinguisher);
    await this.auditService.log({
      userId: actor?.sub,
      action: 'EXTINGUISHER_STOCK_CREATED',
      entityId: saved.id,
      details: { serialNumber: saved.serialNumber },
    });
    return saved;
  }

  async assignToCustomer(
    id: string,
    dto: AssignExtinguisherDto,
    actor?: JwtPayload,
  ): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    if (extinguisher.customerId) {
      throw new BadRequestException(
        'This extinguisher is already assigned to a customer',
      );
    }
    extinguisher.customerId = dto.customerId;
    extinguisher.location = dto.location.trim();
    extinguisher.status = computeExtinguisherStatus(extinguisher.expiryDate);
    const saved = await this.extinguishersRepo.save(extinguisher);
    await this.auditService.log({
      userId: actor?.sub,
      action: 'EXTINGUISHER_ASSIGNED',
      entityId: saved.id,
      details: {
        serialNumber: saved.serialNumber,
        customerId: dto.customerId,
      },
    });
    await this.extinguisherNotificationService.notifyIfExpiringSoon(saved);
    return saved;
  }

  async findStock(
    page: number,
    limit: number,
    filters: Omit<ExtinguisherFilterOptions, 'inStock' | 'customerId'>,
  ): Promise<PaginatedResult<FireExtinguisher>> {
    return this.findAll(page, limit, { ...filters, inStock: true });
  }

  async findAll(
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions,
  ): Promise<PaginatedResult<FireExtinguisher>> {
    const [data, total] = await this.extinguishersRepo.findPaginated(
      page,
      limit,
      filters,
    );
    return paginate(data, total, page, limit);
  }

  async findMine(
    customerId: string,
    page: number,
    limit: number,
    filters: ExtinguisherFilterOptions,
  ): Promise<PaginatedResult<FireExtinguisher>> {
    return this.findAll(page, limit, { ...filters, customerId });
  }

  async findReportByStatus(status: ExtinguisherStatus, limit = 1000) {
    const [data, total] = await this.extinguishersRepo.findPaginated(1, limit, {
      status,
    });
    return paginate(data, total, 1, limit);
  }

  async findById(id: string): Promise<FireExtinguisher> {
    const extinguisher = await this.extinguishersRepo.findById(id);
    if (!extinguisher) {
      throw new NotFoundException('Fire extinguisher not found');
    }
    return extinguisher;
  }

  async update(
    id: string,
    dto: UpdateExtinguisherDto,
    actor?: JwtPayload,
  ): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    const expiryChanged = dto.expiryDate !== undefined;
    const customerChanged = dto.customerId !== undefined;

    if (dto.installationDate !== undefined || dto.expiryDate !== undefined) {
      this.assertExtinguisherDates(
        dto.installationDate ?? extinguisher.installationDate,
        dto.expiryDate ?? extinguisher.expiryDate,
      );
    }

    if (dto.serialNumber !== undefined) {
      await this.assertUniqueSerial(dto.serialNumber, id);
      extinguisher.serialNumber = dto.serialNumber;
    }
    if (dto.location !== undefined) extinguisher.location = dto.location;
    if (dto.type !== undefined) extinguisher.type = dto.type;
    if (dto.size !== undefined) extinguisher.size = dto.size;
    if (dto.installationDate !== undefined) {
      extinguisher.installationDate = dto.installationDate;
    }
    if (dto.customerId !== undefined) extinguisher.customerId = dto.customerId;
    if (dto.expiryDate !== undefined) {
      extinguisher.expiryDate = dto.expiryDate;
      extinguisher.status = computeExtinguisherStatus(dto.expiryDate);
    }
    if (dto.status !== undefined) extinguisher.status = dto.status;

    const saved = await this.extinguishersRepo.save(extinguisher);
    await this.auditService.log({
      userId: actor?.sub,
      action: 'EXTINGUISHER_UPDATED',
      entityId: saved.id,
      details: { fields: Object.keys(dto) },
    });

    if (expiryChanged || customerChanged) {
      await this.extinguisherNotificationService.notifyIfExpiringSoon(saved);
    }

    return saved;
  }

  async renew(id: string, dto: RenewExtinguisherDto): Promise<FireExtinguisher> {
    const extinguisher = await this.findById(id);
    const expiryError = getExtinguisherExpiryDateError(
      dto.expiryDate,
      extinguisher.installationDate,
    );
    if (expiryError) {
      throw new BadRequestException(expiryError);
    }
    extinguisher.expiryDate = dto.expiryDate;
    extinguisher.status = ExtinguisherStatus.RENEWED;
    return this.extinguishersRepo.save(extinguisher);
  }

  async remove(id: string, actor?: JwtPayload): Promise<void> {
    const extinguisher = await this.findById(id);
    await this.extinguishersRepo.remove(extinguisher);
    await this.auditService.log({
      userId: actor?.sub,
      action: 'EXTINGUISHER_DELETED',
      entityId: id,
      details: { serialNumber: extinguisher.serialNumber },
    });
  }

  async findAllForCron(): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.findAll();
  }

  private assertExtinguisherDates(
    installationDate: string,
    expiryDate: string,
  ): void {
    const errors = getExtinguisherDateErrors(installationDate, expiryDate);
    const message = errors.installationDate ?? errors.expiryDate;
    if (message) {
      throw new BadRequestException(message);
    }
  }

  private async assertUniqueSerial(
    serialNumber: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.extinguishersRepo.findBySerialNumber(
      serialNumber,
      excludeId,
    );
    if (existing) {
      throw new ConflictException(
        'A fire extinguisher with this serial number already exists',
      );
    }
  }

  async saveMany(extinguishers: FireExtinguisher[]): Promise<FireExtinguisher[]> {
    return this.extinguishersRepo.saveMany(extinguishers);
  }
}
