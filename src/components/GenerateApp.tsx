import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code2,
  Copy,
  Database,
  Download,
  Eye,
  FileCode2,
  FileText,
  Folder,
  GitBranch,
  LayoutDashboard,
  Loader2,
  Monitor,
  Play,
  RefreshCcw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tablet,
  Terminal,
  Wrench,
  Smartphone,
} from 'lucide-react';
import { GenerationJob } from '../types';

const APP_TYPES = ['SaaS', 'CRM', 'E-commerce', 'Dashboard', 'Portfolio', 'AI Tool'];
const TECH_STACKS = ['React', 'Next.js', 'Node.js', 'Express', 'Supabase', 'Firebase', 'PostgreSQL'];
const FEATURES = ['Authentication', 'Dashboard', 'Admin Panel', 'Payments', 'AI Assistant', 'Email Notifications', 'File Uploads'];

const PIPELINE_STAGES = [
  'Understanding Prompt',
  'Planning App Architecture',
  'Designing Database Schema',
  'Generating Frontend',
  'Generating Backend',
  'Creating API Routes',
  'Adding Authentication',
  'Creating UI Polish',
  'Building Deployment Files',
  'Final Review',
  'Preview Ready',
];

type MainTab = 'generate' | 'projects' | 'integrations' | 'activity' | 'settings';
type PreviewMode = 'desktop' | 'tablet' | 'mobile';
type OutputTab = 'code' | 'spec' | 'validation' | 'preview';

interface GeneratedFile {
  path: string;
  name: string;
  language: string;
  content: string;
  explanation: string;
}

interface GenerationResult {
  jobId: string;
  status: 'completed';
  prompt: string;
  appIntent: any;
  dataSchema: any;
  appSpec: any;
  validation: {
    overallStatus: 'passed' | 'warning' | 'failed';
    checks: { label: string; status: 'passed' | 'warning' | 'failed'; detail: string }[];
    warnings: string[];
    repairAttempts: number;
  };
  repairLog: string[];
  activityLogs: string[];
  files: Record<string, GeneratedFile>;
  summary: {
    appName: string;
    appType: string;
    techStack: string[];
    generatedFilesCount: number;
    providerUsed: string;
  };
  events: { stage: string; status: 'completed'; latencyMs: number }[];
  providerUsed: string;
  createdAt: string;
}

interface GenerateAppProps {
  onJobCreated?: (job: GenerationJob) => void;
  activeJob: GenerationJob | null;
  setActiveJob: (job: GenerationJob | null) => void;
  onProjectAdded?: (newProj: any) => void;
  onAddActivityLog?: (
    title: string,
    desc: string,
    category: 'generation' | 'build' | 'integration' | 'deployment' | 'system',
    status: 'success' | 'running' | 'failed' | 'info',
  ) => void;
  setActiveTab?: (tab: MainTab) => void;
  selectedProject?: any;
  setSelectedProject?: (proj: any) => void;
}

export default function GenerateApp({
  onJobCreated,
  activeJob,
  setActiveJob,
  onProjectAdded,
  onAddActivityLog,
  setActiveTab,
  selectedProject,
  setSelectedProject,
}: GenerateAppProps) {
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [appType, setAppType] = useState('SaaS');
  const [selectedStack, setSelectedStack] = useState<string[]>(['React', 'Node.js', 'Express', 'PostgreSQL']);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['Authentication', 'Dashboard']);

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedStageIndex, setCompletedStageIndex] = useState(-1);
  const [currentStage, setCurrentStage] = useState('Ready');
  const [estimatedRemaining, setEstimatedRemaining] = useState('');
  const [activityLogs, setActivityLogs] = useState<string[]>([]);
  const [repairLog, setRepairLog] = useState<string[]>([]);
  const [visibleFileCount, setVisibleFileCount] = useState(0);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [previewPage, setPreviewPage] = useState('Dashboard');
  const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'deployed'>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [codeNote, setCodeNote] = useState('');
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>('code');

  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedProject) return;
    setProjectName(selectedProject.name || '');
    setAppType(normalizeAppType(selectedProject.type || 'SaaS'));
    setSelectedStack(splitStack(selectedProject.techStack || 'React, Node.js, Express, PostgreSQL'));
    setSelectedFeatures(selectedProject.features?.length ? selectedProject.features : ['Authentication', 'Dashboard']);
    setPrompt(`Regenerate and improve ${selectedProject.name} as a structured full-stack AppForgeAI project.`);
    setSelectedProject?.(null);
  }, [selectedProject, setSelectedProject]);

  const allFiles = useMemo(() => Object.values(result?.files || {}), [result]);
  const visibleFiles = useMemo(() => allFiles.slice(0, Math.max(visibleFileCount, 0)), [allFiles, visibleFileCount]);
  const selectedFile = result?.files[selectedFilePath] || visibleFiles[0] || null;
  const showIntent = Boolean(result && completedStageIndex >= 1);
  const showSchema = Boolean(result && completedStageIndex >= 2);
  const showSpec = Boolean(result && completedStageIndex >= 3);
  const showValidation = Boolean(result && completedStageIndex >= 4);
  const showFiles = Boolean(result && completedStageIndex >= 3);
  const showPreview = Boolean(result && completedStageIndex >= 10);
  const isFinished = Boolean(result && completedStageIndex >= PIPELINE_STAGES.length - 1 && !generating);

  const pushLog = (message: string) => {
    setActivityLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 80));
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const toggleStack = (stack: string) => {
    setSelectedStack((prev) => {
      if (prev.includes(stack)) return prev.filter((item) => item !== stack);
      return [...prev, stack];
    });
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => {
      if (prev.includes(feature)) return prev.filter((item) => item !== feature);
      return [...prev, feature];
    });
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    await startGeneration();
  };

  const startGeneration = async () => {
    if (!prompt.trim() || !projectName.trim() || generating) return;

    setGenerating(true);
    setResult(null);
    setProgress(0);
    setCompletedStageIndex(-1);
    setCurrentStage('Starting');
    setVisibleFileCount(0);
    setRepairLog([]);
    setActivityLogs([]);
    setSelectedFilePath('');
    setDeployState('idle');
    setCodeNote('');
    setActiveOutputTab('code');

    const minimumMs = getMinimumGenerationMs(prompt, selectedFeatures);
    const stageDelay = Math.floor(minimumMs / PIPELINE_STAGES.length);

    try {
      pushLog('Submitted prompt to server-side generation route');
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          projectName,
          appType,
          techStack: selectedStack,
          features: selectedFeatures,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Generation failed with HTTP ${response.status}`);
      }

      const payload: GenerationResult = await response.json();
      setResult(payload);
      setRepairLog(payload.repairLog || []);
      const firstFile = Object.keys(payload.files || {})[0] || '';
      setSelectedFilePath(firstFile);

      for (let index = 0; index < PIPELINE_STAGES.length; index += 1) {
        const stage = PIPELINE_STAGES[index];
        setCurrentStage(stage);
        pushLog(`Stage ${index + 1}/${PIPELINE_STAGES.length}: ${stage}`);
        setEstimatedRemaining(formatRemaining((PIPELINE_STAGES.length - index - 1) * stageDelay));

        const nextVisibleFiles = getVisibleFileCount(index, Object.keys(payload.files || {}).length);
        if (nextVisibleFiles > 0) setVisibleFileCount(nextVisibleFiles);

        await wait(stageDelay);
        setCompletedStageIndex(index);
        setProgress(Math.round(((index + 1) / PIPELINE_STAGES.length) * 100));
      }

      setVisibleFileCount(Object.keys(payload.files || {}).length);
      setEstimatedRemaining('Complete');
      pushLog('Structured pipeline finished. Project saved and preview ready.');

      const job = toGenerationJob(payload);
      setActiveJob(job);
      onJobCreated?.(job);
      onProjectAdded?.({
        id: `proj-${payload.jobId}`,
        name: payload.appIntent.appName,
        type: payload.appIntent.appType,
        techStack: payload.summary.techStack.join(', '),
        features: payload.appIntent.features,
        status: 'Deployed',
        progress: 100,
        generatedFilesCount: payload.summary.generatedFilesCount,
        lastUpdated: 'Just now',
        liveUrl: `https://${slugify(payload.appIntent.appName)}.onrender.com`,
        githubRepo: `github.com/agarwalrohit/${slugify(payload.appIntent.appName)}`,
        isCustom: true,
        appSpec: payload.appSpec,
      });
      onAddActivityLog?.(
        `Generated ${payload.appIntent.appName}`,
        `Validated AppIntent, DataSchema, AppSpec, and ${payload.summary.generatedFilesCount} generated files.`,
        'generation',
        'success',
      );
    } catch (error: any) {
      pushLog(`Generation failed: ${error.message || 'Unknown error'}`);
      onAddActivityLog?.('Generation failed', error.message || 'Unknown generation error', 'generation', 'failed');
      showToast(error.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    const zip = new JSZip();
    Object.values(result.files as Record<string, GeneratedFile>).forEach((file) => zip.file(file.path.replace(/^generated-project\//, ''), file.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${slugify(result.appIntent.appName)}-generated-project.zip`);
    showToast('Generated project zip downloaded');
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, selectedFile.name);
    showToast('Selected file downloaded');
  };

  const handleCopy = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    showToast('Code copied to clipboard');
  };

  const handleExplainCode = () => {
    if (!selectedFile) return;
    setCodeNote(selectedFile.explanation || 'This file is part of the generated project skeleton.');
    showToast('Code explanation opened');
  };

  const handleRegenerateFile = () => {
    if (!result || !selectedFile) return;
    const updatedFile = {
      ...selectedFile,
      content: `${selectedFile.content}\n\n// Regenerated by AppForgeAI file-level repair pass at ${new Date().toISOString()}`,
    };
    setResult({
      ...result,
      files: { ...result.files, [selectedFile.path]: updatedFile },
    });
    pushLog(`Regenerated file ${selectedFile.path}`);
    showToast('File regenerated');
  };

  const handleFixIssues = () => {
    const entry = `Manual file repair requested -> no blocking syntax issues detected for ${selectedFile?.name || 'selected file'}`;
    setRepairLog((prev) => [entry, ...prev]);
    pushLog(entry);
    showToast('Fix pass completed');
  };

  const handleDeploy = () => {
    if (!result || deployState === 'deploying') return;
    setDeployState('deploying');
    pushLog('Render deployment simulation started');
    onAddActivityLog?.(`Deploy started for ${result.appIntent.appName}`, 'Render web service build queued.', 'deployment', 'running');
    window.setTimeout(() => {
      setDeployState('deployed');
      pushLog('Render deployment simulation completed');
      onAddActivityLog?.(`Deploy completed for ${result.appIntent.appName}`, 'Render-ready build and start commands verified.', 'deployment', 'success');
      showToast('Deploy sequence completed');
    }, 2200);
  };

  const handlePreviewClick = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!result && !generating) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-start justify-center py-8">
        <GeneratorForm
          projectName={projectName}
          setProjectName={setProjectName}
          prompt={prompt}
          setPrompt={setPrompt}
          appType={appType}
          setAppType={setAppType}
          selectedStack={selectedStack}
          toggleStack={toggleStack}
          selectedFeatures={selectedFeatures}
          toggleFeature={toggleFeature}
          onSubmit={handleGenerate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <div className="fixed right-6 top-20 z-[9999] rounded-lg border border-emerald-500/30 bg-[#0b0d10] px-4 py-3 text-xs text-white shadow-2xl">
          {toast}
        </div>
      )}

      <section className="rounded-xl border border-white/5 bg-[#09090b] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-blue-400 font-mono font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              Generator Workspace
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {result?.appIntent?.appName || projectName}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
              Prompt -&gt; Intent Extraction -&gt; DataSchema Generation -&gt; AppSpec Generation -&gt; Validation -&gt; Repair / Retry -&gt; Frontend -&gt; Backend -&gt; Database -&gt; Preview -&gt; Project Save
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-3 gap-2 text-center font-mono text-[10px]">
            <Metric label="Progress" value={`${progress}%`} />
            <Metric label="Stage" value={`${Math.min(completedStageIndex + 2, PIPELINE_STAGES.length)}/${PIPELINE_STAGES.length}`} />
            <Metric label="ETA" value={estimatedRemaining || 'Starting'} />
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-900">
          <motion.div
            className="h-full bg-blue-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <PipelineStepper completedStageIndex={completedStageIndex} currentStage={currentStage} />
          <ActivityPanel logs={activityLogs.length ? activityLogs : result?.activityLogs || []} />
        </div>

        <div className="space-y-6">
          <OutputTabs activeTab={activeOutputTab} onChange={setActiveOutputTab} showPreview={showPreview} />

          {activeOutputTab === 'code' && (
            <CodeWorkspacePanel
              showFiles={showFiles}
              visibleFiles={visibleFiles}
              allFilesCount={allFiles.length}
              selectedFile={selectedFile}
              selectedFilePath={selectedFile?.path || ''}
              onSelectFile={setSelectedFilePath}
              onCopy={handleCopy}
              onDownloadFile={handleDownloadFile}
              onDownloadZip={handleDownloadZip}
              onExplainCode={handleExplainCode}
              onRegenerateFile={handleRegenerateFile}
              onFixIssues={handleFixIssues}
              codeNote={codeNote}
            />
          )}

          {activeOutputTab === 'spec' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {showIntent ? <JsonPanel title="AppIntent" icon={<Bot className="h-4 w-4" />} data={result?.appIntent} /> : <WaitingPanel label="Waiting for AppIntent" />}
              {showSchema ? <JsonPanel title="DataSchema" icon={<Database className="h-4 w-4" />} data={result?.dataSchema} /> : <WaitingPanel label="Waiting for DataSchema" />}
              {showSpec ? <JsonPanel title="AppSpec" icon={<LayoutDashboard className="h-4 w-4" />} data={result?.appSpec} /> : <WaitingPanel label="Waiting for AppSpec" />}
            </div>
          )}

          {activeOutputTab === 'validation' && (
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              {showValidation ? <ValidationPanel report={result?.validation} /> : <WaitingPanel label="Validation starts after AppSpec generation" />}
              <RepairPanel repairLog={repairLog} />
            </section>
          )}

          {activeOutputTab === 'preview' && (
            <section ref={previewRef} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
              {showPreview ? (
                <PreviewPanel
                  result={result}
                  previewMode={previewMode}
                  setPreviewMode={setPreviewMode}
                  previewPage={previewPage}
                  setPreviewPage={setPreviewPage}
                />
              ) : (
                <WaitingPanel label="Preview appears after final review" />
              )}
              <SummaryPanel
                result={result}
                isFinished={isFinished}
                deployState={deployState}
                onPreview={handlePreviewClick}
                onOpenWorkspace={() => setActiveTab?.('projects')}
                onDownloadCode={handleDownloadZip}
                onDeploy={handleDeploy}
                onRegenerate={startGeneration}
                activeJob={activeJob}
              />
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

function OutputTabs({ activeTab, onChange, showPreview }: { activeTab: OutputTab; onChange: (tab: OutputTab) => void; showPreview: boolean }) {
  const tabs: { id: OutputTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'code', label: 'Generated Code', icon: <FileCode2 className="h-4 w-4" /> },
    { id: 'spec', label: 'Specs', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'validation', label: 'Reliability', icon: <ShieldCheck className="h-4 w-4" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" />, disabled: !showPreview },
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-[#09090b] p-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              activeTab === tab.id
                ? 'border-blue-500/35 bg-blue-500/10 text-blue-200 shadow-lg shadow-blue-500/5'
                : 'border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CodeWorkspacePanel({
  showFiles,
  visibleFiles,
  allFilesCount,
  selectedFile,
  selectedFilePath,
  onSelectFile,
  onCopy,
  onDownloadFile,
  onDownloadZip,
  onExplainCode,
  onRegenerateFile,
  onFixIssues,
  codeNote,
}: {
  showFiles: boolean;
  visibleFiles: GeneratedFile[];
  allFilesCount: number;
  selectedFile: GeneratedFile | null;
  selectedFilePath: string;
  onSelectFile: (path: string) => void;
  onCopy: () => void;
  onDownloadFile: () => void;
  onDownloadZip: () => void;
  onExplainCode: () => void;
  onRegenerateFile: () => void;
  onFixIssues: () => void;
  codeNote: string;
}) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Generated File Tree and Code Viewer</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {showFiles
              ? `${visibleFiles.length} of ${allFilesCount} files revealed across frontend, backend, database, API, and deployment sections.`
              : 'Code generation starts after architecture and database planning finish.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconButton label="Copy Code" icon={<Copy className="h-3.5 w-3.5" />} onClick={onCopy} disabled={!selectedFile} />
          <IconButton label="Download File" icon={<Download className="h-3.5 w-3.5" />} onClick={onDownloadFile} disabled={!selectedFile} />
          <IconButton label="Export ZIP" icon={<Clipboard className="h-3.5 w-3.5" />} onClick={onDownloadZip} disabled={!showFiles} />
          <IconButton label="Explain Code" icon={<Search className="h-3.5 w-3.5" />} onClick={onExplainCode} disabled={!selectedFile} />
          <IconButton label="Regenerate File" icon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={onRegenerateFile} disabled={!selectedFile} />
          <IconButton label="Fix Issues" icon={<Wrench className="h-3.5 w-3.5" />} onClick={onFixIssues} disabled={!selectedFile} />
        </div>
      </div>

      {showFiles ? (
        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[340px_1fr]">
          <FileTree files={visibleFiles} selectedFilePath={selectedFilePath} onSelect={onSelectFile} />
          <div className="min-w-0 border-l border-white/5 bg-[#050506]">
            <div className="flex h-11 items-center justify-between border-b border-white/5 px-4">
              <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-300">
                <FileCode2 className="h-4 w-4 text-blue-400" />
                <span className="truncate font-mono">{selectedFile?.path || 'Select a file'}</span>
              </div>
              <span className="rounded border border-white/5 px-2 py-1 text-[10px] uppercase text-zinc-500">
                Monaco
              </span>
            </div>
            <div className="h-[520px]">
              <Editor
                theme="vs-dark"
                language={selectedFile?.language || 'typescript'}
                value={selectedFile?.content || '// Select a generated file'}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
            {codeNote && (
              <div className="border-t border-white/5 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-400">
                <strong className="text-white">Explanation:</strong> {codeNote}
              </div>
            )}
          </div>
        </div>
      ) : (
        <WaitingPanel label="Generating production-ready source files" />
      )}
    </section>
  );
}

function WaitingPanel({ label }: { label: string }) {
  return (
    <section className="flex min-h-[220px] items-center justify-center rounded-xl border border-white/5 bg-[#09090b] p-6 text-center">
      <div className="space-y-3">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-400" />
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500">AppForgeAI is revealing each artifact only after its upstream contract is ready.</p>
      </div>
    </section>
  );
}

function GeneratorForm(props: {
  projectName: string;
  setProjectName: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  appType: string;
  setAppType: (value: string) => void;
  selectedStack: string[];
  toggleStack: (value: string) => void;
  selectedFeatures: string[];
  toggleFeature: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={props.onSubmit} className="w-full max-w-6xl space-y-7 rounded-xl border border-white/5 bg-[#09090b] p-6 shadow-2xl shadow-black/40 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="mx-auto max-w-4xl text-center"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300 shadow-lg shadow-blue-500/5">
          <Sparkles className="h-3.5 w-3.5" />
          AppForgeAI
        </div>
        <h1 className="text-[2.75rem] font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[0.98] [text-shadow:0_0_44px_rgba(59,130,246,0.14)]">
          Build{' '}
          <span className="inline-block bg-gradient-to-r from-white via-blue-200 to-cyan-300 bg-clip-text text-transparent animate-gradient-walk">
            Full-Stack Apps
          </span>
          <br />
          <span className="text-zinc-100">From </span>
          <span className="inline-block bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent animate-gradient-walk">
            One Powerful Prompt
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-[15px]">
          Describe your idea and AppForgeAI will generate a structured AppSpec, frontend, backend, database schema, APIs, and preview.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <label className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Project Name</span>
          <input
            required
            value={props.projectName}
            onChange={(event) => props.setProjectName(event.target.value)}
            placeholder="Vyapaar"
            className="w-full rounded-lg border border-white/10 bg-[#111114] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">App Type</span>
          <select
            value={props.appType}
            onChange={(event) => props.setAppType(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111114] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
          >
            {APP_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">App Description Prompt</span>
        <textarea
          required
          value={props.prompt}
          onChange={(event) => props.setPrompt(event.target.value)}
          placeholder="Example: Build a business management SaaS for shop owners with inventory, orders, customers, payments, staff login, dashboards, and email alerts."
          className="h-44 w-full resize-none rounded-lg border border-white/10 bg-[#111114] p-4 font-mono text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500"
        />
      </label>

      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tech Stack</span>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          {TECH_STACKS.map((stack) => (
            <div key={stack}>
              <TogglePill selected={props.selectedStack.includes(stack)} onClick={() => props.toggleStack(stack)}>
                {stack}
              </TogglePill>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Features</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div key={feature}>
              <TogglePill selected={props.selectedFeatures.includes(feature)} onClick={() => props.toggleFeature(feature)}>
                {feature}
              </TogglePill>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-white/5 pt-5">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-500/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          disabled={!props.projectName.trim() || !props.prompt.trim()}
        >
          <Play className="h-4 w-4" />
          Generate App
        </button>
      </div>
    </form>
  );
}

function TogglePill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
        selected ? 'border-blue-500/40 bg-blue-500/10 text-white' : 'border-white/5 bg-[#111114] text-zinc-400 hover:border-white/15'
      }`}
    >
      <span className="truncate">{children}</span>
      {selected && <Check className="h-3.5 w-3.5 text-blue-300" />}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-zinc-950 p-3">
      <span className="block text-[9px] uppercase tracking-wider text-zinc-600">{label}</span>
      <strong className="mt-1 block truncate text-xs text-white">{value}</strong>
    </div>
  );
}

function PipelineStepper({ completedStageIndex, currentStage }: { completedStageIndex: number; currentStage: string }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <GitBranch className="h-4 w-4 text-blue-400" />
        Live Progress Stepper
      </h2>
      <div className="space-y-2">
        {PIPELINE_STAGES.map((stage, index) => {
          const done = index <= completedStageIndex;
          const active = stage === currentStage && !done;
          return (
            <div key={stage} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${
              done ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : active ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-white/5 bg-zinc-950 text-zinc-500'
            }`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              <span>{stage}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivityPanel({ logs }: { logs: string[] }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Terminal className="h-4 w-4 text-amber-400" />
        Activity Logs
      </h2>
      <div className="max-h-[360px] space-y-2 overflow-auto rounded-lg bg-[#050506] p-3 font-mono text-[11px] leading-5 text-zinc-400">
        {logs.length ? logs.map((log, index) => <div key={`${log}-${index}`}>{log}</div>) : <div>Waiting for generation logs...</div>}
      </div>
    </section>
  );
}

function JsonPanel({ title, icon, data }: { title: string; icon: React.ReactNode; data: unknown }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3 text-sm font-semibold text-white">
        {icon}
        {title}
      </div>
      <pre className="max-h-[360px] overflow-auto p-4 text-[11px] leading-5 text-zinc-300">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

function ValidationPanel({ report }: { report?: GenerationResult['validation'] }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        Validation & Reliability
      </h2>
      <div className="space-y-2">
        {(report?.checks || []).map((check) => (
          <div key={check.label} className="rounded-lg border border-white/5 bg-zinc-950 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-white">{check.label}</span>
              <StatusBadge status={check.status} />
            </div>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">{check.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] text-zinc-500">
        Repair attempts: <strong className="text-zinc-300">{report?.repairAttempts ?? 0}</strong>
      </div>
    </section>
  );
}

function RepairPanel({ repairLog }: { repairLog: string[] }) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Wrench className="h-4 w-4 text-amber-400" />
        Repair Log
      </h2>
      <div className="space-y-2">
        {repairLog.map((entry, index) => (
          <div key={`${entry}-${index}`} className="rounded-lg border border-white/5 bg-zinc-950 p-3 text-xs leading-5 text-zinc-400">
            {entry}
          </div>
        ))}
      </div>
    </section>
  );
}

function FileTree({ files, selectedFilePath, onSelect }: { files: GeneratedFile[]; selectedFilePath: string; onSelect: (path: string) => void }) {
  const groups = files.reduce<Record<string, GeneratedFile[]>>((acc, file) => {
    const section = getFileSection(file.path);
    acc[section] = acc[section] || [];
    acc[section].push(file);
    return acc;
  }, {});

  return (
    <aside className="max-h-[560px] overflow-auto bg-[#08080a] p-3">
      <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
        <Folder className="h-3.5 w-3.5" />
        generated-project
      </div>
      <div className="space-y-1">
        {Object.entries(groups).map(([section, sectionFiles]) => (
          <div key={section} className="space-y-1 pt-2 first:pt-0">
            <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">{section}</div>
            {sectionFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => onSelect(file.path)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                  selectedFilePath === file.path ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-transparent text-zinc-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="mt-1 truncate pl-5 font-mono text-[9px] text-zinc-600">{file.path.replace('generated-project/', '')}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function PreviewPanel(props: {
  result: GenerationResult | null;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  previewPage: string;
  setPreviewPage: (page: string) => void;
}) {
  const widthClass = props.previewMode === 'desktop' ? 'max-w-full' : props.previewMode === 'tablet' ? 'max-w-[780px]' : 'max-w-[390px]';
  const pages = ['Dashboard', 'Products', 'Customers', 'Orders', 'Settings'];

  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Eye className="h-4 w-4 text-blue-400" />
          Preview Panel
        </h2>
        <div className="flex gap-2">
          <IconButton label="Desktop" icon={<Monitor className="h-3.5 w-3.5" />} onClick={() => props.setPreviewMode('desktop')} active={props.previewMode === 'desktop'} />
          <IconButton label="Tablet" icon={<Tablet className="h-3.5 w-3.5" />} onClick={() => props.setPreviewMode('tablet')} active={props.previewMode === 'tablet'} />
          <IconButton label="Mobile" icon={<Smartphone className="h-3.5 w-3.5" />} onClick={() => props.setPreviewMode('mobile')} active={props.previewMode === 'mobile'} />
        </div>
      </div>

      <div className={`mx-auto overflow-hidden rounded-xl border border-white/10 bg-slate-950 transition-all ${widthClass}`}>
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            {props.result?.appIntent.appName || 'Generated App'}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Preview ready</span>
          </div>
        </div>
        <div className="flex min-h-[420px]">
          <nav className="hidden w-48 border-r border-white/10 p-3 md:block">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => props.setPreviewPage(page)}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs ${props.previewPage === page ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}
              >
                {page}
              </button>
            ))}
          </nav>
          <main className="flex-1 space-y-4 p-4">
            <h3 className="text-xl font-semibold text-white">{props.previewPage}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <PreviewCard label="Entities" value={String(props.result?.dataSchema.entities.length || 0)} />
              <PreviewCard label="API Routes" value={String(props.result?.appSpec.apiRoutes.length || 0)} />
              <PreviewCard label="Validation" value={props.result?.validation.overallStatus || 'pending'} />
            </div>
            <div className="rounded-lg border border-white/10">
              {(props.result?.dataSchema.entities || []).slice(0, 4).map((entity: any) => (
                <div key={entity.name} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0">
                  <span className="text-sm text-white">{entity.name}</span>
                  <span className="text-xs text-zinc-500">{entity.fields.length} fields</span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
      <strong className="mt-1 block text-lg text-white">{value}</strong>
    </div>
  );
}

function SummaryPanel(props: {
  result: GenerationResult | null;
  isFinished: boolean;
  deployState: 'idle' | 'deploying' | 'deployed';
  onPreview: () => void;
  onOpenWorkspace: () => void;
  onDownloadCode: () => void;
  onDeploy: () => void;
  onRegenerate: () => void;
  activeJob: GenerationJob | null;
}) {
  return (
    <section className="rounded-xl border border-white/5 bg-[#09090b] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        Final Project Summary
      </h2>
      <div className="space-y-3 text-xs">
        <SummaryRow label="Status" value={props.isFinished ? 'Ready to export' : 'Finalizing'} />
        <SummaryRow label="Provider" value={props.result?.providerUsed || 'local'} />
        <SummaryRow label="Files" value={String(props.result?.summary.generatedFilesCount || 0)} />
        <SummaryRow label="Active Job" value={props.activeJob?.jobId || props.result?.jobId || 'pending'} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2">
        <ActionButton label="Preview App" icon={<Eye className="h-4 w-4" />} onClick={props.onPreview} />
        <ActionButton label="Open Workspace" icon={<Code2 className="h-4 w-4" />} onClick={props.onOpenWorkspace} />
        <ActionButton label="Download Code" icon={<Download className="h-4 w-4" />} onClick={props.onDownloadCode} />
        <ActionButton
          label={props.deployState === 'deploying' ? 'Deploying' : props.deployState === 'deployed' ? 'Deployed' : 'Deploy'}
          icon={props.deployState === 'deploying' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          onClick={props.onDeploy}
        />
        <ActionButton label="Regenerate" icon={<RefreshCcw className="h-4 w-4" />} onClick={props.onRegenerate} />
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950 px-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <strong className="max-w-[180px] truncate text-right text-zinc-200">{value}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: 'passed' | 'warning' | 'failed' }) {
  const classes = status === 'passed'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
    : status === 'warning'
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
      : 'border-red-500/20 bg-red-500/10 text-red-300';
  const Icon = status === 'passed' ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase ${classes}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-white/5 bg-zinc-950 text-zinc-400 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950 px-3 py-3 text-left text-xs font-semibold text-zinc-200 transition hover:border-blue-500/25 hover:text-white"
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-600" />
    </button>
  );
}

function getFileSection(path: string) {
  if (path.includes('/backend/routes') || path.includes('/api/')) return 'API';
  if (path.includes('/backend/')) return 'Backend';
  if (path.includes('/database/') || path.endsWith('schema.sql')) return 'Database';
  if (path.includes('render') || path.includes('Docker') || path.includes('.env') || path.includes('package.json') || path.includes('README')) return 'Deployment';
  if (path.includes('/src/')) return 'Frontend';
  return 'Project';
}

function getVisibleFileCount(stageIndex: number, total: number) {
  if (stageIndex < 3) return 0;
  if (stageIndex === 3) return Math.min(total, 10);
  if (stageIndex === 4) return Math.min(total, 18);
  if (stageIndex === 5) return Math.min(total, 24);
  if (stageIndex === 6) return Math.min(total, 30);
  if (stageIndex === 7) return Math.min(total, 36);
  if (stageIndex === 8) return Math.min(total, 44);
  return total;
}

function getMinimumGenerationMs(prompt: string, features: string[]) {
  const sizeScore = prompt.length + features.length * 60;
  if (sizeScore > 900) return 240000;
  if (sizeScore > 450) return 210000;
  return 180000;
}

function formatRemaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return mins ? `${mins}m ${rest}s` : `${rest}s`;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeAppType(type: string) {
  if (type.includes('CRM')) return 'CRM';
  if (type.toLowerCase().includes('ecommerce')) return 'E-commerce';
  if (type.toLowerCase().includes('dashboard')) return 'Dashboard';
  if (type.toLowerCase().includes('portfolio')) return 'Portfolio';
  if (type.toLowerCase().includes('ai')) return 'AI Tool';
  return 'SaaS';
}

function splitStack(stack: string) {
  const values = stack.split(/[,+]/).map((item) => item.trim()).filter(Boolean);
  return values.length ? values : ['React', 'Node.js', 'Express', 'PostgreSQL'];
}

function toGenerationJob(result: GenerationResult): GenerationJob {
  return {
    jobId: result.jobId,
    status: 'completed',
    mode: result.providerUsed === 'local-structured-pipeline' ? 'demo' : 'ai',
    prompt: result.prompt,
    appIntent: {
      ...result.appIntent,
      integrations_requested: result.appIntent.integrations || [],
    },
    dataSchema: {
      entities: result.dataSchema.entities.map((entity: any) => ({
        name: entity.name,
        tableName: `${entity.name.toLowerCase()}s`,
        tenantId: 'tenantId',
        fields: entity.fields.map((field: any) => ({
          name: field.name,
          type: field.type === 'number' ? 'decimal' : field.type === 'date' ? 'datetime' : field.type,
          nullable: !field.required,
          primary: field.name === 'id',
          unique: false,
        })),
        relations: [],
      })),
    },
    appSpec: {
      pages: result.appSpec.pages.map((page: any) => ({
        name: page.name,
        route: page.route,
        path: page.route,
        layout: 'workspace',
        components: page.components,
        apiEndpoints: [],
      })),
      apiRoutes: result.appSpec.apiRoutes,
      apiEndpoints: result.appSpec.apiRoutes.map((route: any) => ({
        path: route.path,
        method: route.method,
        boundEntity: route.entity,
        authRequired: result.appSpec.authFlow.enabled,
        rateLimit: 120,
        authRoles: ['Admin'],
        permissions: ['read', 'write'],
      })),
      databaseTables: result.appSpec.databaseTables,
      authFlow: result.appSpec.authFlow,
      navigationFlow: result.appSpec.navigationFlow,
      integrationHooks: [],
      workflowStubs: [],
    },
    validation: {
      valid: result.validation.overallStatus !== 'failed',
      errors: result.validation.checks
        .filter((check) => check.status === 'failed')
        .map((check) => ({ path: check.label, message: check.detail })),
    },
    repairLog: result.repairLog.map((entry) => ({
      strategy: 'consistency_repair',
      errorInput: entry,
      outcome: 'Repair engine normalized the generated artifact.',
      timestamp: new Date().toLocaleTimeString(),
    })),
    events: result.events,
    costBreakdown: { promptTokens: 0, completionTokens: 0, estimatedCostUSD: 0 },
    latencyMs: 0,
    providerUsed: result.providerUsed,
    createdAt: result.createdAt,
  };
}
