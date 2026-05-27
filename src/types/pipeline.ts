/**
 * @module types/pipeline
 * @description Type definitions for pipeline orchestration, validation,
 * SSE streaming, and repair logging.
 */

import type { AppSpec } from '@/types/appspec';

// ---------------------------------------------------------------------------
// Stage & Job Status
// ---------------------------------------------------------------------------

/** Lifecycle status of a single pipeline stage. */
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** Canonical names for each pipeline stage. */
export type StageName = 'intent_extraction' | 'schema_generation' | 'appspec_generation';

/** Top-level job status. */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ---------------------------------------------------------------------------
// Validation & Repair
// ---------------------------------------------------------------------------

/**
 * ValidationError — a structured error surfaced during schema or spec validation.
 */
export interface ValidationError {
  /** Machine-readable error code. */
  code: string;

  /** Stage that produced the error. */
  stage: string;

  /** JSON-path or dot-notation path to the offending value. */
  path: string;

  /** Human-readable error message. */
  message: string;

  /** Severity level determining whether the pipeline can proceed. */
  severity: 'critical' | 'warning' | 'info';

  /** Optional suggested fix description. */
  suggestedFix?: string;
}

/**
 * RepairLog — records an attempted automatic repair of a validation error.
 */
export interface RepairLog {
  /** Category of repair strategy applied. */
  strategy: 'structural' | 'field' | 'consistency';

  /** The original validation error that triggered repair. */
  inputError: ValidationError;

  /** Result of the repair attempt. */
  outcome: 'repaired' | 'failed' | 'escalated';

  /** ISO-8601 timestamp of the repair attempt. */
  timestamp: string;

  /** Whether an AI provider was called during repair. */
  aiCallMade: boolean;

  /** Value before repair (for audit trail). */
  beforeValue?: unknown;

  /** Value after repair (for audit trail). */
  afterValue?: unknown;
}

// ---------------------------------------------------------------------------
// Stage Result
// ---------------------------------------------------------------------------

/**
 * StageResult — outcome of a single pipeline stage execution.
 */
export interface StageResult {
  /** Which stage this result belongs to. */
  stage: StageName;

  /** Current status of the stage. */
  status: StageStatus;

  /** Wall-clock latency for this stage in milliseconds. */
  latencyMs: number;

  /** Estimated cost in USD for this stage. */
  costUsd: number;

  /** Stage-specific output payload (AppIntent | DataSchema | AppSpec). */
  output?: unknown;

  /** Validation errors detected in this stage's output. */
  errors?: ValidationError[];

  /** Repair attempts made during this stage. */
  repairLogs?: RepairLog[];
}

// ---------------------------------------------------------------------------
// SSE Events
// ---------------------------------------------------------------------------

/**
 * SSEEvent — a server-sent event pushed to clients during pipeline execution.
 */
export interface SSEEvent {
  /** Discriminator for the event type. */
  type: 'stage_start' | 'stage_complete' | 'stage_failed' | 'generation_complete';

  /** The pipeline stage this event relates to (omitted for generation_complete). */
  stage?: StageName;

  /** Arbitrary event payload. */
  data: Record<string, unknown>;

  /** ISO-8601 timestamp of the event. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Pipeline Result
// ---------------------------------------------------------------------------

/**
 * PipelineResult — the complete result of a pipeline run.
 */
export interface PipelineResult {
  /** Unique job identifier. */
  jobId: string;

  /** Overall job status. */
  status: JobStatus;

  /** Results for each pipeline stage. */
  stages: StageResult[];

  /** The final AppSpec if generation completed successfully. */
  appSpec?: AppSpec;

  /** Total end-to-end latency in milliseconds. */
  totalLatencyMs: number;

  /** Total estimated cost in USD. */
  totalCostUsd: number;

  /** Aggregated repair logs across all stages. */
  repairLogs: RepairLog[];

  /** Aggregated validation errors across all stages. */
  validationErrors: ValidationError[];
}
