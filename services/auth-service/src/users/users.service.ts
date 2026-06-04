import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { paginate, PaginatedResult, UserRole } from '@fems/shared';
import { Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { CustomerClient } from '../clients/customer.client';
import { WelcomeEmailService } from '../mail/welcome-email.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly welcomeEmailService: WelcomeEmailService,
    private readonly customerClient: CustomerClient,
  ) {}

  static buildFullName(firstName: string, lastName: string): string {
    return `${firstName.trim()} ${lastName.trim()}`.trim();
  }

  async createCustomer(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'This email is already registered. Please sign in instead.',
      );
    }

    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const hashed = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      firstName,
      lastName,
      fullName: UsersService.buildFullName(firstName, lastName),
      email,
      password: hashed,
      role: UserRole.CUSTOMER,
    });
    const saved = await this.usersRepo.save(user);
    return this.sanitize(saved);
  }

  async createUser(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'This email is already registered. Please sign in instead.',
      );
    }

    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const plainPassword = dto.password;
    const hashed = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      firstName,
      lastName,
      fullName: UsersService.buildFullName(firstName, lastName),
      email,
      password: hashed,
      role: dto.role,
    });
    const saved = this.sanitize(await this.usersRepo.save(user));
    if (dto.role === UserRole.CUSTOMER) {
      await this.customerClient.ensureProfile(email, saved.fullName);
    }
    void this.welcomeEmailService.sendAdminCreatedWelcome(
      email,
      saved.fullName,
      plainPassword,
      dto.role,
    );
    return saved;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findInspectors(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepo.find({
      where: { role: UserRole.INSPECTOR },
      order: { fullName: 'ASC' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findAdmins(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepo.find({
      where: { role: UserRole.ADMIN },
      order: { fullName: 'ASC' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findCustomers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepo.find({
      where: { role: UserRole.CUSTOMER },
      order: { fullName: 'ASC' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Omit<User, 'password'>>> {
    const [users, total] = await this.usersRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return paginate(
      users.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
    );
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    user.fullName = UsersService.buildFullName(user.firstName, user.lastName);

    return this.sanitize(await this.usersRepo.save(user));
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const clash = await this.usersRepo.findOne({ where: { email } });
      if (clash && clash.id !== id) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.role !== undefined) user.role = dto.role;
    user.fullName = UsersService.buildFullName(user.firstName, user.lastName);

    return this.sanitize(await this.usersRepo.save(user));
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: {
        id: true,
        password: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new ConflictException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersRepo.save(user);
  }

  async setPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.remove(user);
  }

  sanitize(user: User): Omit<User, 'password'> {
    const { password: _password, ...rest } = user;
    return rest;
  }
}
