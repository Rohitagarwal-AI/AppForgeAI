/**
 * @module api/generate/[jobId]/stream
 * @description GET /api/generate/:jobId/stream — Server-Sent Events (SSE)
 * endpoint that streams pipeline progress events in real time.
 *
 * Features:
 * - Replays all past events on reconnection
 * - Polls for new events every 500ms while the job is active
 * - Gracefully handles client disconnection via AbortSignal
 * - Sends heartbeat comments to keep the connection alive
 */

import { NextRequest } from 'next/server';
import { getStore } from '@/lib/db/store';
import type { StageEvent } from '@/lib/db/store';
import { createLogger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';

/** Polling interval in milliseconds for checking new events. */
const POLL_INTERVAL_MS = 500;

/** Maximum time to keep a stream open (5 minutes). */
const MAX_STREAM_DURATION_MS = 5 * 60 * 1000;

/** Heartbeat interval to keep the connection alive (15 seconds). */
const HEARTBEAT_INTERVAL_MS = 15_000;

/** Terminal job statuses that signal stream end. */
const TERMINAL_STATUSES = new Set(['completed', 'failed']);

/**
 * Encodes an SSE event string.
 */
function formatSSEEvent(
  encoder: TextEncoder,
  eventName: string,
  data: Record<string, unknown>,
): Uint8Array {
  return encoder.encode(
    `event: ${eventName}\ndata: ${JSON.stringify({ type: eventName, ...data })}\n\n`,
  );
}

/**
 * Encodes an SSE comment (heartbeat).
 */
function formatSSEComment(encoder: TextEncoder): Uint8Array {
  return encoder.encode(': heartbeat\n\n');
}

/**
 * Maps a StageEvent from the store to the SSE event name.
 */
function stageEventToSSEName(event: StageEvent): string {
  return event.eventType;
}

/**
 * Sleeps for the given duration, returning early if the abort signal fires.
 * @returns true if aborted, false if sleep completed normally.
 */
function abortableSleep(
  ms: number,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(false);
    }, ms);

    function onAbort(): void {
      clearTimeout(timer);
      resolve(true);
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * GET /api/generate/:jobId/stream
 *
 * Opens an SSE connection that streams pipeline events for the given job.
 * Supports reconnection by replaying all past events before switching to
 * live polling.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  const { jobId } = await params;
  const store = getStore();
  const encoder = new TextEncoder();
  const streamLogger = createLogger({ jobId, stage: 'sse:stream' });

  const stream = new ReadableStream({
    async start(controller) {
      /**
       * Safely enqueue data to the controller, handling closed-stream errors.
       * @returns true if enqueue succeeded, false if the stream is closed.
       */
      function safeEnqueue(chunk: Uint8Array): boolean {
        try {
          controller.enqueue(chunk);
          return true;
        } catch {
          return false;
        }
      }

      /**
       * Sends an SSE event through the stream.
       * @returns true if sent successfully, false if the stream is closed.
       */
      function send(event: string, data: Record<string, unknown>): boolean {
        return safeEnqueue(formatSSEEvent(encoder, event, data));
      }

      // ---------------------------------------------------------------
      // 1. Verify the job exists
      // ---------------------------------------------------------------
      const job = await store.getJob(jobId);
      if (!job) {
        streamLogger.warn('Job not found for streaming', { jobId });
        send('error', {
          error: `Job "${jobId}" not found`,
          code: 'JOB_NOT_FOUND',
        });
        controller.close();
        return;
      }

      streamLogger.info('SSE stream opened', { jobId, jobStatus: job.status });

      // Send a connected event
      send('connected', {
        jobId,
        status: job.status,
        timestamp: new Date().toISOString(),
      });

      // ---------------------------------------------------------------
      // 2. Replay all past events
      // ---------------------------------------------------------------
      const pastEvents = await store.getStageEvents(jobId);
      let lastSeenEventIndex = pastEvents.length;

      for (const event of pastEvents) {
        if (request.signal.aborted) {
          streamLogger.debug('Client disconnected during replay');
          controller.close();
          return;
        }

        send(stageEventToSSEName(event), {
          stage: event.stage,
          ...event.payload,
          eventId: event.id,
          createdAt: event.createdAt,
        });
      }

      streamLogger.debug('Replayed past events', { count: pastEvents.length });

      // ---------------------------------------------------------------
      // 3. If the job is already terminal, close the stream
      // ---------------------------------------------------------------
      if (TERMINAL_STATUSES.has(job.status)) {
        send('job_complete', {
          jobId,
          status: job.status,
          completedAt: job.completedAt,
          timestamp: new Date().toISOString(),
        });
        controller.close();
        streamLogger.info('Job already terminal; stream closed after replay', {
          status: job.status,
        });
        return;
      }

      // ---------------------------------------------------------------
      // 4. Poll for new events while the job is active
      // ---------------------------------------------------------------
      const streamStartTime = Date.now();
      let lastHeartbeat = Date.now();

      while (!request.signal.aborted) {
        // Check max stream duration
        if (Date.now() - streamStartTime > MAX_STREAM_DURATION_MS) {
          streamLogger.warn('Max stream duration exceeded', { jobId });
          send('error', {
            error: 'Stream duration limit exceeded',
            code: 'STREAM_TIMEOUT',
          });
          break;
        }

        // Fetch current events
        const currentEvents = await store.getStageEvents(jobId);

        // Send any new events since last check
        if (currentEvents.length > lastSeenEventIndex) {
          const newEvents = currentEvents.slice(lastSeenEventIndex);
          for (const event of newEvents) {
            const sent = send(stageEventToSSEName(event), {
              stage: event.stage,
              ...event.payload,
              eventId: event.id,
              createdAt: event.createdAt,
            });
            if (!sent) {
              // Stream was closed
              streamLogger.debug('Stream closed during event emission');
              return;
            }
          }
          lastSeenEventIndex = currentEvents.length;
        }

        // Check if the job has reached a terminal status
        const currentJob = await store.getJob(jobId);
        if (currentJob && TERMINAL_STATUSES.has(currentJob.status)) {
          send('job_complete', {
            jobId,
            status: currentJob.status,
            completedAt: currentJob.completedAt,
            timestamp: new Date().toISOString(),
          });
          streamLogger.info('Job reached terminal status; closing stream', {
            status: currentJob.status,
          });
          break;
        }

        // Send heartbeat if enough time has elapsed
        if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
          safeEnqueue(formatSSEComment(encoder));
          lastHeartbeat = Date.now();
        }

        // Wait before next poll, respecting abort signal
        const aborted = await abortableSleep(POLL_INTERVAL_MS, request.signal);
        if (aborted) {
          streamLogger.debug('Client disconnected during poll wait');
          break;
        }
      }

      // ---------------------------------------------------------------
      // 5. Clean up
      // ---------------------------------------------------------------
      try {
        controller.close();
      } catch {
        // Controller may already be closed
      }

      streamLogger.info('SSE stream closed', { jobId });
    },
  });

  // Handle client disconnect by listening to the abort signal
  // (already handled inside the stream's start() method)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
