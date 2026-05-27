/**
 * @module lib/gateway/cost-tracker
 * @description Tracks cumulative AI provider usage and costs across pipeline stages.
 * Collects ProviderUsageEntry records and provides aggregation methods
 * for per-stage and total cost/token analysis.
 */

import type { ProviderUsageEntry } from '@/types/appspec';
import type { AICompletionResponse } from '@/lib/gateway/types';
import { calculateCost } from '@/lib/gateway/config';

/**
 * CostTracker — accumulates AI provider usage entries across a pipeline run
 * and provides methods for querying stage-level and total costs.
 */
export class CostTracker {
  /** Internal storage for all usage entries. */
  private readonly entries: ProviderUsageEntry[] = [];

  /**
   * Record a usage entry from a completed AI completion response.
   *
   * @param stage - The pipeline stage name that made the call.
   * @param response - The AI completion response with usage data.
   */
  trackUsage(stage: string, response: AICompletionResponse): void {
    const costUsd = calculateCost(
      response.provider,
      response.model,
      response.usage.promptTokens,
      response.usage.completionTokens
    );

    this.entries.push({
      stage,
      provider: response.provider,
      model: response.model,
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      costUsd,
      latencyMs: response.latencyMs,
    });
  }

  /**
   * Get the total cost in USD for a specific pipeline stage.
   *
   * @param stage - The pipeline stage name to filter by.
   * @returns Total cost in USD for all calls in the given stage.
   */
  getStageCost(stage: string): number {
    return this.entries
      .filter((entry) => entry.stage === stage)
      .reduce((sum, entry) => sum + entry.costUsd, 0);
  }

  /**
   * Get the total cost in USD across all pipeline stages.
   *
   * @returns Total cumulative cost in USD.
   */
  getTotalCost(): number {
    return this.entries.reduce((sum, entry) => sum + entry.costUsd, 0);
  }

  /**
   * Get a breakdown of costs grouped by pipeline stage.
   *
   * @returns A record mapping stage names to their total costs in USD.
   */
  getBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const entry of this.entries) {
      breakdown[entry.stage] = (breakdown[entry.stage] ?? 0) + entry.costUsd;
    }

    return breakdown;
  }

  /**
   * Get all recorded usage entries.
   * Returns a shallow copy to prevent external mutation of internal state.
   *
   * @returns Array of all ProviderUsageEntry records.
   */
  getUsageEntries(): ProviderUsageEntry[] {
    return [...this.entries];
  }

  /**
   * Get the total number of tokens consumed across all stages.
   *
   * @returns Object with total prompt, completion, and combined token counts.
   */
  getTotalTokens(): { promptTokens: number; completionTokens: number; totalTokens: number } {
    let promptTokens = 0;
    let completionTokens = 0;

    for (const entry of this.entries) {
      promptTokens += entry.promptTokens;
      completionTokens += entry.completionTokens;
    }

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }

  /**
   * Reset all tracked entries. Useful for re-running a pipeline.
   */
  reset(): void {
    this.entries.length = 0;
  }
}
