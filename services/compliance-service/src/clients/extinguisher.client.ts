import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ExtinguisherSnapshot {
  id: string;
  customerId: string;
  serialNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
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
    return this.config.get<string>(
      'EXTINGUISHER_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  async getExpiringWithinDays(days: number): Promise<ExtinguisherSnapshot[]> {
    const { data } = await firstValueFrom(
      this.http.get<{ data: ExtinguisherSnapshot[] }>(
        `${this.baseUrl}/api/internal/extinguishers/expiring`,
        { headers: this.headers, params: { days } },
      ),
    );
    return data.data ?? data as unknown as ExtinguisherSnapshot[];
  }
}
