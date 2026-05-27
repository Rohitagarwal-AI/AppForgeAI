/**
 * @module api/generate
 * @description POST /api/generate — accepts a user prompt, creates a pipeline
 * job, starts background generation, and returns the job ID immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getStore } from '@/lib/db/store';
import type { SSEEvent, PipelineResult } from '@/types/pipeline';
import { createLogger } from '@/lib/observability/logger';

const logger = createLogger({ stage: 'api:generate' });

/** Shape of the request body for POST /api/generate. */
interface GenerateRequestBody {
  prompt: string;
}

/** Shape of the success response from POST /api/generate. */
interface GenerateResponse {
  jobId: string;
  status: string;
  message: string;
}

/** Shape of an error response. */
interface ErrorResponse {
  error: string;
  code: string;
}

/**
 * Validates the request body and extracts the prompt.
 * @returns The prompt string or null if invalid.
 */
function parseAndValidateBody(body: unknown): string | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('prompt' in body)
  ) {
    return null;
  }

  const { prompt } = body as GenerateRequestBody;

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return null;
  }

  return prompt.trim();
}

/**
 * Creates an event emitter function bound to a specific job that persists
 * SSE events through the store.
 */
function createEventEmitter(jobId: string): (event: SSEEvent) => Promise<void> {
  const store = getStore();

  return async (event: SSEEvent): Promise<void> => {
    await store.addStageEvent({
      jobId,
      stage: event.stage ?? 'pipeline',
      eventType: event.type,
      payload: {
        ...event.data,
        timestamp: event.timestamp,
      },
    });

    logger.debug('SSE event emitted', {
      jobId,
      eventType: event.type,
      stage: event.stage ?? 'pipeline',
    });
  };
}

/**
 * Runs the pipeline in the background and updates the job store on
 * completion or failure. This function is intentionally not awaited by
 * the request handler.
 */
async function runBackgroundPipeline(
  jobId: string,
  prompt: string,
): Promise<void> {
  const store = getStore();
  const emitEvent = createEventEmitter(jobId);
  const jobLogger = createLogger({ jobId, stage: 'pipeline:runner' });

  try {
    // Transition job to processing
    await store.updateJob(jobId, { status: 'processing' });

    jobLogger.info('Pipeline started', { prompt: prompt.slice(0, 200) });

    // Dynamically import the orchestrator — it may not exist yet during
    // early development, so we handle the import failure gracefully.
    let runPipeline: (
      prompt: string,
      emitEvent: (event: SSEEvent) => Promise<void>,
      jobId?: string,
    ) => Promise<PipelineResult>;

    try {
      const orchestrator = await import('@/lib/pipeline/orchestrator');
      runPipeline = orchestrator.runPipeline;
    } catch {
      jobLogger.warn(
        'Pipeline orchestrator not available — generating stub result',
      );

      // Emit stage events for the stub run
      const stubTimestamp = new Date().toISOString();

      await emitEvent({
        type: 'stage_start',
        stage: 'intent_extraction',
        data: { message: 'Starting intent extraction (stub)' },
        timestamp: stubTimestamp,
      });

      await emitEvent({
        type: 'stage_complete',
        stage: 'intent_extraction',
        data: { message: 'Intent extraction completed (stub)', latencyMs: 0 },
        timestamp: new Date().toISOString(),
      });

      await emitEvent({
        type: 'generation_complete',
        data: {
          message: 'Pipeline completed (stub — orchestrator not implemented)',
          jobId,
        },
        timestamp: new Date().toISOString(),
      });

      await store.updateJob(jobId, {
        status: 'completed',
        totalLatencyMs: 0,
        totalCostUsd: 0,
        completedAt: new Date().toISOString(),
      });

      jobLogger.info('Pipeline completed (stub)');
      return;
    }

    const result = await runPipeline(prompt, emitEvent, jobId);

    // Persist the pipeline result into the job store
    await store.updateJob(jobId, {
      status: result.status === 'completed' ? 'completed' : 'failed',
      appSpec: result.appSpec ?? null,
      intent:
        result.stages.find((stage) => stage.stage === 'intent_extraction')
          ?.output ?? null,
      dataSchema:
        result.stages.find((stage) => stage.stage === 'schema_generation')
          ?.output ?? null,
      repairLogs: result.repairLogs,
      validationErrors: result.validationErrors,
      totalLatencyMs: result.totalLatencyMs,
      totalCostUsd: result.totalCostUsd,
      costBreakdown: result.stages.reduce<Record<string, number>>(
        (acc, s) => {
          acc[s.stage] = s.costUsd;
          return acc;
        },
        {},
      ),
      stageLatencies: result.stages.reduce<Record<string, number>>(
        (acc, s) => {
          acc[s.stage] = s.latencyMs;
          return acc;
        },
        {},
      ),
      providerUsage: result.appSpec?.metadata?.providerUsage ?? [],
      completedAt: new Date().toISOString(),
    });

    jobLogger.info('Pipeline completed', {
      status: result.status,
      totalLatencyMs: result.totalLatencyMs,
      totalCostUsd: result.totalCostUsd,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown pipeline error';

    jobLogger.error('Pipeline failed', err instanceof Error ? err : undefined);

    // Emit failure event
    await emitEvent({
      type: 'stage_failed',
      data: { error: errorMessage, jobId },
      timestamp: new Date().toISOString(),
    });

    await store.updateJob(jobId, {
      status: 'failed',
      error: errorMessage,
      completedAt: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/generate
 *
 * Accepts a prompt, creates a generation job, starts the pipeline in the
 * background, and returns the job ID for polling / SSE streaming.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<GenerateResponse | ErrorResponse>> {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 },
      );
    }

    const prompt = parseAndValidateBody(body);

    if (prompt === null) {
      return NextResponse.json(
        {
          error:
            'Missing or invalid "prompt" field. Must be a non-empty string.',
          code: 'INVALID_PROMPT',
        },
        { status: 400 },
      );
    }

    // Cap prompt length to avoid abuse
    const MAX_PROMPT_LENGTH = 10_000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`,
          code: 'PROMPT_TOO_LONG',
        },
        { status: 400 },
      );
    }

    const jobId = uuidv4();
    const store = getStore();

    // Create the job with pending status
    await store.createJob(jobId, prompt);

    logger.info('Job created', { jobId, promptLength: prompt.length });

    // Start pipeline in the background — intentionally not awaited
    void runBackgroundPipeline(jobId, prompt);

    return NextResponse.json(
      {
        jobId,
        status: 'pending',
        message: 'Generation started. Use GET /api/generate/:jobId/stream to follow progress.',
      },
      { status: 202 },
    );
  } catch (err: unknown) {
    logger.error(
      'Unhandled error in POST /api/generate',
      err instanceof Error ? err : undefined,
    );

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
