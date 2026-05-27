/**
 * Metrics collection for pipeline observability.
 * Tracks latency, costs, and usage patterns per job.
 */

export interface StageMetric {
  stage: string;
  startTime: number;
  endTime?: number;
  latencyMs?: number;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  status: 'started' | 'completed' | 'failed';
  error?: string;
}

export interface JobMetrics {
  jobId: string;
  startTime: number;
  endTime?: number;
  totalLatencyMs?: number;
  totalCostUsd: number;
  stages: StageMetric[];
  repairCount: number;
  providerFailures: number;
  providerFallbacks: number;
}

/**
 * MetricsCollector accumulates metrics for a single pipeline job.
 */
export class MetricsCollector {
  private readonly metrics: JobMetrics;

  constructor(jobId: string) {
    this.metrics = {
      jobId,
      startTime: performance.now(),
      totalCostUsd: 0,
      stages: [],
      repairCount: 0,
      providerFailures: 0,
      providerFallbacks: 0,
    };
  }

  /** Record a stage starting */
  stageStart(stage: string): void {
    this.metrics.stages.push({
      stage,
      startTime: performance.now(),
      status: 'started',
    });
  }

  /** Record a stage completing successfully */
  stageComplete(
    stage: string,
    details: {
      provider?: string;
      model?: string;
      promptTokens?: number;
      completionTokens?: number;
      costUsd?: number;
    }
  ): void {
    const stageMetric = this.findStage(stage);
    if (stageMetric) {
      stageMetric.endTime = performance.now();
      stageMetric.latencyMs = Math.round(stageMetric.endTime - stageMetric.startTime);
      stageMetric.status = 'completed';
      stageMetric.provider = details.provider;
      stageMetric.model = details.model;
      stageMetric.promptTokens = details.promptTokens;
      stageMetric.completionTokens = details.completionTokens;
      stageMetric.costUsd = details.costUsd;
      if (details.costUsd) {
        this.metrics.totalCostUsd += details.costUsd;
      }
    }
  }

  /** Record a stage failure */
  stageFailed(stage: string, error: string): void {
    const stageMetric = this.findStage(stage);
    if (stageMetric) {
      stageMetric.endTime = performance.now();
      stageMetric.latencyMs = Math.round(stageMetric.endTime - stageMetric.startTime);
      stageMetric.status = 'failed';
      stageMetric.error = error;
    }
  }

  /** Record a repair attempt */
  recordRepair(): void {
    this.metrics.repairCount += 1;
  }

  /** Record a provider failure */
  recordProviderFailure(): void {
    this.metrics.providerFailures += 1;
  }

  /** Record a provider fallback */
  recordProviderFallback(): void {
    this.metrics.providerFallbacks += 1;
  }

  /** Finalize metrics (call when pipeline completes) */
  finalize(): JobMetrics {
    this.metrics.endTime = performance.now();
    this.metrics.totalLatencyMs = Math.round(this.metrics.endTime - this.metrics.startTime);
    return { ...this.metrics };
  }

  /** Get current snapshot of metrics */
  getSnapshot(): JobMetrics {
    return {
      ...this.metrics,
      totalLatencyMs: Math.round(performance.now() - this.metrics.startTime),
    };
  }

  /** Get stage latencies as a map */
  getStageLatencies(): Record<string, number> {
    const latencies: Record<string, number> = {};
    for (const stage of this.metrics.stages) {
      if (stage.latencyMs !== undefined) {
        latencies[stage.stage] = stage.latencyMs;
      }
    }
    return latencies;
  }

  /** Get cost breakdown by stage */
  getCostBreakdown(): Record<string, number> {
    const costs: Record<string, number> = {};
    for (const stage of this.metrics.stages) {
      if (stage.costUsd !== undefined) {
        costs[stage.stage] = stage.costUsd;
      }
    }
    return costs;
  }

  private findStage(stage: string): StageMetric | undefined {
    // Find the most recent instance of this stage (in case of retries)
    for (let i = this.metrics.stages.length - 1; i >= 0; i--) {
      if (this.metrics.stages[i].stage === stage) {
        return this.metrics.stages[i];
      }
    }
    return undefined;
  }
}
