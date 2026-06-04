import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@fems/shared';
import { NotificationMailClient } from '../clients/notification-mail.client';

@Injectable()
export class WelcomeEmailService {
  private readonly logger = new Logger(WelcomeEmailService.name);

  constructor(
    private readonly mailClient: NotificationMailClient,
    private readonly config: ConfigService,
  ) {}

  private loginUrl(): string {
    const base = this.config.get<string>('APP_LOGIN_URL');
    if (base) return base.replace(/\/$/, '');
    const cors = this.config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
    return `${cors.replace(/\/$/, '')}/login`;
  }

  private formatRole(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.CUSTOMER]: 'Customer',
      [UserRole.INSPECTOR]: 'Inspector',
    };
    return labels[role] ?? role;
  }

  private roleWelcomeLine(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'You can manage customers, extinguishers, compliance, and reports from the admin portal.';
      case UserRole.INSPECTOR:
        return 'You can review extinguishers and complete scheduled inspections from the inspector portal.';
      case UserRole.CUSTOMER:
      default:
        return 'You can track your extinguishers, schedule inspections, and receive safety alerts from your customer portal.';
    }
  }

  /** Self-registration — no password in email (user chose it). */
  async sendSelfRegistrationWelcome(
    email: string,
    displayName: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<void> {
    const loginUrl = this.loginUrl();
    const roleLabel = this.formatRole(role);
    const subject = `Welcome to FEMS, ${displayName}`;
    const portalLine = this.roleWelcomeLine(role);
    const text = [
      `Hello ${displayName},`,
      '',
      'Your Fire Extinguisher Management System account has been created successfully.',
      '',
      `Role: ${roleLabel}`,
      portalLine,
      '',
      `Sign in at: ${loginUrl}`,
      '',
      'If you did not create this account, contact your administrator.',
    ].join('\n');
    const html = `
      <p>Hello <strong>${this.escapeHtml(displayName)}</strong>,</p>
      <p>Your <strong>Fire Extinguisher Management System (FEMS)</strong> account has been created successfully.</p>
      <p><strong>Role:</strong> ${this.escapeHtml(roleLabel)}</p>
      <p>${this.escapeHtml(portalLine)}</p>
      <p><a href="${loginUrl}">Sign in to FEMS</a></p>
      <p style="color:#64748b;font-size:12px;">If you did not create this account, contact your administrator.</p>
    `;

    try {
      await this.mailClient.sendTransactionalEmail({ to: email, subject, text, html });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Welcome email failed for ${email}: ${message}`);
    }
  }

  /** Admin-created account — includes credentials set by the admin. */
  async sendAdminCreatedWelcome(
    email: string,
    displayName: string,
    password: string,
    role: UserRole,
  ): Promise<void> {
    const loginUrl = this.loginUrl();
    const roleLabel = this.formatRole(role);
    const portalLine = this.roleWelcomeLine(role);
    const subject = `Welcome to FEMS, ${displayName}`;
    const text = [
      `Hello ${displayName},`,
      '',
      'An administrator has created a Fire Extinguisher Management System account for you.',
      '',
      `Role: ${roleLabel}`,
      portalLine,
      `Email: ${email}`,
      `Temporary password: ${password}`,
      '',
      `Sign in at: ${loginUrl}`,
      '',
      'Please change your password after your first sign-in.',
    ].join('\n');
    const html = `
      <p>Hello <strong>${this.escapeHtml(displayName)}</strong>,</p>
      <p>An administrator has created your <strong>FEMS</strong> account.</p>
      <p><strong>Role:</strong> ${this.escapeHtml(roleLabel)}</p>
      <p>${this.escapeHtml(portalLine)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td><code>${this.escapeHtml(email)}</code></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Password</td><td><code>${this.escapeHtml(password)}</code></td></tr>
      </table>
      <p><a href="${loginUrl}" style="display:inline-block;padding:10px 16px;background:#ea580c;color:#fff;text-decoration:none;border-radius:6px;">Sign in to FEMS</a></p>
      <p style="color:#64748b;font-size:12px;">Change your password after your first sign-in.</p>
    `;

    try {
      await this.mailClient.sendTransactionalEmail({ to: email, subject, text, html });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Admin welcome email failed for ${email}: ${message}`);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
