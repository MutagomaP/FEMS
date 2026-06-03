import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtPayload, UserRole } from '@fems/shared';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CustomerClient {
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
    return this.config.get('CUSTOMER_SERVICE_URL', 'http://localhost:3002');
  }

  async findByEmail(email: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/internal/customers/by-email/${encodeURIComponent(email)}`, {
        headers: this.headers,
      }),
    );
    return data as { id: string; email: string; fullName: string };
  }

  async resolveCustomerIdForUser(user: JwtPayload): Promise<string> {
    if (user.customerId) return user.customerId;
    const customer = await this.findByEmail(user.email);
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer.id;
  }
}

@Injectable()
export class ExtinguisherClient {
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
    return this.config.get(
      'EXTINGUISHER_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  async getCustomerIdForExtinguisher(extinguisherId: string): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ customerId: string }>(
          `${this.baseUrl}/api/internal/extinguishers/${extinguisherId}`,
          { headers: this.headers },
        ),
      );
      if (!data?.customerId) {
        throw new BadRequestException('Could not resolve customer for extinguisher');
      }
      return data.customerId;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid extinguisher selected');
    }
  }
}

@Injectable()
export class AuthClient {
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
    return this.config.get('AUTH_SERVICE_URL', 'http://localhost:3001');
  }

  async findById(id: string): Promise<{ id: string; email: string; role: string }> {
    const { data } = await firstValueFrom(
      this.http.get<{ id: string; email: string; role: string }>(
        `${this.baseUrl}/api/internal/users/${id}`,
        { headers: this.headers },
      ),
    );
    return data;
  }

  async assertInspector(userId: string): Promise<{ id: string; email: string }> {
    const user = await this.findById(userId);
    if (user.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('inspectorUserId must reference an inspector account');
    }
    return user;
  }

  async listAdmins(): Promise<{ id: string; email: string; fullName: string }[]> {
    const { data } = await firstValueFrom(
      this.http.get<{ id: string; email: string; fullName: string }[]>(
        `${this.baseUrl}/api/internal/users/admins`,
        { headers: this.headers },
      ),
    );
    return data;
  }
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
    return this.config.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3004');
  }

  async trigger(payload: {
    customerId: string;
    extinguisherId: string;
    type: string;
    message: string;
    recipientEmail?: string;
    skipIdempotency?: boolean;
  }): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/internal/notifications/trigger`, payload, {
          headers: this.headers,
        }),
      );
    } catch (error) {
      this.logger.warn(`Notification trigger failed: ${(error as Error).message}`);
    }
  }
}
