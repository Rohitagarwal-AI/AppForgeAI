import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Globe, Github, 
  Download, Play, CheckCircle2, XCircle, Loader2, Sparkles, 
  AlertTriangle, ExternalLink, RefreshCw, Layers, Check, ArrowRight,
  ChevronRight, Clock, FileText, LayoutGrid, Cpu, Network, KanbanSquare, GitBranch, Terminal
} from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import GitStatus from './GitStatus';
import LocalBridgeSetup from './LocalBridgeSetup';
import { ProjectTask, Commit } from '../types';

export interface ProjectEntry {
  id: string;
  name: string;
  type: string;
  techStack: string;
  features: string[];
  status: 'Deployed' | 'Building' | 'Failed';
  progress?: number;
  generatedFilesCount?: number;
  lastUpdated: string;
  liveUrl: string;
  githubRepo: string;
  isCustom?: boolean;
  appSpec?: any;
  backlog?: ProjectTask[];
  commits?: Commit[];
}

interface ProjectsPageProps {
  projectsList: ProjectEntry[];
  setProjectsList: React.Dispatch<React.SetStateAction<ProjectEntry[]>>;
  onNavigateToGenerate: () => void;
  selectedProject: ProjectEntry | null;
  setSelectedProject: (proj: ProjectEntry | null) => void;
  activityLogs: any[];
  onAddActivityLog: (title: string, desc: string, category: 'generation' | 'build' | 'integration' | 'deployment' | 'system', status: 'success' | 'running' | 'failed' | 'info') => void;
}

export default function ProjectsPage({ 
  projectsList, 
  setProjectsList, 
  onNavigateToGenerate, 
  selectedProject, 
  setSelectedProject,
  activityLogs,
  onAddActivityLog
}: ProjectsPageProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Deployed' | 'Building' | 'Failed'>('All');
  
  // Workspace Detail Board sub-panel tab
  const [detailTab, setDetailTab] = useState<'specs' | 'backlog' | 'git' | 'bridge'>('specs');

  // Deployment Simulation State
  const [deployingProject, setDeployingProject] = useState<ProjectEntry | null>(null);
  const [deployStepIndex, setDeployStepIndex] = useState(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  
  // Edit Metadata Modal
  const [editingProject, setEditingProject] = useState<ProjectEntry | null>(null);
  const [editName, setEditName] = useState('');
  const [editTechStack, setEditTechStack] = useState('React + Express');
  const [editType, setEditType] = useState('SaaS Suite');

  // Custom non-blocking confirmation dialog state
  const [projectToDelete, setProjectToDelete] = useState<ProjectEntry | null>(null);

  // Mini SparkToast Notification State
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Sync projects state to LocalStorage and server-side DB
  const syncWithBackend = async (data: ProjectEntry[]) => {
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: data })
      });
    } catch (err) {
      console.error('Failed to sync projects list with backend:', err);
    }
  };

  // Deployment steps
  const DEPLOY_STEPS = [
    { text: 'Starting deployment sequence...', duration: 500 },
    { text: 'Spinning up multi-tenant isolated runtime container on serverless node...', duration: 700 },
    { text: 'Resolving ES Module packages and checking AST bounds...', duration: 800 },
    { text: 'Stitching relational database tables & binding isolated tenantId schemas...', duration: 600 },
    { text: 'Deploying statics client assets to worldwide edge CDN routers...', duration: 600 },
    { text: 'Deployment finalized! Standboxed app is live on HTTPS route.', duration: 400 }
  ];

  const handleDeploy = (project: ProjectEntry) => {
    setDeployingProject(project);
    setDeployStepIndex(0);
    setDeployLogs(['[00:00:01] INITIATING SECURE EDGE DEPLOYMENT']);
    
    // Log build trigger in global audit logs
    onAddActivityLog(
      `Compiler pipeline triggered for ${project.name}`,
      `Synthesizing source trees and preparing MicroVM runtime container.`,
      'build',
      'running'
    );

    // Optimistically update status to Building
    const updated = projectsList.map(p => p.id === project.id ? { ...p, status: 'Building' as const, lastUpdated: 'Just now' } : p);
    setProjectsList(updated);
    localStorage.setItem('appforge_projects_list', JSON.stringify(updated));
    syncWithBackend(updated);
    
    let currentStep = 0;
    const runStep = () => {
      if (currentStep < DEPLOY_STEPS.length) {
        const step = DEPLOY_STEPS[currentStep];
        setTimeout(() => {
          setDeployLogs(prev => [...prev, `[DEPLOY_DAEMON] ${step.text}`]);
          setDeployStepIndex(currentStep + 1);
          currentStep++;
          runStep();
        }, step.duration);
      } else {
        setTimeout(() => {
          const finalUpdated = projectsList.map(p => p.id === project.id ? { ...p, status: 'Deployed' as const, lastUpdated: 'Just now' } : p);
          setProjectsList(finalUpdated);
          localStorage.setItem('appforge_projects_list', JSON.stringify(finalUpdated));
          syncWithBackend(finalUpdated);

          onAddActivityLog(
            `${project.name} deployed live`,
            `Pushed production-ready builds to global edge proxy servers at ${project.liveUrl}`,
            'deployment',
            'success'
          );

          triggerToast(`🚀 ${project.name} successfully deployed and live!`);
          setDeployingProject(null);
          
          // If deployed project was selected, sync selected object as well
          if (selectedProject && selectedProject.id === project.id) {
            setSelectedProject({ ...selectedProject, status: 'Deployed', lastUpdated: 'Just now' });
          }
        }, 400);
      }
    };

    runStep();
  };

  const handleDelete = (id: string, name: string) => {
    const proj = projectsList.find(p => p.id === id);
    if (proj) {
      setProjectToDelete(proj);
    }
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    const { id, name } = projectToDelete;
    const updated = projectsList.filter(p => p.id !== id);
    setProjectsList(updated);
    localStorage.setItem('appforge_projects_list', JSON.stringify(updated));
    syncWithBackend(updated);

    onAddActivityLog(
      `Project "${name}" removed`,
      `Dismounted cloud database volumes and purged compiled routing gateways.`,
      'system',
      'info'
    );

    triggerToast(`🗑️ "${name}" successfully deleted.`);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
    setProjectToDelete(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const updated = projectsList.map(p => {
      if (p.id === editingProject.id) {
        return {
          ...p,
          name: editName,
          techStack: editTechStack,
          type: editType,
          lastUpdated: 'Just now'
        };
      }
      return p;
    });

    setProjectsList(updated);
    localStorage.setItem('appforge_projects_list', JSON.stringify(updated));
    syncWithBackend(updated);

    onAddActivityLog(
      `Project metadata updated: ${editName}`,
      `Calibrated compilation stack to ${editTechStack} under categories: ${editType}.`,
      'system',
      'info'
    );

    triggerToast(`✏️ Updated definitions for ${editName}`);
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject({
        ...selectedProject,
        name: editName,
        techStack: editTechStack,
        type: editType,
        lastUpdated: 'Just now'
      });
    }
    setEditingProject(null);
  };

  const handleDownloadSpec = (proj: ProjectEntry) => {
    const specPayload = proj.appSpec || {
      projectName: proj.name.toLowerCase().replace(/\s+/g, '-'),
      creator: 'developer@appforge.ai',
      compiledStack: proj.techStack,
      appCategory: proj.type,
      compilerSignature: 'AppForge Node v1.2.0-stable',
      blueprint: {
        activeModules: proj.features,
        tenantSecurityField: 'tenantId',
        isMultiTenantCompliant: true,
        staticLiveEndpoint: proj.liveUrl
      }
    };
    const blob = new Blob([JSON.stringify(specPayload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${proj.name.toLowerCase().replace(/\s+/g, '-')}-spec.json`;
    link.click();
    triggerToast(`💾 File ${proj.name.toLowerCase().replace(/\s+/g, '-')}-spec.json downloaded successfully!`);
  };

  const filteredProjects = projectsList.filter(proj => {
    const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          proj.techStack.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proj.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && proj.status === statusFilter;
  });

  // Default tasks if none is set
  const getDefaultTasks = (proj: ProjectEntry): ProjectTask[] => {
    return proj.backlog || [
      { id: `${proj.id}-t1`, title: 'Verify Multi-Tenant isolation fields', description: `Check that Zod schemas contain the tenant security field constraints in ${proj.name}.`, priority: 'High', status: 'In Progress', category: 'Database Rules', createdAt: new Date(Date.now() - 36000000).toISOString() },
      { id: `${proj.id}-t2`, title: 'Compile customized webhook API routers', description: 'Attach Slack notifications hooks payloads schema matching metadata prompts.', priority: 'Medium', status: 'Backlog', category: 'Integrations', createdAt: new Date(Date.now() - 50000000).toISOString() },
      { id: `${proj.id}-t3`, title: 'Initial source file routing scaffolds', description: 'Generated static page components framework configured securely with layout margins.', priority: 'Low', status: 'Done', category: 'UI Scaffold', createdAt: new Date(Date.now() - 72000000).toISOString() }
    ];
  };

  // Default commits if none is set
  const getDefaultCommits = (proj: ProjectEntry): Commit[] => {
    return proj.commits || [
      { hash: '7c8a2b5d4f1a', author: 'developer@appforge.ai', date: new Date(Date.now() - 3600000).toISOString(), message: `Feat: scaffold production controllers bundle matching ${proj.name} specs.` },
      { hash: 'e29c11a566bd', author: 'developer@appforge.ai', date: new Date(Date.now() - 7200000).toISOString(), message: 'Refactor: isolate relational schemas check and Zod validator rules.' },
      { hash: '09abff0a1122', author: 'system-compiler', date: new Date(Date.now() - 14400000).toISOString(), message: 'Chore: initial multitenant framework initialization checks passed.' }
    ];
  };

  // Task controllers for selected board
  const handleUpdateTaskInProject = (taskId: string, status: ProjectTask['status']) => {
    if (!selectedProject) return;
    const currentTasks = getDefaultTasks(selectedProject);
    const updatedTasks = currentTasks.map(t => t.id === taskId ? { ...t, status } : t);
    
    const updatedProjects = projectsList.map(p => p.id === selectedProject.id ? { ...p, backlog: updatedTasks } : p);
    setProjectsList(updatedProjects);
    localStorage.setItem('appforge_projects_list', JSON.stringify(updatedProjects));
    syncWithBackend(updatedProjects);
    setSelectedProject({ ...selectedProject, backlog: updatedTasks });
    triggerToast('Sprint card status updated!');
  };

  const handleCreateTaskInProject = (task: { title: string; description: string; priority: ProjectTask['priority']; category: string }) => {
    if (!selectedProject) return;
    const currentTasks = getDefaultTasks(selectedProject);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'Backlog',
      category: task.category,
      createdAt: new Date().toISOString()
    };
    const updatedTasks = [...currentTasks, newTask];
    
    const updatedProjects = projectsList.map(p => p.id === selectedProject.id ? { ...p, backlog: updatedTasks } : p);
    setProjectsList(updatedProjects);
    localStorage.setItem('appforge_projects_list', JSON.stringify(updatedProjects));
    syncWithBackend(updatedProjects);
    setSelectedProject({ ...selectedProject, backlog: updatedTasks });
    triggerToast('Sprint card successfully scheduled!');
  };

  const handleLocalBridgeReset = () => {
    triggerToast('🔄 Diagnostic signal sent! Bridge connection socket reset.');
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans text-xs">
      
      {/* Top Banner Sparkles */}
      {toast && (
        <div className="fixed top-24 right-8 z-[9999] bg-[#0c0c0e]/95 border border-blue-500/30 text-white font-mono text-[11px] px-4.5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4.5 h-4.5 text-blue-400 animate-pulse animate-bounce" />
          <span>{toast}</span>
        </div>
      )}

      {/* MASTER SELECTED PROJECT DETAIL VIEW */}
      {selectedProject ? (
        <div className="space-y-6 animate-fade-in relative text-left">
          
          {/* Breadcrumbs Action bar */}
          <div className="flex items-center justify-between bg-[#0a0a0c] border border-white/5 p-3 px-5 rounded-lg">
            <button 
              onClick={() => setSelectedProject(null)}
              className="text-[#1e90ff] hover:text-white transition-colors uppercase font-mono font-bold tracking-widest text-[9.5px] py-1 flex items-center gap-1.5 cursor-pointer"
            >
              ← Back to Projects Catalog
            </button>
            <span className="text-zinc-650 font-mono text-[10px] select-none">
              Project UUID: <strong className="text-zinc-400">{selectedProject.id}</strong>
            </span>
          </div>

          {/* Project Header workspace Info card */}
          <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[9px] bg-white/5 border border-white/5 text-zinc-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                  {selectedProject.type}
                </span>

                <div className="font-mono text-[9px] uppercase tracking-wider select-none">
                  {selectedProject.status === 'Deployed' && (
                    <span className="flex items-center gap-1.5 bg-emerald-950/20 text-emerald-404 border border-emerald-550/15 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-[#30d158] rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                  {selectedProject.status === 'Building' && (
                    <span className="flex items-center gap-1.5 bg-blue-950/20 text-blue-400 border border-blue-550/15 px-2.5 py-0.5 rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                      Compiling
                    </span>
                  )}
                  {selectedProject.status === 'Failed' && (
                    <span className="flex items-center gap-1.5 bg-red-950/25 text-red-400 border border-red-550/20 px-2.5 py-0.5 rounded-full">
                      Failed
                    </span>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-medium tracking-tight text-white">{selectedProject.name}</h2>
              <p className="text-xs text-zinc-400 max-w-xl">
                Active compiler framework: <code className="bg-zinc-950 px-1.2 py-0.5 border border-white/5 text-[#ffa116] rounded font-mono text-[10.5px] font-bold">{selectedProject.techStack}</code>. Updated {selectedProject.lastUpdated}.
              </p>
            </div>

            {/* Quick header action links */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => handleDeploy(selectedProject)}
                disabled={selectedProject.status === 'Building'}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10.5px] uppercase tracking-wider px-4.5 py-2.5 rounded-lg flex items-center gap-1.8 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Deploy App
              </button>
              
              <button 
                onClick={() => handleDownloadSpec(selectedProject)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-330 border border-white/8 hover:text-white font-bold text-[10.5px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg flex items-center justify-center cursor-pointer"
                title="Download JSON Spec File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-tabs Board Selector */}
          <div className="flex border-b border-white/5 font-mono text-[11px] bg-[#0c0c0f] p-1 rounded-lg">
            {([
              { id: 'specs', label: 'Models & Specifications', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'backlog', label: 'Agile Kanban Board', icon: <KanbanSquare className="w-3.5 h-3.5" /> },
              { id: 'git', label: 'Branch Commit Logs', icon: <GitBranch className="w-3.5 h-3.5" /> },
              { id: 'bridge', label: 'Local Daemon Bridge', icon: <Terminal className="w-3.5 h-3.5" /> }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex-1 py-3 px-3.5 rounded flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  detailTab === tab.id 
                    ? 'bg-zinc-900 border border-white/5 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Subtab Contents Render */}
          <div className="bg-[#09090c] border border-white/5 p-6 rounded-xl min-h-[350px]">
            
            {/* 1. Models & Specifications tab */}
            {detailTab === 'specs' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="space-y-1 border-b border-white/5 pb-2">
                  <h3 className="text-white text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ffa116]" />
                    AppSpec Generation Blueprints
                  </h3>
                  <p className="text-xs text-zinc-500">Relational schemas, page controllers, and integrations requested in prompt.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-[11px]">
                  
                  {/* Left Specs parameters */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-zinc-950/60 p-5 rounded-lg border border-white/5 space-y-3">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block leading-normal">
                        Active Modules
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.features.map((feat, index) => (
                          <span 
                            key={index}
                            className="bg-zinc-900 border border-zinc-805 text-zinc-300 px-3 py-1 rounded-md text-[10.5px] font-medium flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* API Endpoints & Routes */}
                    <div className="bg-zinc-950/60 p-5 rounded-lg border border-white/5 space-y-3.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block leading-normal">
                        Engine Relational Schema structures
                      </span>
                      <div className="space-y-2 font-sans text-xs text-zinc-400">
                        <div className="p-3 bg-zinc-900/60 rounded border border-white/5 flex justify-between items-center font-mono">
                          <div>
                            <span className="text-white font-bold block text-[11px]">User Scope Model</span>
                            <span className="text-[10px] text-zinc-550 leading-normal">relational entity object</span>
                          </div>
                          <span className="text-[9.5px] bg-[#1e90ff]/10 text-[#1e90ff] px-2 py-0.5 border border-[#1e90ff]/20 rounded font-bold">tenantId bound</span>
                        </div>
                        <div className="p-3 bg-zinc-900/60 rounded border border-white/5 flex justify-between items-center font-mono">
                          <div>
                            <span className="text-white font-bold block text-[11px]">Transactional Records Ledger</span>
                            <span className="text-[10px] text-zinc-550 leading-normal">relational entity object</span>
                          </div>
                          <span className="text-[9.5px] bg-[#1e90ff]/10 text-[#1e90ff] px-2 py-0.5 border border-[#1e90ff]/20 rounded font-bold">tenantId bound</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side specs code block */}
                  <div className="bg-zinc-950 border border-white/5 rounded-lg p-4.5 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      <span className="text-[9.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                        AppSpec JSON signature
                      </span>
                      <pre className="text-[10px] leading-relaxed text-[#eee] font-mono whitespace-pre-wrap select-all max-h-56 overflow-y-auto bg-black/50 p-3.5 rounded border border-white/5">
{`{
  "projectName": "${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}",
  "type": "${selectedProject.type}",
  "compilerVersion": "AppForge v1.2.0",
  "blueprint": {
    "isMultiTenant": true,
    "tenantIsolation": "tenantId",
    "featuresCount": ${selectedProject.features.length}
  }
}`}
                      </pre>
                    </div>

                    <p className="text-[10.5px] font-sans text-zinc-500 pt-4 leading-relaxed border-t border-white/5">
                      This AppSpec signature is parsed securely by the AppForge neural compiler to build precise typesafe layouts and microservices automatically.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* 2. Agile Kanban backlogs */}
            {detailTab === 'backlog' && (
              <div className="animate-fade-in text-left">
                <KanbanBoard 
                  tasks={getDefaultTasks(selectedProject)}
                  onUpdateTaskStatus={handleUpdateTaskInProject}
                  onCreateTask={handleCreateTaskInProject}
                />
              </div>
            )}

            {/* 3. Commit Logs */}
            {detailTab === 'git' && (
              <div className="animate-fade-in text-left">
                <GitStatus 
                  commits={getDefaultCommits(selectedProject)}
                  activeBranch="main"
                />
              </div>
            )}

            {/* 4. Desktop terminal bridge sync */}
            {detailTab === 'bridge' && (
              <div className="animate-fade-in text-left">
                <LocalBridgeSetup 
                  bridge={{
                    connected: false,
                    hostname: 'Awaiting client daemon connection',
                    os: 'Mac/Linux OS runtime',
                    cpuModel: 'Intel/M-series architectures',
                    agentVersion: 'v1.2.0-stable',
                    lastSync: null
                  }}
                  projectName={selectedProject.name.toLowerCase().replace(/\s+/g, '-')}
                  onRefresh={() => triggerToast('Checking connection daemon heartbeat...')}
                  onReset={handleLocalBridgeReset}
                />
              </div>
            )}

          </div>

        </div>
      ) : (
        /* STANDARD PROJECTS LIST VIEW */
        <div className="space-y-6 text-left select-none animate-fade-in">
          
          {/* Header Panel */}
          <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="space-y-1">
              <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                SaaS Projects Hub
              </h2>
              <p className="text-xs text-zinc-400">
                Central catalog. Manage compiled specs, test Sandboxed API endpoints, or spin docker executions direct.
              </p>
            </div>

            <button 
              onClick={onNavigateToGenerate}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider px-4.5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Software
            </button>
          </div>

          {/* Filter search panels */}
          <div className="flex flex-col md:flex-row items-center gap-3 bg-[#0a0a0c] border border-white/5 p-4 rounded-lg">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search projects in catalog..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/5 pl-10 pr-4 py-2.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Categorizations buttons */}
            <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-white/5 p-1 rounded-lg shrink-0 w-full md:w-auto overflow-x-auto">
              {(['All', 'Deployed', 'Building', 'Failed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-all ${
                    statusFilter === filter 
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/10' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Main Cards grids list */}
          {filteredProjects.length === 0 ? (
            <div className="border border-dashed border-white/5 rounded-xl p-16 text-center space-y-4 bg-zinc-900/10">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-500">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-xs font-medium">No active packages found matching query</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Expand query keyword or go directly to trigger the prompt spec build engine.
                </p>
              </div>
              <button 
                onClick={onNavigateToGenerate}
                className="text-[10px] uppercase tracking-wider font-bold text-blue-400 hover:text-blue-300 transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
              >
                Launch Builder Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => (
                <div 
                  key={proj.id}
                  className="bg-[#09090c] border border-white/5 hover:border-white/10 rounded-xl p-5.5 space-y-5 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Header profile */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 truncate">
                        <span className="text-[9px] bg-white/5 border border-white/5 text-zinc-400 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                          {proj.type}
                        </span>
                        <h3 className="text-white text-[14px] font-semibold tracking-tight pt-1 truncate group-hover:text-[#1e90ff] transition-colors">{proj.name}</h3>
                      </div>

                      {/* Status indicator bubble */}
                      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider shrink-0 select-none">
                        {proj.status === 'Deployed' && (
                          <span className="flex items-center gap-1.5 bg-emerald-950/20 text-emerald-404 border border-emerald-550/15 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-[#30d158] rounded-full animate-pulse shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
                            Live
                          </span>
                        )}
                        {proj.status === 'Building' && (
                          <span className="flex items-center gap-1.5 bg-blue-950/20 text-blue-400 border border-blue-550/15 px-2 py-0.5 rounded-full">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-400 animate-pulse" />
                            Compiling
                          </span>
                        )}
                        {proj.status === 'Failed' && (
                          <span className="flex items-center gap-1.5 bg-red-950/25 text-red-500 border border-red-550/20 px-2 py-0.5 rounded-full">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tech details */}
                    <div className="grid grid-cols-2 py-2 px-3.5 bg-zinc-950/50 rounded-lg border border-white/5 text-[10px] font-mono leading-relaxed">
                      <div>
                        <span className="text-zinc-500 block uppercase text-[8px] tracking-wider font-bold">microservices stack</span>
                        <span className="text-blue-400 font-bold">{proj.techStack}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase text-[8px] tracking-wider font-bold">last synched</span>
                        <span className="text-zinc-300">{proj.lastUpdated}</span>
                      </div>
                    </div>

                    {/* Modules Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block font-mono">active integration modules</span>
                      <div className="flex flex-wrap gap-1.2">
                        {proj.features.map((feat, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] bg-zinc-950 border border-white/5 text-zinc-350 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-blue-400 rounded-full" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Toolbar action buttons strip */}
                  <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-3.5">
                    <div className="flex items-center gap-2.5 text-zinc-500 font-mono text-[10px]">
                      <span className="text-[#13c178] hover:underline cursor-pointer flex items-center gap-1" onClick={() => setSelectedProject(proj)}>
                        Configure workspace
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* deploy card compiler */}
                      <button 
                        onClick={() => handleDeploy(proj)}
                        disabled={proj.status === 'Building'}
                        className="hover:text-blue-400 hover:bg-white/5 p-2 rounded-md cursor-pointer transition-all"
                        title="Compile and Deploy"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Download custom AppSpec JSON file */}
                      <button 
                        onClick={() => handleDownloadSpec(proj)}
                        className="hover:text-emerald-400 hover:bg-white/5 p-2 rounded-md cursor-pointer transition-all"
                        title="Download AppSpec Contract"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* edit configurations */}
                      <button 
                        onClick={() => {
                          setEditingProject(proj);
                          setEditName(proj.name);
                          setEditTechStack(proj.techStack);
                          setEditType(proj.type);
                        }}
                        className="hover:text-indigo-400 hover:bg-white/5 p-2 rounded-md cursor-pointer transition-all"
                        title="Update Metadata Names"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* delete card */}
                      <button 
                        onClick={() => handleDelete(proj.id, proj.name)}
                        className="hover:text-red-400 hover:bg-white/5 p-2 rounded-md cursor-pointer transition-all"
                        title="Purge Spec Bundle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* DEPLOY SIMULATOR DIALOG */}
      {deployingProject && (
        <div className="fixed inset-0 bg-black/80 z-[9999] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-white/10 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative select-none">
            <div className="p-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <h3 className="text-white text-sm font-semibold tracking-tight">Deploying {deployingProject.name}...</h3>
                  <p className="text-xs text-zinc-400">Compiler is currently building and auditing files tree schema structures.</p>
                </div>
              </div>

              {/* Progress step */}
              <div className="space-y-1.5 font-mono text-[9px] uppercase tracking-wider">
                <div className="flex justify-between text-zinc-500">
                  <span>Compilation thread percentage</span>
                  <span>{Math.round(((deployStepIndex) / DEPLOY_STEPS.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5 p-[2px]">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${((deployStepIndex) / DEPLOY_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Console log outputs */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-lg h-56 overflow-y-auto font-mono text-[10px] text-zinc-400 flex flex-col gap-1 pr-1.5 scrollbar-thin">
                {deployLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-zinc-600 mr-2">{String(idx + 1).padStart(2, '0')}</span>
                    {log.startsWith('[00') ? (
                      <span className="text-blue-400 font-bold">{log}</span>
                    ) : log.includes('successfully') || log.includes('finalized') ? (
                      <span className="text-emerald-400 font-semibold">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#050507] px-6 py-4 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setDeployingProject(null)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-[10.5px] uppercase tracking-widest font-bold font-mono transition-colors cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONFIG DIALOG */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/80 z-[9999] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c0f] border border-white/10 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative select-none">
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-5 text-left">
                <div className="space-y-1">
                  <h3 className="text-white text-md font-semibold tracking-tight">Configure metadata tags</h3>
                  <p className="text-xs text-zinc-400 font-sans mt-1">Calibrate configuration parameters used in multi-tenant environments.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[9.5px] uppercase font-bold tracking-widest text-[#ffa116] block font-mono">active project name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[9.5px] uppercase font-bold tracking-widest text-[#ffa116] block font-mono">app category classification</label>
                    <input 
                      type="text" 
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[9.5px] uppercase font-bold tracking-widest text-[#ffa116] block font-mono">microservice architecture</label>
                    <select
                      value={editTechStack}
                      onChange={(e) => setEditTechStack(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option>React + Express</option>
                      <option>Vite + FastAPI</option>
                      <option>Next.js + Tailwind</option>
                      <option>SvelteKit + Postgres</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#050507] px-6 py-4 border-t border-white/5 flex justify-end gap-3.5">
                <button 
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-[10.5px] uppercase tracking-widest font-bold font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-[10.5px] uppercase tracking-widest font-bold font-mono transition-colors cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE COHESIVE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[10000] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-red-500/20 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl shadow-black animate-fade-in animate-duration-150">
            <div className="p-6 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-red-500 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-red-400">Purge Contract Spec</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Are you absolutely sure you want to completely purge <span className="font-semibold text-white">"{projectToDelete.name}"</span>?
                  </p>
                </div>
              </div>

              <div className="bg-red-950/10 border border-red-950/30 rounded-lg p-3 text-[10px] text-red-400 leading-relaxed font-mono">
                ⚡ <strong className="text-red-300">WARNING:</strong> Purging this spec dismounts associated virtual machine routes, removes local schema definitions, and erases active developer sandbox caches permanently.
              </div>
            </div>

            <div className="bg-[#060608] px-6 py-4 border-t border-white/5 flex justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-[10.5px] uppercase tracking-widest font-bold transition-colors cursor-pointer"
              >
                Retain Spec
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg text-[10.5px] uppercase tracking-widest font-bold transition-colors cursor-pointer shadow-lg shadow-red-900/10"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
