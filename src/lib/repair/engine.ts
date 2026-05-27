/**
 * @module lib/repair/engine
 * @description Stage-aware repair engine. Runs validation, applies
 * deterministic repair strategies, and returns structured outcomes.
 */

import type { AppSpec } from '@/types/appspec';
import type { DataSchema } from '@/types/schema';
import type { RepairLog, StageName, ValidationError } from '@/types/pipeline';
import type { RepairStrategy } from '@/lib/repair/types';
import { validateStageOutput } from '@/lib/validation/engine';
import { structuralRepairStrategy } from '@/lib/repair/strategies/structural-repair';
import { fieldRepairStrategy } from '@/lib/repair/strategies/field-repair';
import { consistencyRepairStrategy } from '@/lib/repair/strategies/consistency-repair';
import { createLogger } from '@/lib/observability/logger';

export interface RunRepairInput {
  stage: StageName;
  stageOutput: unknown;
  errorHint?: string;
  jobId?: string;
}

export interface RunRepairResult {
  status: 'repaired' | 'failed' | 'no_errors_found';
  repairedOutput: unknown;
  repairLogs: RepairLog[];
  remainingErrors: ValidationError[];
}

const MAX_REPAIR_PASSES = 4;

const STRATEGIES: readonly RepairStrategy[] = [
  structuralRepairStrategy,
  fieldRepairStrategy,
  consistencyRepairStrategy,
];

function getRepairableErrors(stage: StageName, output: unknown): ValidationError[] {
  const result = validateStageOutput(stage, output);
  return [...result.errors, ...result.warnings];
}

function isAppSpec(data: unknown): data is AppSpec {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>)['pages']) &&
    typeof (data as Record<string, unknown>)['dataSchema'] === 'object'
  );
}

function cloneAppSpec(spec: AppSpec): AppSpec {
  return JSON.parse(JSON.stringify(spec)) as AppSpec;
}

function applyFieldRepairToNestedSchema(
  appSpec: AppSpec,
  error: ValidationError,
): { repaired: boolean; data: AppSpec; logs: RepairLog[] } {
  const schemaRepair = fieldRepairStrategy.repair(appSpec.dataSchema, error);
  if (!schemaRepair.repaired) {
    return {
      repaired: false,
      data: appSpec,
      logs: schemaRepair.logs,
    };
  }

  const patched = cloneAppSpec(appSpec);
  patched.dataSchema = schemaRepair.data as DataSchema;

  return {
    repaired: true,
    data: patched,
    logs: schemaRepair.logs,
  };
}

function markEscalated(error: ValidationError): RepairLog {
  return {
    strategy: 'consistency',
    inputError: error,
    outcome: 'escalated',
    timestamp: new Date().toISOString(),
    aiCallMade: false,
  };
}

export async function runRepair({
  stage,
  stageOutput,
  errorHint,
  jobId,
}: RunRepairInput): Promise<RunRepairResult> {
  const logger = createLogger({ jobId, stage: `repair:${stage}` });
  let current = stageOutput;
  const repairLogs: RepairLog[] = [];

  logger.info('Repair validation started', { errorHint });

  let errors = getRepairableErrors(stage, current);
  if (errors.length === 0) {
    return {
      status: 'no_errors_found',
      repairedOutput: current,
      repairLogs,
      remainingErrors: [],
    };
  }

  for (let pass = 1; pass <= MAX_REPAIR_PASSES; pass++) {
    let changed = false;

    for (const error of errors) {
      const strategy = STRATEGIES.find((candidate) => candidate.canHandle(error));

      if (!strategy) {
        repairLogs.push(markEscalated(error));
        continue;
      }

      const repairResult =
        stage === 'appspec_generation' &&
        error.code.startsWith('SCHEMA_') &&
        isAppSpec(current)
          ? applyFieldRepairToNestedSchema(current, error)
          : strategy.repair(current, error);

      repairLogs.push(...repairResult.logs);

      if (repairResult.repaired) {
        current = repairResult.data;
        changed = true;
      }
    }

    const nextErrors = getRepairableErrors(stage, current);
    logger.debug('Repair pass completed', {
      pass,
      beforeErrors: errors.length,
      afterErrors: nextErrors.length,
      changed,
    });

    errors = nextErrors;

    if (errors.length === 0) {
      return {
        status: 'repaired',
        repairedOutput: current,
        repairLogs,
        remainingErrors: [],
      };
    }

    if (!changed) {
      break;
    }
  }

  return {
    status: repairLogs.some((log) => log.outcome === 'repaired')
      ? 'repaired'
      : 'failed',
    repairedOutput: current,
    repairLogs,
    remainingErrors: errors,
  };
}
