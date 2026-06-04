import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtPayload, UserRole } from '@fems/shared';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';
import { CustomerClient } from '../clients/customer.client';
import { WelcomeEmailService } from '../mail/welcome-email.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly customerClient: CustomerClient,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    private readonly welcomeEmailService: WelcomeEmailService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const normalized = {
      ...dto,
      email: dto.email.trim().toLowerCase(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    };
    const user = await this.usersService.createCustomer(normalized);
    await this.customerClient.ensureProfile(
      normalized.email,
      UsersService.buildFullName(normalized.firstName, normalized.lastName),
    );
    const tokens = await this.issueTokenPair(user);
    await this.auditService.log({
      userId: user.id,
      action: 'REGISTER',
      entity: 'user',
      entityId: user.id,
    });
    void this.welcomeEmailService.sendSelfRegistrationWelcome(
      user.email,
      user.fullName,
      user.role,
    );
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const sanitized = this.usersService.sanitize(user);
    const tokens = await this.issueTokenPair(sanitized);
    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
    });
    return { user: sanitized, ...tokens };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const sanitized = this.usersService.sanitize(user);
    const tokens = await this.issueTokenPair(sanitized);
    await this.auditService.log({
      userId: user.id,
      action: 'REFRESH',
      entity: 'refresh_token',
      entityId: stored.id,
    });
    return { user: sanitized, ...tokens };
  }

  async logout(refreshToken: string, userId?: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshRepo.findOne({ where: { tokenHash } });

    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.refreshRepo.save(stored);
      await this.auditService.log({
        userId: stored.userId,
        action: 'LOGOUT',
        entity: 'refresh_token',
        entityId: stored.id,
      });
    } else if (userId) {
      await this.auditService.log({
        userId,
        action: 'LOGOUT',
        entity: 'user',
        entityId: userId,
      });
    }

    return { success: true };
  }

  private async issueTokenPair(user: Omit<User, 'password'>) {
    let customerId: string | undefined;
    if (user.role === UserRole.CUSTOMER) {
      customerId = await this.customerClient.resolveCustomerId(
        user.email,
        user.fullName,
      );
    }

    const accessToken = await this.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(customerId ? { customerId } : {}),
    });
    const refreshToken = await this.createRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwtService.signAsync(payload);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefreshToken(raw);
    const days = this.config.get<number>('REFRESH_TOKEN_EXPIRES_DAYS', 7);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const entity = this.refreshRepo.create({
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });
    await this.refreshRepo.save(entity);
    return raw;
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
