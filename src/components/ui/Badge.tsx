'use client';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual variant controlling badge color. */
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  /** Color variant of the badge. */
  variant: BadgeVariant;
  /** Badge label content. */
  children: ReactNode;
  /** Optional extra CSS classes. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Variant → Tailwind class mapping
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error:   'bg-error/15 text-error border-error/30',
  info:    'bg-info/15 text-info border-info/30',
  neutral: 'bg-text-muted/15 text-text-secondary border-text-muted/30',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Badge — a small colored pill used for statuses, labels, and tags.
 */
export function Badge({ variant, children, className = '' }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-0.5 text-xs font-semibold leading-none ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
