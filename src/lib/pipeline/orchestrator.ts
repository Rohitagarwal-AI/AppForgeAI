/**
 * @module lib/pipeline/orchestrator
 * @description Multi-stage AppForgeAI pipeline orchestrator.
 */

import type { AppIntent } from '@/types/intent';
import type { DataSchema } from '@/types/schema';
import type { AppSpec } from '@/types/appspec';
import type {
  PipelineResult,
  RepairLog,
  SSEEvent,
  StageName,
  StageResult,
  ValidationError,
} from '@/types/pipeline';
import type {
  AICompletionRequest,
  AICompletionResponse,
  GatewayStage,
} from '@/lib/gateway/types';
import { extractIntent } from '@/lib/pipeline/stages/intent-extraction';
import { generateSchema } from '@/lib/pipeline/stages/schema-generation';
import { generateAppSpec } from '@/lib/pipeline/stages/appspec-generation';
import {
  extractIntentDeterministic,
  generateAppSpecDeterministic,
  generateSchemaDeterministic,
} from '@/lib/pipeline/local-generator';
import { validateStageOutput } from '@/lib/validation/engine';
import { runRepair } from '@/lib/repair/engine';
import { CostTracker } from '@/lib/gateway/cost-tracker';
import { createProviderGateway } from '@/lib/gateway/provider-gateway';
import { createLogger } from '@/lib/observability/logger';

type EventEmitter = (event: SSEEvent) => Promise<void>;

interface StageExecution<TOutput> {
  output: TOutput;
  result: StageResult;
  repairLogs: RepairLog[];
  validationErrors: ValidationError[];
}

const PIPELINE_VERSION = '1.0.0';

const STAGE_TO_GATEWAY_STAGE: Record<StageName, GatewayStage> = {
  intent_extraction: 'intentExtraction',
  schema_generation: 'schemaGeneration',
  appspec_generation: 'appSpecGeneration',
};

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function createLocalUsage(
  stage: StageName,
  prompt: string,
  content: string,
): AICompletionResponse {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(content);

  return {
    content,
    provider: 'local',
    model: 'deterministic',
    latencyMs: 0,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostUsd: 0,
    },
  };
}

async function emit(
  emitEvent: EventEmitter,
  event: Omit<SSEEvent, 'timestamp'>,
): Promise<void> {
  await emitEvent({
    ...event,
    timestamp: new Date().toISOString(),
  });
}

function flattenValidationErrors(stage: StageName, output: unknown): ValidationError[] {
  const validation = validateStageOutput(stage, output);
  return [...validation.errors, ...validation.warnings];
}

async function executeStage<TOutput>({
  jobId,
  stage,
  emitEvent,
  run,
  costTracker,
}: {
  jobId: string;
  stage: StageName;
  emitEvent: EventEmitter;
  run: () => Promise<TOutput>;
  costTracker: CostTracker;
}): Promise<StageExecution<TOutput>> {
  const startedAt = performance.now();
  const logger = createLogger({ jobId, stage });

  await emit(emitEvent, {
    type: 'stage_start',
    stage,
    data: { message: `${stage} started` },
  });

  try {
    let output: unknown = await run();
    let repairLogs: RepairLog[] = [];
    let validationErrors = flattenValidationErrors(stage, output);

    if (validationErrors.length > 0) {
      const repairResult = await runRepair({
        stage,
        stageOutput: output,
        jobId,
      });
      output = repairResult.repairedOutput;
      repairLogs = repairResult.repairLogs;
      validationErrors = repairResult.remainingErrors;
    }

    const finalValidation = validateStageOutput(stage, output);
    const allRemainingErrors = [
      ...finalValidation.errors,
      ...finalValidation.warnings,
    ];
    const latencyMs = Math.round(performance.now() - startedAt);
    const costUsd = costTracker.getStageCost(stage);

    if (!finalValidation.valid) {
      const message = finalValidation.errors
        .map((error) => error.message)
        .join('; ');

      await emit(emitEvent, {
        type: 'stage_failed',
        stage,
        data: {
          message,
          latencyMs,
          costUsd,
          validationErrors: finalValidation.errors,
        },
      });

      return {
        output: output as TOutput,
        result: {
          stage,
          status: 'failed',
          latencyMs,
          costUsd,
          output,
          errors: allRemainingErrors,
          repairLogs,
        },
        repairLogs,
        validationErrors: allRemainingErrors,
      };
    }

    await emit(emitEvent, {
      type: 'stage_complete',
      stage,
      data: {
        message: `${stage} completed`,
        latencyMs,
        costUsd,
        validationErrors: allRemainingErrors,
        repairLogs,
      },
    });

    logger.info('Stage completed', {
      latencyMs,
      costUsd,
      validationErrorCount: allRemainingErrors.length,
      repairCount: repairLogs.length,
    });

    return {
      output: output as TOutput,
      result: {
        stage,
        status: 'completed',
        latencyMs,
        costUsd,
        output,
        errors: allRemainingErrors,
        repairLogs,
      },
      repairLogs,
      validationErrors: allRemainingErrors,
    };
  } catch (error: unknown) {
    const latencyMs = Math.round(performance.now() - startedAt);
    const message = error instanceof Error ? error.message : 'Unknown stage error';
    const validationError: ValidationError = {
      code: 'STAGE_EXECUTION_FAILED',
      stage,
      path: '',
      message,
      severity: 'critical',
      suggestedFix: 'Inspect provider configuration and stage input contracts.',
    };

    logger.error('Stage failed', error instanceof Error ? error : undefined);

    await emit(emitEvent, {
      type: 'stage_failed',
      stage,
      data: { message, latencyMs, costUsd: costTracker.getStageCost(stage) },
    });

    return {
      output: undefined as TOutput,
      result: {
        stage,
        status: 'failed',
        latencyMs,
        costUsd: costTracker.getStageCost(stage),
        errors: [validationError],
      },
      repairLogs: [],
      validationErrors: [validationError],
    };
  }
}

export async function runPipeline(
  prompt: string,
  emitEvent: EventEmitter,
  existingJobId?: string,
): Promise<PipelineResult> {
  const jobId = existingJobId ?? crypto.randomUUID();
  const startedAt = performance.now();
  const logger = createLogger({ jobId, stage: 'pipeline' });
  const gateway = createProviderGateway();
  const costTracker = new CostTracker();
  const stages: StageResult[] = [];
  const repairLogs: RepairLog[] = [];
  const validationErrors: ValidationError[] = [];
  const forceLocal = process.env.APPFORGE_FORCE_LOCAL === 'true';
  const hasExternalProvider = gateway
    .availableProviders()
    .some((provider) => provider !== 'local') && !forceLocal;

  logger.info('Pipeline execution started', {
    hasExternalProvider,
    forceLocal,
    availableProviders: gateway.availableProviders(),
  });

  const completeWithGateway =
    (stage: StageName) =>
    async (request: AICompletionRequest): Promise<AICompletionResponse> => {
      const response = await gateway.complete(STAGE_TO_GATEWAY_STAGE[stage], request);
      costTracker.trackUsage(stage, response);
      return response;
    };

  const intentStage = await executeStage<AppIntent>({
    jobId,
    stage: 'intent_extraction',
    emitEvent,
    costTracker,
    run: async () => {
      if (!hasExternalProvider) {
        const output = extractIntentDeterministic(prompt);
        costTracker.trackUsage(
          'intent_extraction',
          createLocalUsage('intent_extraction', prompt, JSON.stringify(output)),
        );
        return output;
      }

      try {
        return await extractIntent(prompt, completeWithGateway('intent_extraction'));
      } catch (error: unknown) {
        logger.warn('Intent AI stage fell back to deterministic planner', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return extractIntentDeterministic(prompt);
      }
    },
  });
  stages.push(intentStage.result);
  repairLogs.push(...intentStage.repairLogs);
  validationErrors.push(...intentStage.validationErrors);

  if (intentStage.result.status === 'failed') {
    return finishFailed(jobId, startedAt, stages, repairLogs, validationErrors);
  }

  const intent = intentStage.output;

  const schemaStage = await executeStage<DataSchema>({
    jobId,
    stage: 'schema_generation',
    emitEvent,
    costTracker,
    run: async () => {
      if (!hasExternalProvider) {
        const output = generateSchemaDeterministic(intent);
        costTracker.trackUsage(
          'schema_generation',
          createLocalUsage('schema_generation', JSON.stringify(intent), JSON.stringify(output)),
        );
        return output;
      }

      try {
        return await generateSchema(intent, completeWithGateway('schema_generation'));
      } catch (error: unknown) {
        logger.warn('Schema AI stage fell back to deterministic planner', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return generateSchemaDeterministic(intent);
      }
    },
  });
  stages.push(schemaStage.result);
  repairLogs.push(...schemaStage.repairLogs);
  validationErrors.push(...schemaStage.validationErrors);

  if (schemaStage.result.status === 'failed') {
    return finishFailed(jobId, startedAt, stages, repairLogs, validationErrors);
  }

  const dataSchema = schemaStage.output;

  const appSpecStage = await executeStage<AppSpec>({
    jobId,
    stage: 'appspec_generation',
    emitEvent,
    costTracker,
    run: async () => {
      if (!hasExternalProvider) {
        const output = generateAppSpecDeterministic(intent, dataSchema);
        costTracker.trackUsage(
          'appspec_generation',
          createLocalUsage(
            'appspec_generation',
            JSON.stringify({ intent, dataSchema }),
            JSON.stringify(output),
          ),
        );
        return output;
      }

      try {
        return await generateAppSpec(
          intent,
          dataSchema,
          completeWithGateway('appspec_generation'),
        );
      } catch (error: unknown) {
        logger.warn('AppSpec AI stage fell back to deterministic planner', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return generateAppSpecDeterministic(intent, dataSchema);
      }
    },
  });
  stages.push(appSpecStage.result);
  repairLogs.push(...appSpecStage.repairLogs);
  validationErrors.push(...appSpecStage.validationErrors);

  if (appSpecStage.result.status === 'failed') {
    return finishFailed(jobId, startedAt, stages, repairLogs, validationErrors);
  }

  const appSpec = appSpecStage.output;
  const totalLatencyMs = Math.round(performance.now() - startedAt);
  const totalCostUsd = costTracker.getTotalCost();
  appSpec.metadata = {
    generatedAt: new Date().toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    totalLatencyMs,
    totalCostUsd,
    providerUsage: costTracker.getUsageEntries(),
  };

  await emit(emitEvent, {
    type: 'generation_complete',
    data: {
      message: 'Generation completed',
      totalLatencyMs,
      totalCostUsd,
      repairCount: repairLogs.length,
      validationErrorCount: validationErrors.length,
    },
  });

  return {
    jobId,
    status: 'completed',
    stages,
    appSpec,
    totalLatencyMs,
    totalCostUsd,
    repairLogs,
    validationErrors,
  };
}

function finishFailed(
  jobId: string,
  startedAt: number,
  stages: StageResult[],
  repairLogs: RepairLog[],
  validationErrors: ValidationError[],
): PipelineResult {
  return {
    jobId,
    status: 'failed',
    stages,
    totalLatencyMs: Math.round(performance.now() - startedAt),
    totalCostUsd: stages.reduce((sum, stage) => sum + stage.costUsd, 0),
    repairLogs,
    validationErrors,
  };
}
