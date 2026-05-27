'use client';

import { useMemo } from 'react';
import {
  ArrowRight,
  Brain,
  CircleDollarSign,
  Database,
  FileCode2,
  type LucideIcon,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { StageResult, StageStatus, StageName } from '@/types/pipeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StageProgressProps {
  /** Per-stage result list from the generation hook. */
  stages: StageResult[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Human-readable labels for each pipeline stage. */
const STAGE_LABELS: Record<StageName, string> = {
  intent_extraction: 'Intent Extraction',
  schema_generation: 'Schema Generation',
  appspec_generation: 'AppSpec Generation',
};

/** Stage index icons. */
const STAGE_ICONS: Record<StageName, LucideIcon> = {
  intent_extraction: Brain,
  schema_generation: Database,
  appspec_generation: FileCode2,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a StageStatus to a Badge variant. */
function stageVariant(
  s: StageStatus,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) {
    case 'completed':
      return 'success';
    case 'running':
      return 'info';
    case 'failed':
      return 'error';
    case 'skipped':
      return 'warning';
    case 'pending':
    default:
      return 'neutral';
  }
}

/** Format milliseconds. */
function fmtMs(ms: number): string {
  if (ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format cost. */
function fmtCost(usd: number): string {
  if (usd === 0) return '—';
  return `$${usd.toFixed(4)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * StageProgress — horizontal pipeline visualization showing three stages
 * connected by arrows with live status badges, latency, and cost.
 */
export function StageProgress({ stages }: StageProgressProps): React.JSX.Element {
  /** Map stages by name for easy lookup. */
  const stageMap = useMemo<Record<StageName, StageResult>>(() => {
    const map: Partial<Record<StageName, StageResult>> = {};
    for (const s of stages) {
      map[s.stage] = s;
    }
    // Ensure all stages exist with defaults
    const names: StageName[] = [
      'intent_extraction',
      'schema_generation',
      'appspec_generation',
    ];
    for (const n of names) {
      if (!map[n]) {
        map[n] = { stage: n, status: 'pending', latencyMs: 0, costUsd: 0 };
      }
    }
    return map as Record<StageName, StageResult>;
  }, [stages]);

  const orderedStages: StageName[] = [
    'intent_extraction',
    'schema_generation',
    'appspec_generation',
  ];

  return (
    <div className="rounded-lg border border-border bg-bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Pipeline Progress
      </h3>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
        {orderedStages.map((name, idx) => {
          const stage = stageMap[name];
          const isRunning = stage.status === 'running';
          const Icon = STAGE_ICONS[name];

          return (
            <div key={name} className="flex flex-1 items-start gap-0">
              {/* Stage card */}
              <div
                className={`flex-1 rounded-lg border px-4 py-3 ${
                  isRunning
                    ? 'animate-stage-pulse border-accent bg-accent/5'
                    : stage.status === 'completed'
                      ? 'border-success/30 bg-success/5'
                      : stage.status === 'failed'
                        ? 'border-error/30 bg-error/5'
                        : 'border-border bg-bg-secondary'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="text-xs font-semibold text-text-primary">
                    {STAGE_LABELS[name]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stageVariant(stage.status)}>
                    {stage.status}
                  </Badge>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                    {fmtMs(stage.latencyMs)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                    {fmtCost(stage.costUsd)}
                  </span>
                </div>
              </div>

              {/* Arrow connector */}
              {idx < orderedStages.length - 1 && (
                <div className="hidden items-center px-2 sm:flex sm:self-center">
                  <div className="h-px w-6 bg-border" />
                  <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  <div className="h-px w-6 bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
