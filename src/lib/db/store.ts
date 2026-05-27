/**
 * In-memory job store for the AppForge AI pipeline.
 * Provides a storage interface that can be swapped for PostgreSQL later.
 * 
 * Design: Interface-first so we can add a PostgreSQL implementation
 * behind the same interface without changing any consumer code.
 */

import { Pool } from 'pg';

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

interface JobRow {
  id: string;
  prompt: string;
  status: JobStatus;
  app_spec: unknown | null;
  intent: unknown | null;
  data_schema: unknown | null;
  repair_logs: unknown[];
  validation_errors: unknown[];
  total_latency_ms: number | null;
  total_cost_usd: string | number | null;
  cost_breakdown: Record<string, number>;
  stage_latencies: Record<string, number>;
  provider_usage: unknown[];
  created_at: Date | string;
  completed_at: Date | string | null;
  error: string | null;
}

interface EventRow {
  id: string;
  job_id: string;
  stage: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: Date | string;
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapJob(row: JobRow): StoredJob {
  return {
    id: row.id,
    prompt: row.prompt,
    status: row.status,
    appSpec: row.app_spec,
    intent: row.intent,
    dataSchema: row.data_schema,
    repairLogs: row.repair_logs ?? [],
    validationErrors: row.validation_errors ?? [],
    totalLatencyMs: row.total_latency_ms,
    totalCostUsd:
      row.total_cost_usd === null ? null : Number(row.total_cost_usd),
    costBreakdown: row.cost_breakdown ?? {},
    stageLatencies: row.stage_latencies ?? {},
    providerUsage: row.provider_usage ?? [],
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    completedAt: toIso(row.completed_at),
    error: row.error,
  };
}

function mapEvent(row: EventRow): StageEvent {
  return {
    id: row.id,
    jobId: row.job_id,
    stage: row.stage,
    eventType: row.event_type,
    payload: row.payload,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

export class PostgresJobStore implements JobStore {
  private readonly pool: Pool;
  private initPromise: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
    });
  }

  async createJob(id: string, prompt: string): Promise<StoredJob> {
    await this.ensureSchema();
    const result = await this.pool.query<JobRow>(
      `insert into appforge_jobs (
        id, prompt, status, app_spec, intent, data_schema, repair_logs,
        validation_errors, total_latency_ms, total_cost_usd, cost_breakdown,
        stage_latencies, provider_usage, created_at, completed_at, error
      ) values (
        $1, $2, 'pending', null, null, null, '[]'::jsonb,
        '[]'::jsonb, null, null, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb,
        now(), null, null
      )
      returning *`,
      [id, prompt],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create job');
    }
    return mapJob(row);
  }

  async getJob(id: string): Promise<StoredJob | null> {
    await this.ensureSchema();
    const result = await this.pool.query<JobRow>(
      'select * from appforge_jobs where id = $1',
      [id],
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  }

  async updateJob(id: string, updates: Partial<StoredJob>): Promise<StoredJob | null> {
    await this.ensureSchema();
    const existing = await this.getJob(id);
    if (!existing) {
      return null;
    }

    const merged: StoredJob = { ...existing, ...updates };
    const result = await this.pool.query<JobRow>(
      `update appforge_jobs set
        prompt = $2,
        status = $3,
        app_spec = $4,
        intent = $5,
        data_schema = $6,
        repair_logs = $7,
        validation_errors = $8,
        total_latency_ms = $9,
        total_cost_usd = $10,
        cost_breakdown = $11,
        stage_latencies = $12,
        provider_usage = $13,
        completed_at = $14,
        error = $15
      where id = $1
      returning *`,
      [
        id,
        merged.prompt,
        merged.status,
        JSON.stringify(merged.appSpec),
        JSON.stringify(merged.intent),
        JSON.stringify(merged.dataSchema),
        JSON.stringify(merged.repairLogs),
        JSON.stringify(merged.validationErrors),
        merged.totalLatencyMs,
        merged.totalCostUsd,
        JSON.stringify(merged.costBreakdown),
        JSON.stringify(merged.stageLatencies),
        JSON.stringify(merged.providerUsage),
        merged.completedAt,
        merged.error,
      ],
    );

    return result.rows[0] ? mapJob(result.rows[0]) : null;
  }

  async addStageEvent(event: Omit<StageEvent, 'id' | 'createdAt'>): Promise<StageEvent> {
    await this.ensureSchema();
    const result = await this.pool.query<EventRow>(
      `insert into appforge_stage_events (
        job_id, stage, event_type, payload, created_at
      ) values ($1, $2, $3, $4, now())
      returning *`,
      [
        event.jobId,
        event.stage,
        event.eventType,
        JSON.stringify(event.payload),
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create stage event');
    }
    return mapEvent(row);
  }

  async getStageEvents(jobId: string): Promise<StageEvent[]> {
    await this.ensureSchema();
    const result = await this.pool.query<EventRow>(
      'select * from appforge_stage_events where job_id = $1 order by created_at asc, id asc',
      [jobId],
    );
    return result.rows.map(mapEvent);
  }

  async listJobs(limit = 50): Promise<StoredJob[]> {
    await this.ensureSchema();
    const result = await this.pool.query<JobRow>(
      'select * from appforge_jobs order by created_at desc limit $1',
      [limit],
    );
    return result.rows.map(mapJob);
  }

  private async ensureSchema(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.createSchema();
    }
    await this.initPromise;
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      create table if not exists appforge_jobs (
        id text primary key,
        prompt text not null,
        status text not null,
        app_spec jsonb,
        intent jsonb,
        data_schema jsonb,
        repair_logs jsonb not null default '[]'::jsonb,
        validation_errors jsonb not null default '[]'::jsonb,
        total_latency_ms integer,
        total_cost_usd numeric,
        cost_breakdown jsonb not null default '{}'::jsonb,
        stage_latencies jsonb not null default '{}'::jsonb,
        provider_usage jsonb not null default '[]'::jsonb,
        created_at timestamptz not null default now(),
        completed_at timestamptz,
        error text
      );
    `);

    await this.pool.query(`
      create table if not exists appforge_stage_events (
        id bigserial primary key,
        job_id text not null references appforge_jobs(id) on delete cascade,
        stage text not null,
        event_type text not null,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
    `);

    await this.pool.query(`
      create index if not exists appforge_stage_events_job_idx
      on appforge_stage_events(job_id, created_at, id);
    `);
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
    storeInstance = process.env.DATABASE_URL
      ? new PostgresJobStore(process.env.DATABASE_URL)
      : new InMemoryJobStore();
  }
  return storeInstance;
}

/**
 * Set a custom store instance (e.g., PostgreSQL).
 */
export function setStore(store: JobStore): void {
  storeInstance = store;
}
