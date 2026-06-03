import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationMailClient {
  private readonly logger = new Logger(NotificationMailClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get headers() {
    return {
      'X-Service-Key': this.config.get<string>('SERVICE_INTERNAL_KEY', ''),
    };
  }

  private get baseUrl() {
    return this.config.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://localhost:3004',
    );
  }

  async sendTransactionalEmail(payload: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ delivered: boolean; mock: boolean; error?: string }> {
    const { data } = await firstValueFrom(
      this.http.post<{ delivered: boolean; mock: boolean; error?: string }>(
        `${this.baseUrl}/api/internal/email/send`,
        payload,
        { headers: this.headers },
      ),
    );
    return data;
  }

  async sendPasswordResetOtp(
    to: string,
    otp: string,
    expiresMinutes: number,
  ): Promise<{ delivered: boolean; mock: boolean; error?: string }> {
    const subject = 'FEMS password reset code';
    const text = `Your password reset verification code is ${otp}. It expires in ${expiresMinutes} minutes. If you did not request this, ignore this email.`;
    const html = `<p>Your password reset verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p><p>This code expires in ${expiresMinutes} minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`;

    const result = await this.sendTransactionalEmail({ to, subject, text, html });
    if (!result.delivered) {
      const message = result.error ?? 'Email could not be delivered';
      this.logger.error(`Password reset OTP not delivered to ${to}: ${message}`);
      throw new Error(message);
    }
    if (result.mock) {
      this.logger.warn(
        `Password reset OTP for ${to} logged in notification-service (SMTP not configured). Code: ${otp}`,
      );
    }
    return result;
  }
}
