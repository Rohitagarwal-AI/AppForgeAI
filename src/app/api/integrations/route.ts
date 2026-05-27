/**
 * @module api/integrations
 * @description GET /api/integrations returns the validated integration registry.
 */

import { NextResponse } from 'next/server';
import type { IntegrationDefinition } from '@/types/integration';
import {
  getIntegrationRegistry,
  validateIntegrationRegistry,
} from '@/lib/integrations/registry';
import { createLogger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger({ stage: 'api:integrations' });

interface IntegrationsResponse {
  integrations: IntegrationDefinition[];
  count: number;
  registryValid: boolean;
  registryErrors: string[];
}

interface ErrorResponse {
  error: string;
  code: string;
}

export async function GET(): Promise<
  NextResponse<IntegrationsResponse | ErrorResponse>
> {
  try {
    const integrations = getIntegrationRegistry();
    const validation = validateIntegrationRegistry();

    logger.info('Integration registry fetched', {
      count: integrations.length,
      registryValid: validation.valid,
    });

    return NextResponse.json(
      {
        integrations,
        count: integrations.length,
        registryValid: validation.valid,
        registryErrors: validation.errors,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    logger.error(
      'Unhandled error in GET /api/integrations',
      err instanceof Error ? err : undefined,
    );

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
