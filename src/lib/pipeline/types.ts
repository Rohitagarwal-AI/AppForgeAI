/**
 * @module lib/pipeline/types
 * @description Shared types used across pipeline stages and the orchestrator.
 * Provides the event-emission contract and per-stage execution context.
 */

import type { SSEEvent } from '@/types/pipeline';

/**
 * Callback signature for emitting server-sent events during pipeline execution.
 * The orchestrator provides this to each stage so progress can be streamed to clients.
 */
export type EventEmitter = (event: SSEEvent) => void;

/**
 * StageContext — per-stage execution context injected by the orchestrator.
 * Carries the job identifier and the SSE emitter so stages can
 * report progress without coupling to transport details.
 */
export interface StageContext {
  /** Unique identifier for the current pipeline job. */
  jobId: string;

  /** Callback to emit SSE events to connected clients. */
  emitEvent: EventEmitter;
}
