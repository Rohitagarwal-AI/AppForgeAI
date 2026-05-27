'use client';

import { useCallback, useMemo } from 'react';
import { CircleDollarSign, RotateCcw, Send, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { JobStatus } from '@/types/pipeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptInputProps {
  /** Current prompt value. */
  prompt: string;
  /** Setter for the prompt value. */
  setPrompt: (value: string) => void;
  /** Whether generation is currently running. */
  isGenerating: boolean;
  /** Current job status. */
  status: JobStatus | null;
  /** Total latency in ms, if available. */
  latency: number | null;
  /** Total cost in USD, if available. */
  cost: number | null;
  /** Trigger generation. */
  onGenerate: () => void;
  /** Reset all state. */
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Example prompts
// ---------------------------------------------------------------------------

const EXAMPLE_PROMPTS: readonly string[] = [
  'Build a CRM for real estate company with WhatsApp notifications',
  'Inventory management system for a warehouse',
  'HR tool with leave management and attendance',
  'Task manager with team collaboration and Slack integration',
  'Ecommerce platform with Stripe payments',
  'Project tracker with Jira integration',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a JobStatus to a Badge variant. */
function statusVariant(
  s: JobStatus | null,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'info';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

/** Format milliseconds into a human-readable duration. */
function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Format USD cost. */
function formatCost(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PromptInput — hero input section with textarea, generate button,
 * example quick-fill prompts, and live status/cost/latency display.
 */
export function PromptInput({
  prompt,
  setPrompt,
  isGenerating,
  status,
  latency,
  cost,
  onGenerate,
  onReset,
}: PromptInputProps): React.JSX.Element {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      setPrompt(e.target.value);
    },
    [setPrompt],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating) {
        e.preventDefault();
        onGenerate();
      }
    },
    [isGenerating, onGenerate],
  );

  const fillPrompt = useCallback(
    (text: string) => (): void => {
      setPrompt(text);
    },
    [setPrompt],
  );

  const canGenerate = useMemo<boolean>(
    () => prompt.trim().length > 0 && !isGenerating,
    [prompt, isGenerating],
  );

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3">
        {status !== null && (
          <Badge variant={statusVariant(status)}>
            {status.toUpperCase()}
          </Badge>
        )}
        {latency !== null && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {formatLatency(latency)}
          </span>
        )}
        {cost !== null && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
            {formatCost(cost)}
          </span>
        )}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the application you want to build…"
          rows={4}
          disabled={isGenerating}
          className="w-full resize-none rounded-lg border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted disabled:opacity-50"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" aria-hidden="true" />
              Generate AppSpec
            </span>
          )}
        </button>

        {status !== null && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      {/* Example prompts */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Example prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((text) => (
            <button
              key={text}
              onClick={fillPrompt(text)}
              disabled={isGenerating}
              className="rounded-md border border-border bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary disabled:opacity-40"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
