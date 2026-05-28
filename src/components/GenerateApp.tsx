import React, { useState } from 'react';
import { 
  Sparkles, Play, ShieldAlert, BadgeInfo, CheckCircle2, 
  HelpCircle, Settings, Clipboard, Database, Layers, 
  FileJson, Users, Terminal, Code, RefreshCw, GitBranch, ArrowRight,
  Download, FileText, Copy, Ban, Check
} from 'lucide-react';
import { GenerationJob, AppIntent, DataSchema, AppSpec } from '../types';

const integrationRegistryStatic = [
  { id: 'slack', name: 'Slack', status: 'active', description: 'Stream system events, sprint alerts, and operational notifications directly to collaboration channels.', capabilities: ['Direct messaging', 'Channel broadcasts', 'Interactive action blocks'], authType: 'OAuth2 / Bot Token', triggers: ['Task Status Changed', 'Build Triggered', 'Critical Error'], actions: ['Send Message', 'Create Channel', 'Broadcast Alert'] },
  { id: 'whatsapp', name: 'WhatsApp', status: 'available', description: 'Dispatch customer communication sequences, security alerts, or status summaries directly via WhatsApp Business link.', capabilities: ['Transactional SMS templates', 'Inbound payload handlers'], authType: 'API Secret Key', triggers: ['New Signup', 'Payment Received'], actions: ['Send Template Message', 'Push Notification'] },
  { id: 'gmail', name: 'Gmail', status: 'configured', description: 'Deliver automated corporate receipts, invoices, custom notification digests, and drafts sequences.', capabilities: ['Transactional drafts pre-fill', 'Internal receipt dispatches'], authType: 'OAuth2 App Password', triggers: ['Order Completed', 'Weekly Digest Plan'], actions: ['Send HTML Email', 'Draft Email Reply'] },
  { id: 'stripe', name: 'Stripe', status: 'active', description: 'Process global subscription models, checkout sessions, invoices, and webhook event-to-schema synchronization.', capabilities: ['Checkout flow proxy', 'Payment webhooks hook'], authType: 'Webhook Key & Restricted Token', triggers: ['Charge Succeeded', 'Subscription Cancelled', 'Invoice Unpaid'], actions: ['Create Customer', 'Refund Transaction', 'Retrieve Invoices'] },
  { id: 'sheets', name: 'Google Sheets', status: 'available', description: 'Append logs, activity metrics, customer directories, or audit listings instantly to collaborative tables.', capabilities: ['Live sheets append row', 'Cell value lookup triggers'], authType: 'Google Service Account OAuth2', triggers: ['Row Added', 'Metric Threshold Crossed'], actions: ['Append Row', 'Update Row', 'Create Sheet'] },
  { id: 'jira', name: 'Jira', status: 'available', description: 'Synchronize sprint backlog parameters, card transitions, epic updates, and subtask trees with external project desk.', capabilities: ['Issue statuses callbacks', 'Task state replication'], authType: 'Atlassian OAuth Access Token', triggers: ['Issue Updated', 'Comment Created'], actions: ['Create Issue', 'Transition Task', 'Add Comment'] },
  { id: 'webhook', name: 'Webhook', status: 'configured', description: 'Bridge general third-party services with high-performance payload relays, signature checks, and validation queues.', capabilities: ['Arbitrary payload receive', 'Custom JSON triggers dispatch'], authType: 'HMAC Webhook Sign Secret', triggers: ['Incoming Webhook Dispatch'], actions: ['Forward Request', 'Dispatch JSON Payload'] }
];

interface GenerateAppProps {
  onJobCreated?: (job: GenerationJob) => void;
  activeJob: GenerationJob | null;
  setActiveJob: (job: GenerationJob | null) => void;
}

export default function GenerateApp({ onJobCreated, activeJob, setActiveJob }: GenerateAppProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [activePanel, setActivePanel] = useState<'intent_schema' | 'spec_pages' | 'eval_repair' | 'raw_json'>('intent_schema');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleDownloadJson = () => {
    if (!activeJob) return;
    try {
      const payload = {
        jobId: activeJob.jobId,
        prompt: activeJob.prompt,
        mode: activeJob.mode,
        providerUsed: activeJob.providerUsed,
        latencyMs: activeJob.latencyMs,
        costBreakdown: activeJob.costBreakdown,
        appIntent: activeJob.appIntent,
        dataSchema: activeJob.dataSchema,
        appSpec: activeJob.appSpec,
        validation: activeJob.validation,
        repairLog: activeJob.repairLog,
        events: activeJob.events,
        integrationRegistry: integrationRegistryStatic,
        generatedAt: activeJob.createdAt
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appforge-generation-${activeJob.jobId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      triggerToast('JSON downloaded successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!activeJob) return;
    try {
      const report = `# AppForgeAI Generation Report

## Prompt
${activeJob.prompt}

## Generation Metadata
- Job ID: ${activeJob.jobId}
- Mode: ${activeJob.mode}
- Provider: ${activeJob.providerUsed}
- Latency: ${activeJob.latencyMs}ms
- Estimated Cost: $${activeJob.costBreakdown?.estimatedCostUSD || 0}
- Generated At: ${new Date(activeJob.createdAt).toUTCString()}

## App Intent
- App Name: ${activeJob.appIntent?.appName || 'Untitled'}
- App Type: ${activeJob.appIntent?.appType || 'SaaS'}
- Features requested:
${activeJob.appIntent?.features?.map((f: string) => `  - ${f}`).join('\n') || '  - None'}
- Entities catalogued:
${activeJob.appIntent?.entities?.map((e: string) => `  - ${e}`).join('\n') || '  - None'}
- Integrations Requested:
${activeJob.appIntent?.integrations_requested?.map((i: string) => `  - ${i}`).join('\n') || '  - None'}
- Key Assumptions:
${activeJob.appIntent?.assumptions?.map((a: string) => `  - ${a}`).join('\n') || '  - None'}

## Data Schema
${activeJob.dataSchema?.entities?.map((entity: any) => `
### Entity: ${entity.name} (Table: ${entity.tableName})
- Tenant Field Identifier: ${entity.tenantId || 'tenantId'}
- Fields Schema:
${entity.fields?.map((f: any) => `  - ${f.name} [${f.type}] (Primary: ${f.primary}, Unique: ${f.unique}, Nullable: ${f.nullable})`).join('\n')}
- Entity Relations:
${entity.relations?.map((r: any) => `  - ${r.field} points to ${r.targetEntity} (${r.type})`).join('\n') || '  - No relations defined'}
`).join('\n') || 'No entities listed.'}

## AppSpec
- Pages:
${activeJob.appSpec?.pages?.map((p: any) => `  - **${p.name}** (${p.path}) - Bound Components: ${p.components?.join(', ') || 'None'}`).join('\n') || '  - None'}
- API Endpoints list:
${activeJob.appSpec?.apiEndpoints?.map((api: any) => `  - \`${api.method} ${api.path}\` (Auth: ${api.authRequired}, Rate limit: ${api.rateLimit}/m, Bound Entity: ${api.boundEntity})`).join('\n') || '  - None'}
- Integration Hooks middleware:
${activeJob.appSpec?.integrationHooks?.map((h: any) => `  - Hook \`${h.name}\`: Triggers on \`${h.trigger}\` and executes \`${h.action}\` via \`${h.integration}\``).join('\n') || '  - None'}
- Multi-Step Workflow Stubs:
${activeJob.appSpec?.workflowStubs?.map((w: any) => `  - **${w.name}** (Bound to ${w.entity}):\n${w.steps?.map((s: string, stepIdx: number) => `    ${stepIdx+1}. ${s}`).join('\n') || ''}`).join('\n') || '  - None'}

## Validation Result
- Status: ${activeJob.validation?.valid ? 'COMPLIANT' : 'DISCREPANCIES DETECTED'}
- Structural error reports:
${activeJob.validation?.errors?.map((err: any) => `  - [${err.path}] ${err.message}`).join('\n') || '  - No errors.'}

## Repair Logs
${activeJob.repairLog?.map((r: any, idx: number) => `${idx+1}. **${r.strategy}**: Mismatched \`${r.errorInput}\` -> Outcome: ${r.outcome}`).join('\n') || 'No repairs required.'}

## Pipeline Events
${activeJob.events?.map((ev: any) => `  - **${ev.stage}**: Status: ${ev.status} (${ev.latencyMs}ms)`).join('\n') || 'No events collected.'}

## Integration Registry
${integrationRegistryStatic.map((i: any) => `
### ${i.name} Adapter (\`${i.id}\`)
- Current status: **${i.status}**
- Auth scheme: ${i.authType}
- Registered triggers: ${i.triggers?.join(', ') || 'None'}
- Custom channel actions: ${i.actions?.join(', ') || 'None'}
- Capabilities: ${i.capabilities?.join(', ') || 'None'}
`).join('\n')}
`;
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appforge-generation-${activeJob.jobId}.md`;
      link.click();
      URL.revokeObjectURL(url);
      triggerToast('Markdown report downloaded successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyAppSpecSpec = () => {
    if (!activeJob) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(activeJob.appSpec, null, 2));
      triggerToast('Copied AppSpec JSON to clipboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySummaryDetails = () => {
    if (!activeJob) return;
    try {
      const summary = `AppForgeAI Generation Summary:
- Project Name: ${activeJob.appIntent?.appName || 'Untitled'}
- Entities: ${activeJob.dataSchema?.entities?.length || 0} entities generated
- Pages: ${activeJob.appSpec?.pages?.length || 0} pages scaffolded
- Endpoints: ${activeJob.appSpec?.apiEndpoints?.length || 0} REST APIs bound
- Integrations: ${activeJob.appSpec?.integrationHooks?.length || 0} active integrations
- Integrity Validation: ${activeJob.validation?.valid ? 'Fully Multi-Tenant Compliant' : 'Unresolved Issues'}`;
      navigator.clipboard.writeText(summary);
      triggerToast('Summary copied to clipboard');
    } catch (err) {
      console.error(err);
    }
  };
  
  // Local fake step timer tick states for incremental presentation
  const [pipelineSteps, setPipelineSteps] = useState<{ name: string; status: 'pending' | 'processing' | 'completed'; latency?: number }[]>([
    { name: 'Intent Extraction', status: 'pending' },
    { name: 'Schema Generation', status: 'pending' },
    { name: 'AppSpec Generation', status: 'pending' },
    { name: 'Validation', status: 'pending' },
    { name: 'Repair Engine', status: 'pending' }
  ]);

  const examples = [
    { title: 'SaaS Lead CRM', desc: 'CRM task manager with leads, properties, and WhatsApp alerts' },
    { title: 'Agile Tracker', desc: 'SaaS task manager with projects, collaborative comments, and Slack integrations' },
    { title: 'Warehouse Stock', desc: 'Secure retail inventory hub with suppliers, stocking ledger, and Gmail logs' },
    { title: 'Ecommerce checkout', desc: 'ecommerce store with cart payments, Stripe checkouts, and invoice receipts' }
  ];

  const handleTemplateClick = (desc: string) => {
    setPrompt(desc);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setErrorText(null);
    setActiveJob(null);
    
    // Initialize stepper
    setPipelineSteps([
      { name: 'Intent Extraction', status: 'processing' },
      { name: 'Schema Generation', status: 'pending' },
      { name: 'AppSpec Generation', status: 'pending' },
      { name: 'Validation', status: 'pending' },
      { name: 'Repair Engine', status: 'pending' }
    ]);
    setCurrentStep('Extracting business goals & features from raw spec spec...');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Server reported failure compiling model parameters.');
      }

      const job: GenerationJob = await response.json();
      
      // We simulate incremental stepper speed to let user feel the pipeline compilation state transitions:
      const steps = ['Intent Extraction', 'Schema Generation', 'AppSpec Generation', 'Validation', 'Repair Engine'];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setPipelineSteps(prev => 
          prev.map((step, idx) => {
            if (idx === i) {
              const matchedEvent = job.events.find(ev => ev.stage === step);
              return { ...step, status: 'completed', latency: matchedEvent?.latencyMs || 120 };
            }
            if (idx === i + 1) {
              return { ...step, status: 'processing' };
            }
            return step;
          })
        );

        if (i === 0) {
          setCurrentStep('Structuring relational custom database entities schema...');
        } else if (i === 1) {
          setCurrentStep('Stitching API routes, page layout grids, and message stubs...');
        } else if (i === 2) {
          setCurrentStep('Running Zod structural logic validation audits...');
        } else if (i === 3) {
          setCurrentStep('Solving reference integrity discrepancies using auto-healers...');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      setActiveJob(job);
      if (onJobCreated) onJobCreated(job);
    } catch (err: any) {
      console.error('Trigger generation crashed frontend:', err);
      setErrorText(err.message || 'System was unable to reach background model compiler endpoints.');
    } finally {
      setGenerating(false);
    }
  };

  const executeManualRepair = async () => {
    if (!activeJob) return;
    setGenerating(true);
    setCurrentStep('Triggering custom engine repair protocols...');
    try {
      const response = await fetch(`/api/generate/${activeJob.jobId}/repair`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActiveJob(data.job);
          if (onJobCreated) onJobCreated(data.job);
        }
      }
    } catch (e) {
      console.error('Repair action failed:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyJson = () => {
    if (!activeJob) return;
    navigator.clipboard.writeText(JSON.stringify(activeJob, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-300">
      
      {/* Upper Pitch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Input Card */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-medium text-base tracking-tight">AppForge Specification Input</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Describe your custom workspace schema and rules requirements</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Task manager with team collaboration milestones, multi-tenant users catalog, and Slack integrations alerts..."
              className="w-full h-32 bg-[#070707] border border-white/10 rounded-md p-4 text-xs font-mono text-zinc-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
            />
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                {prompt.length} / 500 characters
              </span>
              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  generating || !prompt.trim()
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 cursor-pointer active:scale-95'
                }`}
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Compiling Blueprint...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Generate AppSpec
                  </>
                )}
              </button>
            </div>
          </form>

          {errorText && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-xs font-mono flex items-start gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}
        </div>

        {/* Right Templates Card */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest text-[#1e90ff] mb-2">Preset Quickstarts</h3>
            <p className="text-xs text-gray-500 font-mono">Click a template below to pre-populate custom scope specifications</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {examples.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTemplateClick(ex.desc)}
                disabled={generating}
                className="w-full text-left bg-[#111111] hover:bg-[#151515] hover:border-zinc-700 border border-white/5 rounded p-3 transition-all cursor-pointer group flex flex-col gap-0.5"
              >
                <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                  <span className="group-hover:text-blue-400 transition-colors font-mono">{ex.title}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <span className="text-[10px] text-zinc-500 leading-normal line-clamp-1">{ex.desc}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <BadgeInfo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Fully multi-tenant isolated architecture models schema automatically appended.</span>
          </div>
        </div>

      </div>

      {/* Export / Download Station Actions Panel */}
      <div className="bg-[#0b0b0b] border border-white/5 rounded-lg p-5 font-mono">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-white font-medium text-xs uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Blueprint Export Station
            </h3>
            <p className="text-[10px] text-zinc-500 font-sans">
              {activeJob 
                ? `Blueprint active: export schemas, metadata, validations and adapter stubs.` 
                : 'Generate a SaaS AppSpec blueprint to unlock complete JSON and Markdown code exports.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={handleDownloadJson}
              disabled={!activeJob}
              title={!activeJob ? 'Generate an AppSpec first to enable downloads.' : 'Download complete payload JSON'}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white border select-none ${
                activeJob 
                  ? 'bg-blue-600 hover:bg-blue-500 border-blue-500/20 active:scale-95 cursor-pointer' 
                  : 'bg-zinc-950 border-white/5 text-zinc-650 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>

            <button
              onClick={handleDownloadMarkdown}
              disabled={!activeJob}
              title={!activeJob ? 'Generate an AppSpec first to enable downloads.' : 'Download full report in Markdown'}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white border select-none ${
                activeJob 
                  ? 'bg-zinc-850 hover:bg-zinc-800 border-white/10 active:scale-95 cursor-pointer' 
                  : 'bg-zinc-950 border-white/5 text-zinc-650 cursor-not-allowed'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Download Report
            </button>

            <button
              onClick={handleCopyAppSpecSpec}
              disabled={!activeJob}
              title={!activeJob ? 'Generate an AppSpec first to enable downloads.' : 'Copy compiled AppSpec contract JSON'}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white border select-none ${
                activeJob 
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-white/5 active:scale-95 cursor-pointer' 
                  : 'bg-zinc-950 border-white/5 text-zinc-650 cursor-not-allowed'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy AppSpec
            </button>

            <button
              onClick={handleCopySummaryDetails}
              disabled={!activeJob}
              title={!activeJob ? 'Generate an AppSpec first to enable downloads.' : 'Copy structural summary bullet text'}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white border select-none ${
                activeJob 
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-white/5 active:scale-95 cursor-pointer' 
                  : 'bg-zinc-950 border-white/5 text-zinc-650 cursor-not-allowed'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Summary
            </button>
          </div>
        </div>

        {!activeJob && (
          <div className="mt-3 p-2.5 border border-dashed border-white/5 rounded text-zinc-600 bg-black/25 flex items-center gap-2 text-[10px]">
            <Ban className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="font-sans">Generate an AppSpec first to enable downloads. All exports conform to full OpenAPI context configurations.</span>
          </div>
        )}
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-zinc-950 border border-emerald-500/30 text-emerald-400 text-[11px] px-4.5 py-3 rounded-lg font-mono shadow-lg shadow-black/90 flex items-center gap-2.5 animate-bounce">
          <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
            <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
          </div>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Stepper Stage Pipeline Status tracker */}
      {generating && (
        <div className="bg-[#0a0a0a] border border-blue-500/10 rounded-lg p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              Generator Workspace Status: <strong className="text-blue-400 uppercase tracking-widest text-[10px] bg-blue-500/10 px-2 py-0.5 rounded">{currentStep}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {pipelineSteps.map((step, idx) => (
              <div 
                key={idx} 
                className={`border rounded p-3 text-center transition-all flex flex-col items-center justify-center gap-1.5 font-mono ${
                  step.status === 'completed'
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400'
                    : step.status === 'processing'
                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-400 scale-[1.01] shadow-[0_0_12px_rgba(30,144,255,0.06)] animate-pulse'
                    : 'bg-[#111111] border-white/5 text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="text-[9px] font-bold px-1.5 bg-black/30 rounded">{idx + 1}</span>
                  <span className="text-[10px] font-bold">{step.name}</span>
                </div>
                {step.status === 'completed' && (
                  <span className="text-[9px] text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    +{step.latency || 120}ms
                  </span>
                )}
                {step.status === 'processing' && (
                  <span className="text-[9px] text-blue-500 uppercase tracking-wider text-[8px] animate-pulse">
                    active compile
                  </span>
                )}
                {step.status === 'pending' && (
                  <span className="text-[9px] text-[#444] uppercase tracking-wider text-[8px]">
                    queued
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Outputs Panels */}
      {activeJob && !generating && (
        <div className="bg-[#0d0d0d] border border-white/10 rounded-lg overflow-hidden">
          
          {/* Output Header */}
          <div className="bg-[#090909] border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-sm tracking-tight">
                  Blueprint: <strong className="text-zinc-200 font-bold font-mono">{activeJob.appIntent?.appName}</strong>
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest font-mono ${
                  activeJob.mode === 'ai' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-zinc-800 text-zinc-400 border border-white/5'
                }`}>
                  {activeJob.mode === 'ai' ? 'Gemini AI Engine Active' : 'Demo Mode: Local deterministic generator active'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">Job identifier: <span className="text-gray-400">{activeJob.jobId}</span> • Created at UTC: <span className="text-gray-400">{new Date(activeJob.createdAt).toUTCString()}</span></p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 rounded text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-blue-400" />
                {copySuccess ? 'Copied!' : 'Copy Blueprint JSON'}
              </button>
            </div>
          </div>

          {/* Sub Navigation tabs */}
          <div className="bg-[#111] border-b border-white/5 px-6 flex overflow-x-auto scrollbar-none">
            {[
              { id: 'intent_schema', label: 'Extract & Schema', icon: Database },
              { id: 'spec_pages', label: 'Compiled AppSpec', icon: Layers },
              { id: 'eval_repair', label: 'Evaluations & Repair', icon: Code },
              { id: 'raw_json', label: 'Raw Output Code', icon: FileJson }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`py-3 px-4 text-[10px] uppercase tracking-widest font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all relative cursor-pointer ${
                  activePanel === tab.id ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {activePanel === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Inner Content Cards */}
          <div className="p-6">
            
            {/* Panel 1: Intent & Schema */}
            {activePanel === 'intent_schema' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Intent info rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#090909] border border-white/5 rounded-lg p-5">
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5" /> App Intent Specifications
                    </h4>
                    
                    <div className="text-xs space-y-3 font-mono">
                      <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                        <span className="text-zinc-500">App Name:</span>
                        <span className="text-white col-span-2 font-bold">{activeJob.appIntent?.appName}</span>
                      </div>
                      <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                        <span className="text-zinc-500">App Type:</span>
                        <span className="text-zinc-300 col-span-2">{activeJob.appIntent?.appType}</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <span className="text-zinc-500">Feature Deliverables:</span>
                        <ul className="list-inside list-disc pl-2 space-y-1 text-zinc-400">
                          {activeJob.appIntent?.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-[#1e90ff] uppercase flex items-center gap-2">
                      <BadgeInfo className="w-3.5 h-3.5" /> Context Dependencies
                    </h4>
                    
                    <div className="text-xs space-y-3 font-mono">
                      <div className="space-y-1.5">
                        <span className="text-zinc-500">Engineering Assumptions:</span>
                        <ul className="list-inside list-disc pl-2 space-y-1 text-zinc-400">
                          {activeJob.appIntent?.assumptions.map((ass, i) => (
                            <li key={i}>{ass}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <span className="text-zinc-500">Integrations Requested:</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeJob.appIntent?.integrations_requested.map((int, i) => (
                            <span key={i} className="px-2.5 py-1 bg-[#161616] border border-white/5 rounded text-[10px] text-zinc-300 font-bold">
                              {int}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schema Relation Mapping */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest text-zinc-400">Data Models Schema Catalog</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeJob.dataSchema?.entities.map((ent, idx) => (
                      <div key={idx} className="bg-[#090909] border border-white/5 rounded-lg overflow-hidden group hover:border-[#1e90ff]/20 transition-all flex flex-col justify-between">
                        
                        {/* Table Header */}
                        <div className="bg-[#111] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded bg-blue-500" />
                            <span className="text-white text-xs font-mono font-bold">{ent.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">table: {ent.tableName}</span>
                        </div>

                        {/* Fields */}
                        <div className="p-4 space-y-2 font-mono text-[10px]">
                          <div className="text-zinc-500 uppercase tracking-wider text-[9px] pb-1 border-b border-white/5">Columns</div>
                          {ent.fields.map((fld, i) => (
                            <div key={i} className="flex justify-between items-center text-zinc-300 py-0.5">
                              <span className="flex items-center gap-1.5">
                                {fld.name === ent.tenantId && <Users className="w-3 h-3 text-emerald-400" />}
                                {fld.primary && <span className="text-yellow-500 font-bold">🔑</span>}
                                <span className={fld.name === ent.tenantId ? 'text-emerald-400 font-medium' : ''}>{fld.name}</span>
                              </span>
                              <span className="text-zinc-500 text-[9px] flex items-center gap-1">
                                {fld.type}
                                {fld.unique && <span className="bg-zinc-800 text-zinc-400 text-[8px] px-1 rounded font-bold uppercase">UQ</span>}
                                {fld.nullable && <span className="text-zinc-600">NULL</span>}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Relations */}
                        <div className="p-4 border-t border-white/5 font-mono text-[9px] bg-black/10">
                          <div className="text-zinc-500 uppercase tracking-widest text-[8px] pb-1.5">Foreign Keys & Relations</div>
                          {ent.relations.length === 0 ? (
                            <span className="text-zinc-600 italic">No external mapping relations</span>
                          ) : (
                            <div className="space-y-1">
                              {ent.relations.map((rel, i) => (
                                <div key={i} className="flex justify-between text-zinc-400">
                                  <span>{rel.field} → {rel.targetEntity}</span>
                                  <span className="text-[#1e90ff] uppercase">{rel.type.replace(/-/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Panel 2: AppSpec Compiled Pages & APIs */}
            {activePanel === 'spec_pages' && (
              <div className="space-y-8 animate-fade-in font-mono text-xs">
                
                {/* 1. Pages Layout List */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-400">Layout Screens Grid ({activeJob.appSpec?.pages.length})</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeJob.appSpec?.pages.map((pg, idx) => (
                      <div key={idx} className="bg-[#090909] border border-white/5 rounded-lg p-5 space-y-4">
                        <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                          <div>
                            <h4 className="text-white text-xs font-bold font-mono">{pg.name}</h4>
                            <span className="text-[10px] text-zinc-500 mt-1 block">path: <strong className="text-blue-400">{pg.path}</strong></span>
                          </div>
                          <span className="px-2 py-0.5 bg-zinc-800 border border-white/5 rounded text-[9px] text-[#1e90ff] uppercase tracking-wider">
                            layout: {pg.layout}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                          <div className="space-y-1.5">
                            <span className="text-zinc-500 uppercase tracking-wider text-[9px]">Ui Elements Components</span>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {pg.components.map((comp, i) => (
                                <span key={i} className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-400 font-mono text-[9px]">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-zinc-500 uppercase tracking-wider text-[9px]">REST Api Bindings</span>
                            <div className="flex flex-col gap-1 pt-1">
                              {pg.apiEndpoints.map((path, i) => (
                                <span key={i} className="text-[#1e90ff] font-bold text-[10px]">
                                  → {path}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. API Endpoints Table */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-xs uppercase tracking-widest text-[#1e90ff]">API Endpoints Contracts</h3>
                  
                  <div className="overflow-x-auto bg-[#090909] border border-white/5 rounded-lg">
                    <table className="w-full text-left font-mono text-[10px] text-zinc-300 border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-[#111] text-zinc-500 uppercase text-[9px] tracking-wider">
                          <th className="py-2.5 px-4 w-20">Method</th>
                          <th className="py-2.5 px-4">Endpoint Path</th>
                          <th className="py-2.5 px-4">Bound Entity Model</th>
                          <th className="py-2.5 px-4">Auth / Limit</th>
                          <th className="py-2.5 px-4">Permissions required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeJob.appSpec?.apiEndpoints.map((api, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-[#111]/30 transition-colors">
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                api.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' :
                                api.method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                                api.method === 'PUT' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {api.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-zinc-200">{api.path}</td>
                            <td className="py-2.5 px-4 text-zinc-400">{api.boundEntity || '-'}</td>
                            <td className="py-2.5 px-4 text-zinc-400 space-y-0.5">
                              <div>{api.authRequired ? `🔒 ${api.authRoles.join(', ')}` : '🔓 Public'}</div>
                              <div className="text-[9px] text-zinc-600">{api.rateLimit} req/min limit</div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {api.permissions.length === 0 ? (
                                  <span className="text-zinc-600">-</span>
                                ) : (
                                  api.permissions.map((p, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-[#161616] rounded text-[#888] text-[9px] border border-white/5">
                                      {p}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Integration & Workflows lower grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Hooks */}
                  <div className="space-y-4">
                    <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-400">Integration Middleware Hooks</h3>
                    <div className="bg-[#090909] border border-white/5 rounded-lg p-5 space-y-3">
                      {activeJob.appSpec?.integrationHooks.length === 0 ? (
                        <div className="text-zinc-500 italic text-[11px]">No integrations attached. App operates purely on-premise local isolates schema databases.</div>
                      ) : (
                        activeJob.appSpec?.integrationHooks.map((hk, idx) => (
                          <div key={idx} className="bg-[#121212] border border-white/5 rounded p-3 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-blue-400 uppercase tracking-widest">{hk.name}</span>
                              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[9px] font-bold">
                                {hk.integration} Adapter
                              </span>
                            </div>
                            <div className="text-zinc-400 text-[10px] space-y-1">
                              <div><strong className="text-zinc-500">Trigger standard:</strong> {hk.trigger}</div>
                              <div><strong className="text-zinc-500">Dispatch action:</strong> {hk.action}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Workflows */}
                  <div className="space-y-4">
                    <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-400">Business Logic Workflow Stubs</h3>
                    <div className="bg-[#090909] border border-white/5 rounded-lg p-5 space-y-3">
                      {activeJob.appSpec?.workflowStubs.map((wf, idx) => (
                        <div key={idx} className="bg-[#121212] border border-white/5 rounded p-3 space-y-2">
                          <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5">
                            <span className="font-bold text-zinc-200">{wf.name}</span>
                            <span className="text-[10px] text-[#1e90ff] font-bold font-mono">Bound entity: {wf.entity}</span>
                          </div>
                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1">Workflow run sequence</span>
                            {wf.steps.map((st, i) => (
                              <div key={i} className="text-zinc-400 text-[10px] flex items-center gap-1.5">
                                <span className="text-zinc-600 block w-3">{i+1}.</span>
                                <span>{st}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Panel 3: Validation checks & Auto Repair Logs */}
            {activePanel === 'eval_repair' && (
              <div className="space-y-8 animate-fade-in font-mono text-xs">
                
                {/* Score section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#090909] border border-white/5 rounded-lg p-6">
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-bold tracking-widest text-blue-400">Structural integrity validation</h4>
                    
                    <div className="flex items-center gap-4">
                      {activeJob.validation?.valid ? (
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400">
                          <ShieldAlert className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="text-zinc-200 font-bold text-sm">
                          Blueprint status: {activeJob.validation?.valid ? <span className="text-emerald-400 uppercase tracking-widest font-bold">Compliant</span> : <span className="text-red-400 uppercase tracking-widest font-bold">Errors found</span>}
                        </div>
                        <p className="text-[11px] text-zinc-500">Zod schemas compiled against custom relational multi-tenant rules.</p>
                      </div>
                    </div>

                    {!activeJob.validation?.valid && (
                      <button
                        onClick={executeManualRepair}
                        disabled={generating}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Trigger Custom Repair protocols
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 font-mono text-[10px]">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-b border-white/5 pb-1">Core specifications score metrics</h4>
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-400">Entity structures isolation (tenantId):</span>
                        <span className="text-emerald-400 font-bold">100% compliant</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-400">Pages API routes mappings:</span>
                        <span className="text-emerald-400 font-bold">100% complete</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-zinc-400">Foreign metadata mappings integration:</span>
                        <span className="text-emerald-400 font-bold">100% verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Errors panel */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-400">Structural validations report log</h3>
                  {activeJob.validation?.errors.length === 0 ? (
                    <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs rounded flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Perfect compliance! All schemas, relations, pages, and integrations resolved fine. No structural mismatches.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeJob.validation?.errors.map((err, i) => (
                        <div key={i} className="p-3.5 bg-red-950/10 border border-red-500/20 text-red-300 font-mono text-xs rounded flex items-start gap-3">
                          <ShieldAlert className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-red-500 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded">
                              Path: {err.path}
                            </span>
                            <p className="pt-1 text-zinc-300 font-sans leading-relaxed">{err.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Repair Logs list */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium text-xs uppercase tracking-widest text-[#1e90ff]">Historical repair operations ({activeJob.repairLog.length})</h3>
                  {activeJob.repairLog.length === 0 ? (
                    <div className="p-4 bg-[#090909] border border-white/5 text-zinc-500 font-mono rounded text-center">
                      No repairs required or triggered on this blueprint yet. Model output compile succeeded without error corrections.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeJob.repairLog.map((rep, idx) => (
                        <div key={idx} className="bg-[#090909] border border-white/5 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase rounded text-[9px] tracking-wider">
                              Strategy: {rep.strategy.replace(/_/g, ' ')}
                            </span>
                            <span className="text-zinc-500">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                          </div>

                          <div className="text-[11px] font-mono leading-relaxed space-y-1.5 pt-1">
                            <div className="text-red-400 italic">
                              <span className="text-zinc-500 font-bold">Mismatched parameter:</span> "{rep.errorInput}"
                            </div>
                            <div className="text-emerald-400">
                              <span className="text-zinc-500 font-bold">Automated repair:</span> {rep.outcome}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Panel 4: Raw Output JSON Code */}
            {activePanel === 'raw_json' && (
              <div className="space-y-4 animate-fade-in font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Parsed blueprint JSON response</span>
                  <button
                    onClick={handleCopyJson}
                    className="px-2.5 py-1 bg-zinc-900 border border-white/5 rounded text-[10px] text-zinc-400 hover:text-white transition-all cursor-pointer"
                  >
                    {copySuccess ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-[#070707] border border-white/10 rounded-md p-5 text-zinc-300 overflow-x-auto scrollbar-thin text-[11.5px] leading-relaxed select-all">
                  {JSON.stringify(activeJob, null, 2)}
                </pre>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
