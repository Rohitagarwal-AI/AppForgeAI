'use client';

import { useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single tab definition. */
interface TabItem {
  /** Unique tab identifier. */
  id: string;
  /** Visible tab label. */
  label: string;
}

interface TabsProps {
  /** Available tabs. */
  tabs: TabItem[];
  /** Currently active tab id. */
  activeTab: string;
  /** Callback when a tab is selected. */
  onTabChange: (tabId: string) => void;
  /** Optional extra CSS classes for the wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Tabs — a horizontal tab switcher styled to match the dark dashboard theme.
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabsProps): React.JSX.Element {
  const handleClick = useCallback(
    (id: string) => (): void => {
      onTabChange(id);
    },
    [onTabChange],
  );

  return (
    <div
      className={`flex gap-2 overflow-x-auto border-b border-border ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={handleClick(tab.id)}
            className={`whitespace-nowrap px-4 py-2.5 pb-2 text-sm font-medium transition-colors rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
              isActive
                ? 'border-b-2 border-accent text-accent'
                : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
