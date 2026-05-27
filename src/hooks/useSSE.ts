'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SSEEvent } from '@/types/pipeline';

/** Maximum number of automatic reconnection attempts. */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Base delay in ms before reconnect (doubles each attempt). */
const BASE_RECONNECT_DELAY_MS = 1000;

const PIPELINE_EVENT_TYPES: readonly SSEEvent['type'][] = [
  'stage_start',
  'stage_complete',
  'stage_failed',
  'generation_complete',
];

/**
 * Return type for the useSSE hook.
 */
interface UseSSEResult {
  /** Accumulated SSE events received so far. */
  events: SSEEvent[];
  /** Whether the EventSource connection is currently open. */
  isConnected: boolean;
  /** The latest connection error, if any. */
  error: string | null;
}

/**
 * useSSE — subscribes to the server-sent event stream for a pipeline job.
 *
 * @param jobId - The job identifier to stream events for, or null to stay disconnected.
 * @returns An object containing accumulated events, connection status, and any error.
 */
export function useSSE(jobId: string | null): UseSSEResult {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectAttempts = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  /** Closes the current EventSource connection, if open. */
  const closeConnection = useCallback((): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!jobId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      queueMicrotask(() => {
        setIsConnected(false);
      });
      return;
    }

    /** Establishes the SSE connection with reconnection logic. */
    function connect(): void {
      const url = `/api/generate/${jobId}/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = (): void => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      es.onmessage = (messageEvent: MessageEvent<string>): void => {
        // The server uses named events; this fallback supports proxies that
        // strip the event name and deliver data on the default channel.
        handlePipelineMessage(messageEvent);
      };

      const handleNamedEvent = (event: Event): void => {
        handlePipelineMessage(event as MessageEvent<string>);
      };

      for (const eventName of PIPELINE_EVENT_TYPES) {
        es.addEventListener(eventName, handleNamedEvent);
      }

      function handlePipelineMessage(messageEvent: MessageEvent<string>): void {
        try {
          const parsed = JSON.parse(messageEvent.data) as Partial<SSEEvent>;
          if (!parsed.type || !PIPELINE_EVENT_TYPES.includes(parsed.type)) {
            return;
          }
          const event: SSEEvent = {
            type: parsed.type,
            stage: parsed.stage,
            data:
              typeof parsed.data === 'object' &&
              parsed.data !== null &&
              !Array.isArray(parsed.data)
                ? parsed.data
                : { ...parsed },
            timestamp:
              typeof parsed.timestamp === 'string'
                ? parsed.timestamp
                : new Date().toISOString(),
          };
          setEvents((prev) => [...prev, event]);

          // Close connection once generation is complete
          if (event.type === 'generation_complete') {
            es.close();
            eventSourceRef.current = null;
            setIsConnected(false);
          }
        } catch {
          // Silently ignore unparseable messages
        }
      }

      es.onerror = (): void => {
        es.close();
        eventSourceRef.current = null;
        setIsConnected(false);

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay =
            BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.current);
          reconnectAttempts.current += 1;
          setTimeout(connect, delay);
        } else {
          setError(
            'Lost connection to event stream. Please refresh or try again.',
          );
        }
      };
    }

    // Reset state on new job
    queueMicrotask(() => {
      setEvents([]);
      setError(null);
      reconnectAttempts.current = 0;
    });
    connect();

    return (): void => {
      closeConnection();
    };
  }, [jobId, closeConnection]);

  return { events, isConnected, error };
}
