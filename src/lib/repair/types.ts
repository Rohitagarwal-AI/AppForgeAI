/**
 * @module lib/repair/types
 * @description Core type definitions for the repair engine.
 * Provides the structural contracts for repair results and pluggable strategies.
 */

import type { ValidationError, RepairLog } from '@/types/pipeline';

/**
 * RepairResult — the outcome of a single repair strategy application.
 */
export interface RepairResult {
  /** Whether the data was successfully repaired. */
  repaired: boolean;

  /** The (possibly modified) data after repair attempt. */
  data: unknown;

  /** Structured logs of what the strategy attempted and the outcome. */
  logs: RepairLog[];
}

/**
 * RepairStrategy — a pluggable, composable repair handler.
 * Strategies are tried in priority order (structural → field → consistency).
 */
export interface RepairStrategy {
  /** Human-readable strategy name for logging and audit trail. */
  name: string;

  /** Determine whether this strategy can address the given validation error. */
  canHandle(error: ValidationError): boolean;

  /** Attempt to repair the data based on the specific validation error. */
  repair(data: unknown, error: ValidationError): RepairResult;
}
