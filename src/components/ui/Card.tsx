'use client';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CardProps {
  /** Card body content. */
  children: ReactNode;
  /** Optional extra CSS classes. */
  className?: string;
  /** Optional card title rendered in the header. */
  title?: string;
  /** Optional trailing element rendered beside the title. */
  headerRight?: ReactNode;
  /** Whether to apply hover elevation. Defaults to false. */
  hoverable?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Card — a dark-themed container with consistent border, padding, and
 * optional header. Used throughout the dashboard for grouping content.
 */
export function Card({
  children,
  className = '',
  title,
  headerRight,
  hoverable = false,
}: CardProps): React.JSX.Element {
  return (
    <div
      className={`group rounded-lg border border-border bg-bg-card transition-shadow ${
        hoverable ? 'hover:shadow-lg hover:scale-[1.01] focus-within:shadow-lg' : ''
      } ${className}`}
      tabIndex={-1}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
