'use client';

import { useState, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JsonViewerProps {
  /** The data to render as formatted JSON. */
  data: unknown;
  /** Whether to start with all nodes expanded. Defaults to true. */
  defaultExpanded?: boolean;
  /** Optional extra CSS classes. */
  className?: string;
}

interface JsonNodeProps {
  /** Property key label (undefined for root). */
  label?: string;
  /** The value to render. */
  value: unknown;
  /** Current depth for indentation. */
  depth: number;
  /** Whether this node starts expanded. */
  defaultExpanded: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type guard for plain objects. */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Determine the CSS class for a primitive JSON token. */
function tokenClass(v: unknown): string {
  if (typeof v === 'string') return 'json-string';
  if (typeof v === 'number') return 'json-number';
  if (typeof v === 'boolean') return 'json-boolean';
  if (v === null) return 'json-null';
  return '';
}

/** Render a primitive value as a string. */
function primitiveDisplay(v: unknown): string {
  if (typeof v === 'string') return `"${v}"`;
  if (v === null) return 'null';
  return String(v);
}

// ---------------------------------------------------------------------------
// JsonNode (recursive)
// ---------------------------------------------------------------------------

function JsonNode({
  label,
  value,
  depth,
  defaultExpanded,
}: JsonNodeProps): React.JSX.Element {
  const isObject = isPlainObject(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const [expanded, setExpanded] = useState<boolean>(
    defaultExpanded && depth < 3,
  );

  const toggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  const indent = depth * 16;

  // Primitive leaf
  if (!isExpandable) {
    return (
      <div className="flex" style={{ paddingLeft: indent }}>
        {label !== undefined && (
          <span className="json-key">&quot;{label}&quot;: </span>
        )}
        <span className={tokenClass(value)}>{primitiveDisplay(value)}</span>
      </div>
    );
  }

  // Expandable node
  const entries = isArray
    ? (value as unknown[]).map((v, i) => ({ key: String(i), val: v }))
    : Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        key: k,
        val: v,
      }));

  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';
  const summary = isArray
    ? `${(value as unknown[]).length} items`
    : `${Object.keys(value as Record<string, unknown>).length} keys`;

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-text-secondary transition-colors hover:bg-bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        style={{ paddingLeft: indent }}
      >
        <span className="text-text-muted select-none text-xs">
          {expanded ? '▼' : '▶'}
        </span>
        {label !== undefined && (
          <span className="json-key">&quot;{label}&quot;: </span>
        )}
        <span className="text-text-muted">
          {bracketOpen} {!expanded && `… ${summary} ${bracketClose}`}
        </span>
      </button>
      {expanded && (
        <>
          {entries.map((entry) => (
            <JsonNode
              key={entry.key}
              label={isArray ? undefined : entry.key}
              value={entry.val}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
          <div style={{ paddingLeft: indent }} className="text-text-muted">
            {bracketClose}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JsonViewer
// ---------------------------------------------------------------------------

/**
 * JsonViewer — renders formatted, syntax-highlighted, collapsible JSON
 * with a copy-to-clipboard button.
 */
export function JsonViewer({
  data,
  defaultExpanded = true,
  className = '',
}: JsonViewerProps): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);

  const jsonString = useMemo<string>(
    () => JSON.stringify(data, null, 2),
    [data],
  );

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }, [jsonString]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-bg-secondary p-4 font-mono text-xs leading-relaxed shadow-card ${className}`}
    >
      <button
        onClick={() => void handleCopy()}
        className="absolute right-3 top-3 rounded-md border border-border bg-bg-card px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Copy JSON to clipboard"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>

      <JsonNode
        value={data}
        depth={0}
        defaultExpanded={defaultExpanded}
      />
    </div>
  );
}
