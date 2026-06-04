import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { paginate, PaginatedResult } from '@fems/shared';
import { AuthClient } from '../../clients/auth.client';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CustomersRepository } from '../repositories/customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepo: CustomersRepository,
    private readonly authClient: AuthClient,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const email = dto.email.toLowerCase();
    const existing = await this.customersRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customersRepo.create({
      ...dto,
      email,
    });
    return this.customersRepo.save(customer);
  }

  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<PaginatedResult<Customer>> {
    await this.syncAuthCustomerProfiles();
    const [data, total] = await this.customersRepo.findPaginated(
      page,
      limit,
      search,
    );
    return paginate(data, total, page, limit);
  }

  private async syncAuthCustomerProfiles(): Promise<void> {
    const authCustomers = await this.authClient.listCustomerUsers();
    await Promise.all(
      authCustomers.map((user) =>
        this.ensureByEmail(user.email, user.fullName),
      ),
    );
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customersRepo.findById(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customersRepo.findByEmail(email);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  /**
   * Links a registered auth user to a customer row (by email).
   * Idempotent — returns existing customer if email already exists.
   */
  async ensureByEmail(email: string, fullName?: string): Promise<Customer> {
    const normalized = email.toLowerCase();
    const existing = await this.customersRepo.findByEmail(normalized);
    if (existing) {
      return existing;
    }

    const displayName =
      fullName?.trim() ||
      normalized.split('@')[0].replace(/[._-]/g, ' ') ||
      'Customer';

    const customer = this.customersRepo.create({
      fullName: displayName,
      email: normalized,
      nationalId: 'PENDING',
      phone: 'PENDING',
      address: 'To be updated',
    });
    return this.customersRepo.save(customer);
  }

  async findMe(email: string): Promise<Customer> {
    return this.findByEmail(email);
  }

  async updateMe(email: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findByEmail(email);
    return this.update(customer.id, dto);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findById(id);

    if (dto.email && dto.email.toLowerCase() !== customer.email) {
      const duplicate = await this.customersRepo.findByEmail(dto.email);
      if (duplicate) {
        throw new ConflictException('Customer with this email already exists');
      }
      customer.email = dto.email.toLowerCase();
    }

    if (dto.fullName !== undefined) customer.fullName = dto.fullName;
    if (dto.nationalId !== undefined) customer.nationalId = dto.nationalId;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.address !== undefined) customer.address = dto.address;

    return this.customersRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findById(id);
    await this.customersRepo.remove(customer);
  }
}
