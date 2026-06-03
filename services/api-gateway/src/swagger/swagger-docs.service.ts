import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mergeOpenApiDocuments, OpenApiDocument } from './aggregate-openapi';
import {
  EXPECTED_SERVICES,
  fetchAvailableOpenApiDocs,
  getOpenApiServiceTargets,
} from './swagger-loader';

@Injectable()
export class SwaggerDocsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SwaggerDocsService.name);
  private spec: OpenApiDocument = mergeOpenApiDocuments([]);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private loadedServiceCount = 0;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.refresh(false);
    this.scheduleBackgroundRefresh();
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  getSpec(): OpenApiDocument {
    return this.spec;
  }

  async refresh(log = true): Promise<OpenApiDocument> {
    const services = getOpenApiServiceTargets(this.config);
    const { documents, loaded, missing } = await fetchAvailableOpenApiDocs(services);
    this.loadedServiceCount = loaded.length;

    if (documents.length > 0) {
      this.spec = mergeOpenApiDocuments(documents);
      this.spec.servers = [
        { url: 'http://localhost:3000', description: 'API Gateway' },
      ];
    }

    const pathCount = Object.keys(this.spec.paths ?? {}).length;
    if (log) {
      if (loaded.length >= EXPECTED_SERVICES) {
        this.logger.log(
          `OpenAPI ready: ${pathCount} paths from ${loaded.length}/${EXPECTED_SERVICES} services`,
        );
      } else if (loaded.length > 0) {
        this.logger.warn(
          `OpenAPI partial: ${pathCount} paths from ${loaded.length}/${EXPECTED_SERVICES} (missing: ${missing.join(', ')})`,
        );
      }
    }
    return this.spec;
  }

  private scheduleBackgroundRefresh() {
    if (this.loadedServiceCount >= EXPECTED_SERVICES) {
      return;
    }

    this.refreshTimer = setInterval(async () => {
      const before = this.loadedServiceCount;
      await this.refresh(true);
      if (this.loadedServiceCount >= EXPECTED_SERVICES) {
        if (this.refreshTimer) {
          clearInterval(this.refreshTimer);
          this.refreshTimer = null;
        }
      } else if (this.loadedServiceCount > before) {
        this.logger.log(
          `OpenAPI updated (${this.loadedServiceCount}/${EXPECTED_SERVICES} services)`,
        );
      }
    }, 10_000);
  }
}
