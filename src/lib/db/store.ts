/**
 * In-memory job store for the AppForge AI pipeline.
 * Provides a storage interface that can be swapped for PostgreSQL later.
 * 
 * Design: Interface-first so we can add a PostgreSQL implementation
 * behind the same interface without changing any consumer code.
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface StoredJob {
  id: string;
  prompt: string;
  status: JobStatus;
  appSpec: unknown | null;
  intent: unknown | null;
  dataSchema: unknown | null;
  repairLogs: unknown[];
  validationErrors: unknown[];
  totalLatencyMs: number | null;
  totalCostUsd: number | null;
  costBreakdown: Record<string, number>;
  stageLatencies: Record<string, number>;
  providerUsage: unknown[];
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface StageEvent {
  id: string;
  jobId: string;
  stage: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** Abstract storage interface for jobs and events */
export interface JobStore {
  createJob(id: string, prompt: string): Promise<StoredJob>;
  getJob(id: string): Promise<StoredJob | null>;
  updateJob(id: string, updates: Partial<StoredJob>): Promise<StoredJob | null>;
  addStageEvent(event: Omit<StageEvent, 'id' | 'createdAt'>): Promise<StageEvent>;
  getStageEvents(jobId: string): Promise<StageEvent[]>;
  listJobs(limit?: number): Promise<StoredJob[]>;
}

/**
 * In-memory implementation of JobStore.
 * Suitable for development and single-instance deployments.
 */
export class InMemoryJobStore implements JobStore {
  private jobs: Map<string, StoredJob> = new Map();
  private events: Map<string, StageEvent[]> = new Map();
  private eventCounter = 0;

  async createJob(id: string, prompt: string): Promise<StoredJob> {
    const job: StoredJob = {
      id,
      prompt,
      status: 'pending',
      appSpec: null,
      intent: null,
      dataSchema: null,
      repairLogs: [],
      validationErrors: [],
      totalLatencyMs: null,
      totalCostUsd: null,
      costBreakdown: {},
      stageLatencies: {},
      providerUsage: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
      error: null,
    };
    this.jobs.set(id, job);
    this.events.set(id, []);
    return { ...job };
  }

  async getJob(id: string): Promise<StoredJob | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async updateJob(id: string, updates: Partial<StoredJob>): Promise<StoredJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    const updated: StoredJob = { ...job, ...updates };
    this.jobs.set(id, updated);
    return { ...updated };
  }

  async addStageEvent(event: Omit<StageEvent, 'id' | 'createdAt'>): Promise<StageEvent> {
    this.eventCounter += 1;
    const stageEvent: StageEvent = {
      ...event,
      id: `evt_${this.eventCounter}`,
      createdAt: new Date().toISOString(),
    };

    const jobEvents = this.events.get(event.jobId);
    if (jobEvents) {
      jobEvents.push(stageEvent);
    } else {
      this.events.set(event.jobId, [stageEvent]);
    }

    return { ...stageEvent };
  }

  async getStageEvents(jobId: string): Promise<StageEvent[]> {
    const events = this.events.get(jobId);
    return events ? events.map((e) => ({ ...e })) : [];
  }

  async listJobs(limit = 50): Promise<StoredJob[]> {
    const allJobs = Array.from(this.jobs.values());
    // Sort by creation time descending
    allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allJobs.slice(0, limit).map((j) => ({ ...j }));
  }
}

/** Singleton store instance */
let storeInstance: JobStore | null = null;

/**
 * Get the global store instance.
 * Uses in-memory store by default. Can be replaced with PostgreSQL.
 */
export function getStore(): JobStore {
  if (!storeInstance) {
    storeInstance = new InMemoryJobStore();
  }
  return storeInstance;
}

/**
 * Set a custom store instance (e.g., PostgreSQL).
 */
export function setStore(store: JobStore): void {
  storeInstance = store;
}
