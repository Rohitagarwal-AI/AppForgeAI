/**
 * @module api/generate/[jobId]/repair
 * @description POST /api/generate/:jobId/repair — triggers re-validation and
 * repair for a specific pipeline stage's output.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/db/store';
import { createLogger } from '@/lib/observability/logger';
import type { StageName, ValidationError, RepairLog } from '@/types/pipeline';

const logger = createLogger({ stage: 'api:generate:repair' });

/** Valid stage names that can be repaired. */
const VALID_STAGES: ReadonlySet<string> = new Set<string>([
  'intent_extraction',
  'schema_generation',
  'appspec_generation',
]);

/** Shape of the repair request body. */
interface RepairRequestBody {
  stage: string;
  errorHint?: string;
}

/** Shape of a successful repair response. */
interface RepairResponse {
  jobId: string;
  stage: string;
  repairLogs: RepairLog[];
  validationErrors: ValidationError[];
  status: 'repaired' | 'failed' | 'no_errors_found';
  message: string;
}

/** Shape of an error response. */
interface ErrorResponse {
  error: string;
  code: string;
}

/**
 * Validates the repair request body.
 * @returns The validated body or null if invalid.
 */
function parseAndValidateBody(
  body: unknown,
): { stage: StageName; errorHint?: string } | null {
  if (typeof body !== 'object' || body === null || !('stage' in body)) {
    return null;
  }

  const raw = body as RepairRequestBody;

  if (typeof raw.stage !== 'string' || !VALID_STAGES.has(raw.stage)) {
    return null;
  }

  if (raw.errorHint !== undefined && typeof raw.errorHint !== 'string') {
    return null;
  }

  return {
    stage: raw.stage as StageName,
    errorHint: raw.errorHint,
  };
}

/**
 * Extracts the stage output from a job based on the stage name.
 */
function getStageOutput(
  job: { appSpec: unknown; intent: unknown; dataSchema: unknown },
  stage: StageName,
): unknown {
  switch (stage) {
    case 'intent_extraction':
      return job.intent;
    case 'schema_generation':
      return job.dataSchema;
    case 'appspec_generation':
      return job.appSpec;
  }
}

function getStageUpdate(
  stage: StageName,
  repairedOutput: unknown,
): Record<string, unknown> {
  switch (stage) {
    case 'intent_extraction':
      return { intent: repairedOutput };
    case 'schema_generation':
      return { dataSchema: repairedOutput };
    case 'appspec_generation':
      return { appSpec: repairedOutput };
  }
}

/**
 * POST /api/generate/:jobId/repair
 *
 * Re-runs validation and repair for a specific pipeline stage. Accepts a
 * stage name and optional error hint, validates the stage output, runs the
 * repair engine, and returns the repair results.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<NextResponse<RepairResponse | ErrorResponse>> {
  try {
    const { jobId } = await params;

    // ---------------------------------------------------------------
    // 1. Validate job ID
    // ---------------------------------------------------------------
    if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid job ID', code: 'INVALID_JOB_ID' },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------------
    // 2. Parse request body
    // ---------------------------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 },
      );
    }

    const validated = parseAndValidateBody(body);
    if (!validated) {
      return NextResponse.json(
        {
          error: `Invalid request body. "stage" must be one of: ${[...VALID_STAGES].join(', ')}`,
          code: 'INVALID_BODY',
        },
        { status: 400 },
      );
    }

    const { stage, errorHint } = validated;

    // ---------------------------------------------------------------
    // 3. Fetch the job
    // ---------------------------------------------------------------
    const store = getStore();
    const job = await store.getJob(jobId);

    if (!job) {
      logger.warn('Job not found for repair', { jobId });
      return NextResponse.json(
        { error: `Job "${jobId}" not found`, code: 'JOB_NOT_FOUND' },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------------
    // 4. Verify stage output exists
    // ---------------------------------------------------------------
    const stageOutput = getStageOutput(job, stage);

    if (stageOutput === null || stageOutput === undefined) {
      return NextResponse.json(
        {
          error: `Stage "${stage}" has no output to repair. The pipeline may not have reached this stage yet.`,
          code: 'NO_STAGE_OUTPUT',
        },
        { status: 422 },
      );
    }

    // ---------------------------------------------------------------
    // 5. Run validation and repair
    // ---------------------------------------------------------------
    const repairLogger = createLogger({ jobId, stage: `repair:${stage}` });
    repairLogger.info('Starting repair', { stage, errorHint });

    let repairLogs: RepairLog[] = [];
    let validationErrors: ValidationError[] = [];
    let repairStatus: 'repaired' | 'failed' | 'no_errors_found' = 'no_errors_found';

    try {
      // Dynamically import the repair engine — it may not exist yet
      const repairModule = await import('@/lib/repair/engine');
      const repairResult = await repairModule.runRepair({
        stage,
        stageOutput,
        errorHint,
        jobId,
      });

      repairLogs = repairResult.repairLogs;
      validationErrors = repairResult.remainingErrors;
      repairStatus = repairResult.status;

      // Update the job with repair results
      const existingRepairLogs = (job.repairLogs ?? []) as RepairLog[];
      const existingErrors = (job.validationErrors ?? []) as ValidationError[];

      await store.updateJob(jobId, {
        ...getStageUpdate(stage, repairResult.repairedOutput),
        repairLogs: [...existingRepairLogs, ...repairLogs],
        validationErrors: [
          ...existingErrors.filter(
            (e) => (e as ValidationError).stage !== stage,
          ),
          ...validationErrors,
        ],
      });

      repairLogger.info('Repair completed', {
        stage,
        status: repairStatus,
        repairCount: repairLogs.length,
        remainingErrors: validationErrors.length,
      });
    } catch (importError: unknown) {
      repairLogger.warn(
        'Repair engine not available — returning stub response',
        importError instanceof Error
          ? { error: importError.message }
          : undefined,
      );

      // When the repair engine is not yet implemented, return a
      // meaningful fallback indicating the system is not ready
      const stubTimestamp = new Date().toISOString();
      repairStatus = 'failed';
      repairLogs = [
        {
          strategy: 'structural',
          inputError: {
            code: 'REPAIR_ENGINE_UNAVAILABLE',
            stage,
            path: '',
            message: 'Repair engine is not yet implemented',
            severity: 'warning',
          },
          outcome: 'escalated',
          timestamp: stubTimestamp,
          aiCallMade: false,
        },
      ];
      validationErrors = [];
    }

    // ---------------------------------------------------------------
    // 6. Build response
    // ---------------------------------------------------------------
    const message =
      repairStatus === 'repaired'
        ? `Stage "${stage}" repaired successfully. ${repairLogs.length} repair(s) applied.`
        : repairStatus === 'no_errors_found'
          ? `No validation errors found in stage "${stage}".`
          : `Repair for stage "${stage}" failed. ${validationErrors.length} error(s) remain.`;

    return NextResponse.json(
      {
        jobId,
        stage,
        repairLogs,
        validationErrors,
        status: repairStatus,
        message,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    logger.error(
      'Unhandled error in POST /api/generate/:jobId/repair',
      err instanceof Error ? err : undefined,
    );

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
