import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface CustomerSnapshot {
  id: string;
  email: string;
  fullName: string;
}

@Injectable()
export class CustomerClient {
  private readonly logger = new Logger(CustomerClient.name);

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
      'CUSTOMER_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  async findByEmail(email: string): Promise<CustomerSnapshot | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CustomerSnapshot>(
          `${this.baseUrl}/api/internal/customers/by-email/${encodeURIComponent(email)}`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw error;
    }
  }

  async ensureByEmail(email: string, fullName?: string): Promise<CustomerSnapshot> {
    const { data } = await firstValueFrom(
      this.http.post<CustomerSnapshot>(
        `${this.baseUrl}/api/internal/customers/ensure`,
        { email, fullName },
        { headers: this.headers },
      ),
    );
    return data;
  }

  async resolveByEmail(email: string, fullName?: string): Promise<CustomerSnapshot> {
    const existing = await this.findByEmail(email);
    if (existing) {
      return existing;
    }
    return this.ensureByEmail(email, fullName);
  }

  /** Prefer customerId from JWT; fall back to customer-service lookup. */
  async resolveCustomerIdForUser(user: {
    customerId?: string;
    email: string;
  }): Promise<string> {
    if (user.customerId) {
      return user.customerId;
    }
    const customer = await this.resolveByEmail(user.email);
    return customer.id;
  }
}

export type NotificationTriggerType =
  | 'EXPIRY_90'
  | 'EXPIRY_60'
  | 'EXPIRY_30'
  | 'EXPIRY_7'
  | 'EXPIRY_0';

export interface TriggerNotificationPayload {
  customerId: string;
  extinguisherId: string;
  type: NotificationTriggerType;
  message: string;
  serialNumber?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  extinguisherStatus?: string;
}

@Injectable()
export class NotificationClient {
  private readonly logger = new Logger(NotificationClient.name);

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

  async triggerNotification(payload: TriggerNotificationPayload): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/api/internal/notifications/trigger`,
          payload,
          { headers: this.headers },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to trigger notification for extinguisher ${payload.extinguisherId}: ${(error as Error).message}`,
      );
    }
  }
}
