/**
 * Structured logger for the AppForge AI pipeline.
 * Outputs JSON-formatted log entries for observability.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  stage?: string;
  jobId?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Current minimum log level (can be set via env) */
function getMinLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Creates a structured log entry and outputs it.
 */
function emit(entry: LogEntry): void {
  const minLevel = getMinLevel();
  if (LOG_LEVELS[entry.level] < LOG_LEVELS[minLevel]) {
    return;
  }

  const output = JSON.stringify(entry);

  switch (entry.level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Create a logger scoped to a specific context (e.g., jobId, stage).
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error?: Error | Record<string, unknown>): void;
  child(context: Partial<Pick<LogEntry, 'stage' | 'jobId' | 'provider' | 'model'>>): Logger;
}

/**
 * Creates a structured logger with optional contextual fields.
 */
export function createLogger(
  context: Partial<Pick<LogEntry, 'stage' | 'jobId' | 'provider' | 'model'>> = {}
): Logger {
  function makeEntry(level: LogLevel, message: string, extra?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...(extra ? { data: extra } : {}),
    };
  }

  return {
    debug(message: string, data?: Record<string, unknown>): void {
      emit(makeEntry('debug', message, data));
    },

    info(message: string, data?: Record<string, unknown>): void {
      emit(makeEntry('info', message, data));
    },

    warn(message: string, data?: Record<string, unknown>): void {
      emit(makeEntry('warn', message, data));
    },

    error(message: string, error?: Error | Record<string, unknown>): void {
      const entry = makeEntry('error', message);
      if (error instanceof Error) {
        entry.error = {
          code: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error) {
        entry.data = error;
      }
      emit(entry);
    },

    child(childContext: Partial<Pick<LogEntry, 'stage' | 'jobId' | 'provider' | 'model'>>): Logger {
      return createLogger({ ...context, ...childContext });
    },
  };
}

/** Global logger instance */
export const logger = createLogger();
