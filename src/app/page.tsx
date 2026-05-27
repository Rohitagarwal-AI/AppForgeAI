'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileCode2,
  GitBranch,
  PlugZap,
  ShieldCheck,
  Timer,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { PromptInput } from '@/components/dashboard/PromptInput';
import { StageProgress } from '@/components/dashboard/StageProgress';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import type { AppSpec } from '@/types/appspec';
import type { IntegrationDefinition } from '@/types/integration';
import type { RepairLog, ValidationError } from '@/types/pipeline';
import { useGeneration } from '@/hooks/useGeneration';

type AppSpecTab = 'overview' | 'schema' | 'pages' | 'api' | 'workflows';
type AssistantTopic =
  | 'appspec'
  | 'validation'
  | 'repair'
  | 'entities'
  | 'apis'
  | 'integrations';

interface IntegrationsResponse {
  integrations: IntegrationDefinition[];
}

const APPSPEC_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'schema', label: 'Schema' },
  { id: 'pages', label: 'Pages' },
  { id: 'api', label: 'API' },
  { id: 'workflows', label: 'Workflows' },
];

const ASSISTANT_TOPICS: Array<{ id: AssistantTopic; label: string }> = [
  { id: 'appspec', label: 'AppSpec' },
  { id: 'validation', label: 'Validation' },
  { id: 'repair', label: 'Repair' },
  { id: 'entities', label: 'Entities' },
  { id: 'apis', label: 'APIs' },
  { id: 'integrations', label: 'Integrations' },
];

function formatLatency(ms: number | null): string {
  if (ms === null) return 'Pending';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(cost: number | null): string {
  if (cost === null) return '$0.0000';
  return `$${cost.toFixed(4)}`;
}

function severityVariant(
  severity: ValidationError['severity'],
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (severity === 'critical') return 'error';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-border bg-bg-secondary px-4 py-8 text-center text-sm text-text-muted">
      {text}
    </div>
  );
}

function AppSpecViewer({ appSpec }: { appSpec: AppSpec | null }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppSpecTab>('overview');

  if (!appSpec) {
    return (
      <Card title="AppSpec Viewer">
        <EmptyPanel text="Generated AppSpec sections will appear here." />
      </Card>
    );
  }

  const endpointEntities = new Set(appSpec.apiEndpoints.map((endpoint) => endpoint.boundEntity));

  return (
    <Card
      title="AppSpec Viewer"
      headerRight={<Badge variant="success">Validated</Badge>}
      className="overflow-hidden"
    >
      <Tabs
        tabs={APPSPEC_TABS}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as AppSpecTab)}
        className="-mx-5 -mt-5 mb-5 px-1"
      />

      {activeTab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricPill icon={FileCode2} label="Application" value={appSpec.appName} />
          <MetricPill icon={Database} label="Entities" value={String(appSpec.dataSchema.entities.length)} />
          <MetricPill icon={GitBranch} label="Workflows" value={String(appSpec.workflowStubs.length)} />
          <MetricPill icon={PlugZap} label="Integrations" value={String(appSpec.integrationHooks.length)} />
          <div className="md:col-span-2 xl:col-span-4">
            <div className="rounded-lg border border-border bg-bg-secondary p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Provider Usage
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                {appSpec.metadata.providerUsage.map((usage, index) => (
                  <div key={`${usage.stage}-${index}`} className="rounded-md border border-border bg-bg-primary p-3">
                    <p className="text-sm font-semibold text-text-primary">{usage.stage}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {usage.provider} / {usage.model}
                    </p>
                    <p className="mt-2 text-xs text-text-secondary">
                      {usage.latencyMs}ms · ${usage.costUsd.toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {appSpec.dataSchema.entities.map((entity) => (
            <div key={entity.name} className="rounded-lg border border-border bg-bg-secondary p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{entity.name}</p>
                  <p className="text-xs text-text-muted">{entity.tableName}</p>
                </div>
                <Badge variant={entity.tenantId ? 'success' : 'error'}>tenant</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {entity.fields.slice(0, 10).map((field) => (
                  <span
                    key={field.name}
                    className="rounded-md border border-border bg-bg-primary px-2 py-1 text-xs text-text-secondary"
                  >
                    {field.name}: {field.type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {appSpec.pages.map((page) => (
            <div key={`${page.name}-${page.route}`} className="rounded-lg border border-border bg-bg-secondary p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{page.name}</p>
                  <p className="text-xs text-text-muted">{page.route}</p>
                </div>
                <Badge variant={page.boundEntity && endpointEntities.has(page.boundEntity) ? 'success' : 'neutral'}>
                  {page.layout}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-text-secondary">
                {page.components.length} components
                {page.boundEntity ? ` · ${page.boundEntity}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'api' && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[80px_1fr_120px_90px] bg-bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <span>Method</span>
            <span>Path</span>
            <span>Entity</span>
            <span>Auth</span>
          </div>
          {appSpec.apiEndpoints.map((endpoint) => (
            <div
              key={`${endpoint.method}-${endpoint.path}`}
              className="grid grid-cols-[80px_1fr_120px_90px] border-t border-border px-3 py-2 text-sm"
            >
              <span className="font-semibold text-accent">{endpoint.method}</span>
              <span className="truncate text-text-primary">{endpoint.path}</span>
              <span className="truncate text-text-secondary">{endpoint.boundEntity}</span>
              <span className="text-text-muted">{endpoint.authRequired ? 'yes' : 'no'}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {appSpec.workflowStubs.length === 0 && (
            <EmptyPanel text="No workflow stubs were required for this prompt." />
          )}
          {appSpec.workflowStubs.map((workflow) => (
            <div key={workflow.id} className="rounded-lg border border-border bg-bg-secondary p-4">
              <p className="font-semibold text-text-primary">{workflow.name}</p>
              <p className="mt-1 text-sm text-text-secondary">{workflow.description}</p>
              <p className="mt-3 text-xs text-text-muted">
                {workflow.trigger.entity}.{workflow.trigger.event} · {workflow.actions.length} actions
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ValidationPanel({ errors }: { errors: ValidationError[] }): React.JSX.Element {
  return (
    <Card
      title="Validation Error Panel"
      headerRight={
        <Badge variant={errors.length === 0 ? 'success' : 'warning'}>
          {errors.length === 0 ? 'clear' : `${errors.length} items`}
        </Badge>
      }
    >
      {errors.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-text-secondary">
          <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
          No active validation issues.
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((error, index) => (
            <div key={`${error.code}-${index}`} className="rounded-lg border border-border bg-bg-secondary p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={severityVariant(error.severity)}>{error.severity}</Badge>
                <span className="text-xs font-semibold text-text-muted">{error.code}</span>
              </div>
              <p className="text-sm text-text-primary">{error.message}</p>
              <p className="mt-2 text-xs text-text-muted">{error.stage} · {error.path || 'root'}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RepairPanel({ logs }: { logs: RepairLog[] }): React.JSX.Element {
  return (
    <Card
      title="Repair Strategy Panel"
      headerRight={<Badge variant={logs.length > 0 ? 'info' : 'neutral'}>{logs.length} logs</Badge>}
    >
      {logs.length === 0 ? (
        <EmptyPanel text="Repair attempts will be listed after validation finds fixable issues." />
      ) : (
        <div className="space-y-3">
          {logs.slice(-8).map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="rounded-lg border border-border bg-bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="text-sm font-semibold text-text-primary">{log.strategy}</span>
                </div>
                <Badge variant={log.outcome === 'repaired' ? 'success' : log.outcome === 'failed' ? 'error' : 'warning'}>
                  {log.outcome}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">{log.inputError.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function IntegrationPanel({
  integrations,
}: {
  integrations: IntegrationDefinition[];
}): React.JSX.Element {
  return (
    <Card
      title="Integration Registry Panel"
      headerRight={<Badge variant="info">{integrations.length} available</Badge>}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {integrations.map((integration) => (
          <div key={integration.id} className="rounded-lg border border-border bg-bg-secondary p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="font-semibold text-text-primary">{integration.displayName}</p>
              <Badge variant="neutral">{integration.authType}</Badge>
            </div>
            <p className="line-clamp-2 text-sm text-text-secondary">{integration.description}</p>
            <p className="mt-3 text-xs text-text-muted">
              {integration.triggers.length} triggers · {integration.actions.length} actions
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function assistantAnswer(
  topic: AssistantTopic,
  appSpec: AppSpec | null,
  errors: ValidationError[],
  logs: RepairLog[],
): string {
  if (!appSpec && topic !== 'validation' && topic !== 'repair') {
    return 'Run the pipeline to generate an AppSpec, then this panel will summarize the selected area.';
  }

  switch (topic) {
    case 'validation':
      return errors.length === 0
        ? 'Validation is currently clean. The engine checks Zod contracts, schema consistency, page/API mappings, auth roles, integration IDs, and workflow entity references.'
        : `There are ${errors.length} validation items. Critical items block a stage; warnings are repairable or reviewable quality signals.`;
    case 'repair':
      return logs.length === 0
        ? 'Repair has not been needed yet. When validation fails, structural repair runs first, then field repair, then cross-reference consistency repair.'
        : `The repair engine recorded ${logs.length} attempts. The latest strategy was ${logs[logs.length - 1]?.strategy}.`;
    case 'entities':
      return appSpec
        ? `The schema contains ${appSpec.dataSchema.entities.length} tenant-scoped entities. Every generated CRUD page and API endpoint references these entity names.`
        : '';
    case 'apis':
      return appSpec
        ? `The AppSpec defines ${appSpec.apiEndpoints.length} REST endpoints. Page bindings are validated against endpoint entity coverage.`
        : '';
    case 'integrations':
      return appSpec
        ? `The AppSpec includes ${appSpec.integrationHooks.length} integration hooks and ${appSpec.workflowStubs.length} workflow stubs. Hook IDs, actions, and triggers are checked against the registry.`
        : '';
    case 'appspec':
    default:
      return appSpec
        ? `${appSpec.appName} is a ${appSpec.appType} specification with ${appSpec.pages.length} pages, ${appSpec.apiEndpoints.length} APIs, and ${appSpec.authRules.roles.length} roles.`
        : '';
  }
}

function AssistantPanel({
  appSpec,
  errors,
  logs,
}: {
  appSpec: AppSpec | null;
  errors: ValidationError[];
  logs: RepairLog[];
}): React.JSX.Element {
  const [topic, setTopic] = useState<AssistantTopic>('appspec');
  const answer = assistantAnswer(topic, appSpec, errors, logs);

  return (
    <Card
      title="AI Assistant for Pipeline Explanation"
      headerRight={<Bot className="h-4 w-4 text-accent" aria-hidden="true" />}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {ASSISTANT_TOPICS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTopic(item.id)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              topic === item.id
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="rounded-lg border border-border bg-bg-secondary p-4 text-sm leading-6 text-text-secondary">
        {answer}
      </p>
    </Card>
  );
}

export default function Home(): React.JSX.Element {
  const generation = useGeneration();
  const [integrations, setIntegrations] = useState<IntegrationDefinition[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadIntegrations(): Promise<void> {
      const response = await fetch('/api/integrations');
      if (!response.ok) return;
      const data = (await response.json()) as IntegrationsResponse;
      if (!cancelled) {
        setIntegrations(data.integrations);
      }
    }

    void loadIntegrations();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIntegrations = useMemo(() => {
    const selected = new Set(
      generation.appSpec?.integrationHooks.map((hook) => hook.integrationId) ?? [],
    );
    return integrations.filter((integration) => selected.has(integration.id));
  }, [generation.appSpec, integrations]);

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
                AF
              </div>
              <Badge variant="info">Multi-stage generation engine</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              AppForgeAI
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
              Natural language requirements become validated, repairable, executable AppSpecs.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricPill icon={Timer} label="Latency" value={formatLatency(generation.latency)} />
            <MetricPill icon={CircleDollarSign} label="Cost" value={formatCost(generation.cost)} />
            <MetricPill
              icon={ShieldCheck}
              label="Validation"
              value={generation.errors.length === 0 ? 'Clean' : `${generation.errors.length} items`}
            />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card title="Prompt Input">
            <PromptInput
              prompt={generation.prompt}
              setPrompt={generation.setPrompt}
              isGenerating={generation.isGenerating}
              status={generation.status}
              latency={generation.latency}
              cost={generation.cost}
              onGenerate={generation.generate}
              onReset={generation.reset}
            />
            {generation.connectionError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-text-secondary">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                {generation.connectionError}
              </div>
            )}
          </Card>

          <StageProgress stages={generation.stages} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <AppSpecViewer appSpec={generation.appSpec} />
          <div className="grid gap-6">
            <ValidationPanel errors={generation.errors} />
            <RepairPanel logs={generation.repairLogs} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <IntegrationPanel
            integrations={
              selectedIntegrations.length > 0 ? selectedIntegrations : integrations
            }
          />
          <AssistantPanel
            appSpec={generation.appSpec}
            errors={generation.errors}
            logs={generation.repairLogs}
          />
        </section>
      </div>
    </main>
  );
}
