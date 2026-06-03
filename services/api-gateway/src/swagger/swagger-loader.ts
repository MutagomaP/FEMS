import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  fetchOpenApiSpec,
  mergeOpenApiDocuments,
  OpenApiDocument,
} from './aggregate-openapi';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const EXPECTED_SERVICES = 8;

export interface ServiceOpenApiTarget {
  name: string;
  url: string;
}

export function getOpenApiServiceTargets(
  config: ConfigService,
): ServiceOpenApiTarget[] {
  return [
    { name: 'auth', url: config.get('AUTH_SERVICE_URL', 'http://localhost:3001') },
    {
      name: 'customer',
      url: config.get('CUSTOMER_SERVICE_URL', 'http://localhost:3002'),
    },
    {
      name: 'extinguisher',
      url: config.get('EXTINGUISHER_SERVICE_URL', 'http://localhost:3003'),
    },
    {
      name: 'notification',
      url: config.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3004'),
    },
    {
      name: 'renewal',
      url: config.get('RENEWAL_SERVICE_URL', 'http://localhost:3005'),
    },
    {
      name: 'compliance',
      url: config.get('COMPLIANCE_SERVICE_URL', 'http://localhost:3006'),
    },
    {
      name: 'report',
      url: config.get('REPORT_SERVICE_URL', 'http://localhost:3007'),
    },
    {
      name: 'inspection',
      url: config.get('INSPECTION_SERVICE_URL', 'http://localhost:3008'),
    },
  ];
}

export interface LoadMergedOpenApiOptions {
  maxAttempts?: number;
  pollIntervalMs?: number;
  logProgress?: boolean;
}

export async function fetchAvailableOpenApiDocs(
  services: ServiceOpenApiTarget[],
): Promise<{ documents: OpenApiDocument[]; loaded: string[]; missing: string[] }> {
  const documents: OpenApiDocument[] = [];
  const loaded: string[] = [];
  const missing: string[] = [];

  for (const svc of services) {
    try {
      const doc = await fetchOpenApiSpec(`${svc.url}/api/docs-json`);
      const pathCount = Object.keys(doc.paths ?? {}).length;
      if (pathCount > 0) {
        documents.push(doc);
        loaded.push(svc.name);
      } else {
        missing.push(svc.name);
      }
    } catch {
      missing.push(svc.name);
    }
  }

  return { documents, loaded, missing };
}

export async function loadMergedOpenApi(
  config: ConfigService,
  logger: Logger,
  options: LoadMergedOpenApiOptions = {},
): Promise<OpenApiDocument> {
  const maxAttempts = options.maxAttempts ?? 40;
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const logProgress = options.logProgress ?? true;
  const services = getOpenApiServiceTargets(config);

  let bestMerged: OpenApiDocument = mergeOpenApiDocuments([]);
  let bestDocCount = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { documents, loaded, missing } = await fetchAvailableOpenApiDocs(services);
    const merged = mergeOpenApiDocuments(documents);
    const totalPaths = Object.keys(merged.paths ?? {}).length;

    if (
      documents.length > bestDocCount ||
      (documents.length === bestDocCount &&
        totalPaths > Object.keys(bestMerged.paths ?? {}).length)
    ) {
      bestMerged = merged;
      bestDocCount = documents.length;
    }

    if (documents.length >= EXPECTED_SERVICES) {
      merged.servers = [
        { url: 'http://localhost:3000', description: 'API Gateway' },
      ];
      if (logProgress) {
        logger.log(
          `OpenAPI merged: ${totalPaths} paths from ${documents.length}/${EXPECTED_SERVICES} services`,
        );
      }
      return merged;
    }

    if (logProgress && (attempt === 1 || attempt % 5 === 0)) {
      logger.log(
        `Waiting for microservices OpenAPI (${loaded.length}/${EXPECTED_SERVICES} specs, attempt ${attempt}/${maxAttempts})...`,
      );
      if (missing.length) {
        logger.log(`  Missing OpenAPI: ${missing.join(', ')}`);
      }
    }
    await sleep(pollIntervalMs);
  }

  const { missing: finalMissing } = await fetchAvailableOpenApiDocs(services);
  if (logProgress) {
    logger.warn(
      `Could not load full OpenAPI from all services (${bestDocCount}/${EXPECTED_SERVICES}). Missing: ${finalMissing.join(', ') || 'unknown'}. Ensure ports 3001–3008 are running.`,
    );
  }
  bestMerged.servers = [
    { url: 'http://localhost:3000', description: 'API Gateway' },
  ];
  return bestMerged;
}
