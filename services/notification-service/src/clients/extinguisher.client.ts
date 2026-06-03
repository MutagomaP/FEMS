import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ExtinguisherSnapshot {
  id: string;
  customerId: string;
  serialNumber: string;
  expiryDate: string;
  status: string;
  type?: string;
  capacity?: string;
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
      'http://localhost:3003',
    );
  }

  async findById(id: string): Promise<ExtinguisherSnapshot | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<ExtinguisherSnapshot>(
          `${this.baseUrl}/api/internal/extinguishers/${id}`,
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
}
