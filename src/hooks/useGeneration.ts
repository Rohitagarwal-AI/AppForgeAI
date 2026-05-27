'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { AppSpec } from '@/types/appspec';
import type {
  JobStatus,
  StageResult,
  ValidationError,
  RepairLog,
  SSEEvent,
  StageName,
} from '@/types/pipeline';
import { useSSE } from '@/hooks/useSSE';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Public API returned by the useGeneration hook. */
export interface UseGenerationResult {
  /** Current prompt text. */
  prompt: string;
  /** Setter for the prompt text. */
  setPrompt: (value: string) => void;
  /** Active job identifier, or null if no job is running. */
  jobId: string | null;
  /** Current top-level job status. */
  status: JobStatus | null;
  /** Per-stage result tracking. */
  stages: StageResult[];
  /** Final generated AppSpec, if available. */
  appSpec: AppSpec | null;
  /** Aggregated validation errors. */
  errors: ValidationError[];
  /** Aggregated repair logs. */
  repairLogs: RepairLog[];
  /** Total pipeline latency in milliseconds. */
  latency: number | null;
  /** Total pipeline cost in USD. */
  cost: number | null;
  /** Whether generation is currently in progress. */
  isGenerating: boolean;
  /** SSE connection error, if any. */
  connectionError: string | null;
  /** Kick off a new generation run. */
  generate: () => void;
  /** Reset all state to initial values. */
  reset: () => void;
}

/** Shape of the POST /api/generate response body. */
interface GenerateResponse {
  jobId: string;
}

/** Shape of the GET /api/generate/{jobId} response body. */
interface JobResultResponse {
  jobId: string;
  status: JobStatus;
  stages: StageResult[];
  appSpec?: AppSpec;
  totalLatencyMs: number;
  totalCostUsd: number;
  repairLogs: RepairLog[];
  validationErrors: ValidationError[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_NAMES: StageName[] = [
  'intent_extraction',
  'schema_generation',
  'appspec_generation',
];

/** Build the initial stage result list with all stages pending. */
function initialStages(): StageResult[] {
  return STAGE_NAMES.map((name) => ({
    stage: name,
    status: 'pending' as const,
    latencyMs: 0,
    costUsd: 0,
  }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useGeneration — master hook that drives the entire generation dashboard.
 *
 * 1. On `generate()` — POSTs the prompt and receives a jobId.
 * 2. SSE events stream in via `useSSE` and update stage states.
 * 3. On `generation_complete` — fetches the full result via GET.
 */
export function useGeneration(): UseGenerationResult {
  const [prompt, setPrompt] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [stages, setStages] = useState<StageResult[]>(initialStages());
  const [appSpec, setAppSpec] = useState<AppSpec | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);

  const { events, error: connectionError } = useSSE(jobId);

  // -----------------------------------------------------------------------
  // Derive isGenerating
  // -----------------------------------------------------------------------

  const isGenerating = useMemo<boolean>(
    () => status === 'pending' || status === 'processing',
    [status],
  );

  // -----------------------------------------------------------------------
  // Process SSE events
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (events.length === 0) return;

    const latestEvent: SSEEvent = events[events.length - 1];

    queueMicrotask(() => {
      switch (latestEvent.type) {
        case 'stage_start': {
          const stageName = latestEvent.stage;
          if (!stageName) break;
          setStatus('processing');
          setStages((prev) =>
            prev.map((s) =>
              s.stage === stageName ? { ...s, status: 'running' } : s,
            ),
          );
          break;
        }

        case 'stage_complete': {
          const stageName = latestEvent.stage;
          if (!stageName) break;
          const data = latestEvent.data as {
            latencyMs?: number;
            costUsd?: number;
          };
          setStages((prev) =>
            prev.map((s) =>
              s.stage === stageName
                ? {
                    ...s,
                    status: 'completed',
                    latencyMs: data.latencyMs ?? s.latencyMs,
                    costUsd: data.costUsd ?? s.costUsd,
                  }
                : s,
            ),
          );
          break;
        }

        case 'stage_failed': {
          const stageName = latestEvent.stage;
          if (!stageName) break;
          const data = latestEvent.data as { message?: string };
          setStages((prev) =>
            prev.map((s) =>
              s.stage === stageName
                ? {
                    ...s,
                    status: 'failed',
                    errors: [
                      {
                        code: 'STAGE_FAILED',
                        stage: stageName,
                        path: '',
                        message: data.message ?? 'Stage execution failed',
                        severity: 'critical' as const,
                      },
                    ],
                  }
                : s,
            ),
          );
          setStatus('failed');
          break;
        }

        case 'generation_complete': {
          setStatus('completed');
          break;
        }
      }
    });
  }, [events]);

  // -----------------------------------------------------------------------
  // Fetch full result when generation completes
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (status !== 'completed' || !jobId) return;

    let cancelled = false;

    async function fetchResult(): Promise<void> {
      try {
        const res = await fetch(`/api/generate/${jobId}`);
        if (!res.ok) return;
        const data: JobResultResponse =
          (await res.json()) as JobResultResponse;
        if (cancelled) return;

        setStages(data.stages);
        setAppSpec(data.appSpec ?? null);
        setErrors(data.validationErrors);
        setRepairLogs(data.repairLogs);
        setLatency(data.totalLatencyMs);
        setCost(data.totalCostUsd);
      } catch {
        // network error — state already shows completed via SSE
      }
    }

    void fetchResult();

    return (): void => {
      cancelled = true;
    };
  }, [status, jobId]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  /** Submit the current prompt and begin pipeline execution. */
  const generate = useCallback(async (): Promise<void> => {
    if (!prompt.trim()) return;

    // Reset state for new run
    setJobId(null);
    setStatus('pending');
    setStages(initialStages());
    setAppSpec(null);
    setErrors([]);
    setRepairLogs([]);
    setLatency(null);
    setCost(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        setStatus('failed');
        return;
      }

      const data: GenerateResponse =
        (await res.json()) as GenerateResponse;
      setJobId(data.jobId);
      setStatus('processing');
    } catch {
      setStatus('failed');
    }
  }, [prompt]);

  /** Reset all generation state to initial values. */
  const reset = useCallback((): void => {
    setPrompt('');
    setJobId(null);
    setStatus(null);
    setStages(initialStages());
    setAppSpec(null);
    setErrors([]);
    setRepairLogs([]);
    setLatency(null);
    setCost(null);
  }, []);

  return {
    prompt,
    setPrompt,
    jobId,
    status,
    stages,
    appSpec,
    errors,
    repairLogs,
    latency,
    cost,
    isGenerating,
    connectionError,
    generate: (): void => void generate(),
    reset,
  };
}
