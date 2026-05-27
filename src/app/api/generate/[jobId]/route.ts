/**
 * @module api/generate/[jobId]
 * @description GET /api/generate/:jobId — returns full job details including
 * status, appSpec, repair logs, validation errors, cost breakdown,
 * stage latencies, and provider usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db/store';
import type { StoredJob } from '@/lib/db/store';
import { createLogger } from '@/lib/observability/logger';
import type { StageName, StageResult } from '@/types/pipeline';

const logger = createLogger({ stage: 'api:generate:jobId' });

/** Shape of a successful job detail response. */
interface JobDetailResponse {
  id: string;
  jobId: string;
  prompt: string;
  status: string;
  stages: StageResult[];
  appSpec: unknown | null;
  repairLogs: unknown[];
  validationErrors: unknown[];
  totalLatencyMs: number | null;
  totalCostUsd: number | null;
  costBreakdown: Record<string, number>;
  stageLatencies: Record<string, number>;
  providerUsage: unknown[];
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

/** Shape of an error response. */
interface ErrorResponse {
  error: string;
  code: string;
}

/**
 * Maps a StoredJob to the public API response shape.
 */
function toJobDetailResponse(job: StoredJob): JobDetailResponse {
  const stageNames: StageName[] = [
    'intent_extraction',
    'schema_generation',
    'appspec_generation',
  ];
  const stages: StageResult[] = stageNames.map((stage) => ({
    stage,
    status:
      job.status === 'failed' && !job.stageLatencies[stage]
        ? 'failed'
        : job.stageLatencies[stage]
          ? 'completed'
          : job.status === 'processing'
            ? 'running'
            : 'pending',
    latencyMs: job.stageLatencies[stage] ?? 0,
    costUsd: job.costBreakdown[stage] ?? 0,
  }));

  return {
    id: job.id,
    jobId: job.id,
    prompt: job.prompt,
    status: job.status,
    stages,
    appSpec: job.appSpec,
    repairLogs: job.repairLogs,
    validationErrors: job.validationErrors,
    totalLatencyMs: job.totalLatencyMs,
    totalCostUsd: job.totalCostUsd,
    costBreakdown: job.costBreakdown,
    stageLatencies: job.stageLatencies,
    providerUsage: job.providerUsage,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
  };
}

/**
 * GET /api/generate/:jobId
 *
 * Returns the full details of a generation job, including its status,
 * generated AppSpec, repair history, and cost/latency telemetry.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse<JobDetailResponse | ErrorResponse>> {
  try {
    const { jobId } = await params;

    if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid job ID', code: 'INVALID_JOB_ID' },
        { status: 400 },
      );
    }

    const store = getStore();
    const job = await store.getJob(jobId);

    if (!job) {
      logger.warn('Job not found', { jobId });
      return NextResponse.json(
        { error: `Job "${jobId}" not found`, code: 'JOB_NOT_FOUND' },
        { status: 404 },
      );
    }

    logger.debug('Job details fetched', { jobId, status: job.status });

    return NextResponse.json(toJobDetailResponse(job), { status: 200 });
  } catch (err: unknown) {
    logger.error(
      'Unhandled error in GET /api/generate/:jobId',
      err instanceof Error ? err : undefined,
    );

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
