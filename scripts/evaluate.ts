import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runPipeline } from '../src/lib/pipeline/orchestrator';
import type { PipelineResult, SSEEvent } from '../src/types/pipeline';

interface EvaluationCase {
  id: string;
  prompt: string;
  expectedIntegrations: string[];
}

interface EvaluationRecord {
  id: string;
  prompt: string;
  success: boolean;
  failedStage: string | null;
  latencyMs: number;
  costUsd: number;
  repairStrategies: string[];
  integrationDetection: {
    expected: string[];
    detected: string[];
    passed: boolean;
  };
  validationErrorCount: number;
  appSpecSummary: {
    appName: string | null;
    appType: string | null;
    entities: number;
    pages: number;
    apiEndpoints: number;
    workflows: number;
  };
  events: Array<Pick<SSEEvent, 'type' | 'stage' | 'timestamp'>>;
}

const CASES: EvaluationCase[] = [
  {
    id: 'real-estate-crm-whatsapp',
    prompt:
      'Build CRM for real estate company. Agents manage leads. WhatsApp notifications when deal closes.',
    expectedIntegrations: ['whatsapp'],
  },
  {
    id: 'warehouse-inventory-sheets',
    prompt:
      'Build inventory management for a warehouse with stock alerts and Google Sheets export.',
    expectedIntegrations: ['google_sheets'],
  },
  {
    id: 'ecommerce-stripe-gmail',
    prompt:
      'Create ecommerce admin app with products, orders, Stripe payments, and Gmail receipts.',
    expectedIntegrations: ['stripe', 'gmail'],
  },
  {
    id: 'project-management-slack-jira',
    prompt:
      'Project management app with tasks, sprints, Slack alerts, and Jira issue creation.',
    expectedIntegrations: ['slack', 'jira'],
  },
  {
    id: 'vague-custom-app',
    prompt: 'Build me an app.',
    expectedIntegrations: [],
  },
];

function failedStage(result: PipelineResult): string | null {
  return result.stages.find((stage) => stage.status === 'failed')?.stage ?? null;
}

function toRecord(
  testCase: EvaluationCase,
  result: PipelineResult,
  events: SSEEvent[],
): EvaluationRecord {
  const detected = result.appSpec?.integrationHooks.map((hook) => hook.integrationId) ?? [];
  const detectedSet = new Set(detected);
  const integrationPassed = testCase.expectedIntegrations.every((integration) =>
    detectedSet.has(integration),
  );

  return {
    id: testCase.id,
    prompt: testCase.prompt,
    success: result.status === 'completed',
    failedStage: failedStage(result),
    latencyMs: result.totalLatencyMs,
    costUsd: result.totalCostUsd,
    repairStrategies: result.repairLogs.map((log) => log.strategy),
    integrationDetection: {
      expected: testCase.expectedIntegrations,
      detected,
      passed: integrationPassed,
    },
    validationErrorCount: result.validationErrors.length,
    appSpecSummary: {
      appName: result.appSpec?.appName ?? null,
      appType: result.appSpec?.appType ?? null,
      entities: result.appSpec?.dataSchema.entities.length ?? 0,
      pages: result.appSpec?.pages.length ?? 0,
      apiEndpoints: result.appSpec?.apiEndpoints.length ?? 0,
      workflows: result.appSpec?.workflowStubs.length ?? 0,
    },
    events: events.map((event) => ({
      type: event.type,
      stage: event.stage,
      timestamp: event.timestamp,
    })),
  };
}

function summaryMarkdown(records: EvaluationRecord[]): string {
  const successCount = records.filter((record) => record.success).length;
  const integrationPassCount = records.filter(
    (record) => record.integrationDetection.passed,
  ).length;
  const totalLatency = records.reduce((sum, record) => sum + record.latencyMs, 0);
  const totalCost = records.reduce((sum, record) => sum + record.costUsd, 0);

  const rows = records
    .map(
      (record) =>
        `| ${record.id} | ${record.success ? 'pass' : 'fail'} | ${
          record.failedStage ?? '-'
        } | ${record.integrationDetection.detected.join(', ') || '-'} | ${
          record.validationErrorCount
        } | ${record.latencyMs} |`,
    )
    .join('\n');

  return `# Evaluation Summary

Generated with \`npm run evaluate\` using deterministic local routing.

## Results

- Success rate: ${successCount}/${records.length}
- Integration detection: ${integrationPassCount}/${records.length}
- Total latency: ${totalLatency}ms
- Total estimated cost: $${totalCost.toFixed(4)}

| Case | Status | Failed Stage | Detected Integrations | Validation Items | Latency (ms) |
| --- | --- | --- | --- | ---: | ---: |
${rows}

## Notes

The evaluation runner forces local deterministic routing so hiring reviewers can reproduce the suite without provider API keys. Provider-backed runs use the same orchestrator, validation, repair, and telemetry paths.
`;
}

async function main(): Promise<void> {
  process.env.APPFORGE_FORCE_LOCAL = 'true';
  const outDir = join(process.cwd(), 'evaluation');
  await mkdir(outDir, { recursive: true });

  const records: EvaluationRecord[] = [];

  for (const testCase of CASES) {
    const events: SSEEvent[] = [];
    const result = await runPipeline(
      testCase.prompt,
      async (event) => {
        events.push(event);
      },
      `eval-${testCase.id}`,
    );
    records.push(toRecord(testCase, result, events));
  }

  await writeFile(
    join(outDir, 'evaluation-log.json'),
    `${JSON.stringify(records, null, 2)}\n`,
  );
  await writeFile(join(outDir, 'summary.md'), summaryMarkdown(records));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
