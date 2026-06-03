import { Injectable } from '@nestjs/common';
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

  async findById(id: string): Promise<CustomerSnapshot | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CustomerSnapshot>(
          `${this.baseUrl}/api/internal/customers/by-id/${id}`,
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
