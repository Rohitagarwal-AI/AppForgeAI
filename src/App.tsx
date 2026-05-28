import React, { useState, useEffect } from 'react';
import { AppForgeProject, ProjectTask, Commit, GenerationJob } from './types';
import LocalBridgeSetup from './components/LocalBridgeSetup';
import KanbanBoard from './components/KanbanBoard';
import GitStatus from './components/GitStatus';

import Dashboard from './components/Dashboard';
import GenerateApp from './components/GenerateApp';
import PipelineLogs from './components/PipelineLogs';
import IntegrationsTab from './components/IntegrationsTab';
import EvaluationLogs from './components/EvaluationLogs';
import CostAnalytics from './components/CostAnalytics';
import SettingsTab from './components/SettingsTab';
import FloatingAssistant from './components/assistant/FloatingAssistant';

import { 
  Briefcase, Terminal, GitCommit, Sparkles, Activity, 
  RefreshCw, GitBranch, ShieldCheck, Mail, Clock, HelpCircle, Wifi 
} from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<AppForgeProject | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'generate' | 'pipeline-logs' | 'integrations' | 'evaluations' | 'cost' | 'settings' | 'bridge' | 'backlog' | 'git'
  >('dashboard');
  const [time, setTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Track all generated blueprints in React State for historic visibility
  const [historyJobs, setHistoryJobs] = useState<GenerationJob[]>([]);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);

  // 1. Fetch live coordinates from standard endpoint
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/project');
      const data = await response.json();
      setProject(data);
    } catch (e) {
      console.error('Error fetching project coordinates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Setup active clock ticker adjusted for Indian Standard Time (IST)
    const clockInterval = setInterval(() => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      };
      setTime(new Date().toLocaleString('en-IN', options) + ' IST');
    }, 1000);

    // Dynamic auto-polling to fetch incoming sync changes from Node bridge client
    const pollInterval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, []);

  // Update backend database task listings
  const handleUpdateTaskStatus = async (taskId: string, status: ProjectTask['status']) => {
    try {
      const response = await fetch('/api/project/task/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status })
      });
      const data = await response.json();
      if (data.success) {
        // Optimistically update React State
        setProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            backlog: prev.backlog.map(t => t.id === taskId ? { ...t, status } : t)
          };
        });
      }
    } catch (e) {
      console.error('Error updating task status on backend:', e);
    }
  };

  // Add customized task to backend sprint board
  const handleCreateTask = async (task: { title: string; description: string; priority: ProjectTask['priority']; category: string }) => {
    try {
      const response = await fetch('/api/project/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const data = await response.json();
      if (data.success) {
        setProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            backlog: [...prev.backlog, data.newTask]
          };
        });
      }
    } catch (e) {
      console.error('Error creating new backlog task:', e);
    }
  };

  const handleResetBridge = async () => {
    try {
      const response = await fetch('/api/project/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchStatus();
      }
    } catch (e) {
      console.error('Error resetting sync connection:', e);
    }
  };

  // Callback list update when generator creates a new job spec
  const handleJobCreated = (job: GenerationJob) => {
    setHistoryJobs(prev => {
      const exists = prev.some(j => j.jobId === job.jobId);
      if (exists) {
        return prev.map(j => j.jobId === job.jobId ? job : j);
      }
      return [job, ...prev];
    });
  };

  const handleSelectJobFromDashboard = (job: GenerationJob) => {
    setActiveJob(job);
    setActiveTab('generate');
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-[#080808] text-gray-400 flex flex-col items-center justify-center p-6 space-y-4 font-mono text-xs">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
        <span>Loading AppForgeAI Project Monitor Workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-gray-400 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Banner & Telemetry Grid Frame */}
      <header className="h-16 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">AF</span>
            </div>
            <div>
              <h1 className="text-white font-medium text-sm tracking-tight flex items-center">
                AppForgeAI
              </h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">End-to-End Compiler Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {project.bridge.connected && (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                  <span className="text-[11px] font-mono text-emerald-500">
                    Live Terminal: {project.bridge.hostname}
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
              </>
            )}

            <div className="flex items-center gap-3 font-mono text-[10px] text-gray-500">
              {/* Clock Indicator */}
              <div className="flex items-center gap-1.5 bg-[#141414] border border-white/5 px-3 py-1.5 rounded text-gray-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{time || 'Syncing UTC time...'}</span>
              </div>

              {/* Email Profile Indicator */}
              <div className="hidden md:flex items-center gap-1.5 bg-[#141414] border border-white/5 px-3 py-1.5 rounded text-gray-300">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold">agarwalrohit22428@gmail.com</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Hub Body container */}
      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        
        {/* Navigation Selector Bar */}
        <div className="space-y-4">
          
          {/* Main SaaS Platform Tabs */}
          <div className="flex border-b border-white/5 scrollbar-none overflow-x-auto gap-1 self-start">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'generate', label: 'Generate App' },
              { id: 'pipeline-logs', label: 'Pipeline Logs' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'evaluations', label: 'Evaluation Logs' },
              { id: 'cost', label: 'Cost Analytics' },
              { id: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-4 text-[10px] uppercase tracking-widest font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded" />
                )}
              </button>
            ))}
          </div>

          {/* Auxiliary Workstation Tabs */}
          <div className="flex items-center gap-2.5 text-[10px] font-mono text-zinc-500 pl-4 py-1.5 bg-zinc-950/40 rounded border border-white/5 max-w-xl">
            <span className="text-zinc-600 font-bold uppercase tracking-wider text-[8px] border-r border-white/5 pr-2.5">On-Prem Desk Tools</span>
            
            <button
              onClick={() => setActiveTab('bridge')}
              className={`hover:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'bridge' ? 'text-[#1e90ff] font-bold' : ''}`}
            >
              [Connecting Terminal]
            </button>
            <span className="text-zinc-800">•</span>
            <button
              onClick={() => setActiveTab('backlog')}
              className={`hover:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'backlog' ? 'text-[#1e90ff] font-bold' : ''}`}
            >
              [Sprint Backlog]
            </button>
            <span className="text-zinc-800">•</span>
            <button
              onClick={() => setActiveTab('git')}
              className={`hover:text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'git' ? 'text-[#1e90ff] font-bold' : ''}`}
            >
              [Git History]
            </button>
          </div>

        </div>

        {/* Tab content panels transitions */}
        <div className="min-h-[460px]">
          
          {/* Main 8 SaaS tabs */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <Dashboard 
                project={project} 
                onRefresh={fetchStatus} 
                historyJobs={historyJobs}
                onSelectJob={handleSelectJobFromDashboard}
                onTriggerGenerateNav={() => setActiveTab('generate')}
              />
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="animate-fade-in">
              <GenerateApp 
                onJobCreated={handleJobCreated}
                activeJob={activeJob}
                setActiveJob={setActiveJob}
              />
            </div>
          )}

          {activeTab === 'pipeline-logs' && (
            <div className="animate-fade-in">
              <PipelineLogs historyJobs={historyJobs} />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="animate-fade-in">
              <IntegrationsTab />
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="animate-fade-in">
              <EvaluationLogs historyJobs={historyJobs} />
            </div>
          )}

          {activeTab === 'cost' && (
            <div className="animate-fade-in">
              <CostAnalytics historyJobs={historyJobs} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <SettingsTab 
                onResetBridge={handleResetBridge} 
                projectName={project.projectName} 
              />
            </div>
          )}



          {/* Telemetry Workstation tools */}
          {activeTab === 'bridge' && (
            <div className="animate-fade-in">
              <LocalBridgeSetup 
                bridge={project.bridge} 
                projectName={project.projectName} 
                onRefresh={fetchStatus} 
                onReset={handleResetBridge} 
              />
            </div>
          )}

          {activeTab === 'backlog' && (
            <div className="animate-fade-in">
              <KanbanBoard 
                tasks={project.backlog} 
                onUpdateTaskStatus={handleUpdateTaskStatus} 
                onCreateTask={handleCreateTask} 
              />
            </div>
          )}

          {activeTab === 'git' && (
            <div className="animate-fade-in">
              <GitStatus 
                commits={project.commitHistory} 
                activeBranch={project.activeBranch} 
              />
            </div>
          )}

        </div>

      </main>

      {/* Styled Applet Footer */}
      <footer className="border-t border-white/5 bg-[#0a0a0a] py-8 mt-16 text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AppForgeAI Development Pipeline Monitor Portal © 2026.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-600 font-sans">Secure Cloud Sandbox Node</span>
            <span>Version 1.2.0 Stable Build</span>
          </div>
        </div>
      </footer>

      {/* Reusable Floating Global Robot Assistant Widget */}
      <FloatingAssistant activeJob={activeJob} />
    </div>
  );
}
