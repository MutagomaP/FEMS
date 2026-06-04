import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AuthCustomerUser {
  id: string;
  email: string;
  fullName: string;
}

@Injectable()
export class AuthClient {
  private readonly logger = new Logger(AuthClient.name);

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
    return this.config.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
  }

  async listCustomerUsers(): Promise<AuthCustomerUser[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<AuthCustomerUser[]>(
          `${this.baseUrl}/api/internal/users/customers`,
          { headers: this.headers },
        ),
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to list auth customer users: ${message}`);
      return [];
    }
  }
}
