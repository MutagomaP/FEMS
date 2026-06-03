import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { NotificationMailClient } from '../clients/notification-mail.client';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly resetRepo: Repository<PasswordResetToken>,
    private readonly usersService: UsersService,
    private readonly mailClient: NotificationMailClient,
    private readonly config: ConfigService,
  ) {}

  async requestReset(email: string): Promise<{
    message: string;
    /** Present in development when SMTP is not configured (mock email mode). */
    devOtp?: string;
    devNote?: string;
  }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('Email is required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
      throw new BadRequestException('Enter a valid email address');
    }

    const user = await this.usersService.findByEmail(normalized);
    if (!user) {
      throw new BadRequestException(
        'No account is registered with this email address',
      );
    }

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);
    const minutes = this.config.get<number>('PASSWORD_RESET_OTP_EXPIRES_MINUTES', 15);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);

    await this.resetRepo.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    await this.resetRepo.save(
      this.resetRepo.create({
        userId: user.id,
        tokenHash: otpHash,
        expiresAt,
        usedAt: null,
      }),
    );

    const isProduction =
      this.config.get<string>('NODE_ENV', 'development') === 'production';

    let mailResult: { delivered: boolean; mock: boolean };
    try {
      mailResult = await this.mailClient.sendPasswordResetOtp(
        normalized,
        otp,
        minutes,
      );
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Email delivery failed';
      this.logger.error(
        `OTP email failed for ${normalized}: ${detail}. Is notification-service running on ${this.config.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3004')}?`,
      );
      throw new ServiceUnavailableException(
        isProduction
          ? 'Unable to send verification email. Try again later or contact support.'
          : `Unable to send verification email: ${detail}. Ensure notification-service is running and check auth/notification logs.`,
      );
    }

    if (mailResult.mock && !isProduction) {
      this.logger.log(
        `Password reset OTP for ${normalized} (dev, SMTP mock): ${otp}`,
      );
      return {
        message:
          'SMTP is not configured. Use the verification code shown below (development only).',
        devOtp: otp,
        devNote:
          'Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in notification-service to send real emails.',
      };
    }

    return {
      message: 'A verification code has been sent to your email address.',
    };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const otpHash = this.hashOtp(otp.trim());
    const stored = await this.resetRepo.findOne({
      where: {
        userId: user.id,
        tokenHash: otpHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    stored.usedAt = new Date();
    await this.resetRepo.save(stored);
    await this.usersService.setPassword(stored.userId, newPassword);
  }

  private generateOtp(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }
}
