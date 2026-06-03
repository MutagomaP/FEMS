import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InspectionClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get headers() {
    return { 'X-Service-Key': this.config.get<string>('SERVICE_INTERNAL_KEY', '') };
  }

  private get baseUrl() {
    return this.config.get(
      'INSPECTION_SERVICE_URL',
      'http://localhost:3008',
    );
  }

  async getInspections(status?: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/internal/inspections/report`, {
        headers: this.headers,
        params: status ? { status } : {},
      }),
    );
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  }

  async getMaintenanceLogs() {
    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/api/internal/maintenance/report`, {
        headers: this.headers,
      }),
    );
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  }
}
