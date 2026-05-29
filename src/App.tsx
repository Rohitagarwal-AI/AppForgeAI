import React, { useState, useEffect, useRef } from 'react';
import { AppForgeProject, ProjectTask, Commit, GenerationJob } from './types';
import GenerateApp from './components/GenerateApp';
import IntegrationsTab from './components/IntegrationsTab';
import SettingsTab from './components/SettingsTab';
import FloatingAssistant from './components/assistant/FloatingAssistant';
import AuthScreen from './components/AuthScreen';
import ProjectsPage, { ProjectEntry } from './components/ProjectsPage';
import ActivityPage, { ActivityEvent } from './components/ActivityPage';

import { 
  Briefcase, Terminal, Sparkles, Activity, 
  RefreshCw, GitBranch, ShieldCheck, Clock, HelpCircle, Wifi, LogOut, User,
  BookOpen, Compass, ClipboardList, Layers, Settings,
  Search, Bell, MessageSquare
} from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<AppForgeProject | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('appforge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Exactly 5 requested main tabs
  const [activeTab, setActiveTab] = useState<'generate' | 'projects' | 'integrations' | 'activity' | 'settings'>('generate');
  const [profileOpen, setProfileOpen] = useState(false);
  const [time, setTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Track all generated blueprints in React State for historic visibility
  const [historyJobs, setHistoryJobs] = useState<GenerationJob[]>([]);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);

  // master SaaS lists
  const [projectsList, setProjectsList] = useState<ProjectEntry[]>(() => {
    try {
      const saved = localStorage.getItem('appforge_projects_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Default mock data matching your system architecture
    return [
      {
        id: 'proj-1',
        name: 'Acme SaaS Billing',
        type: 'SaaS Suite',
        techStack: 'React + Express',
        features: ['Slack Notifications', 'Stripe Checkout', 'Relational DB'],
        status: 'Deployed',
        lastUpdated: '12 minutes ago',
        liveUrl: 'https://acme-billing.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/acme-billing'
      },
      {
        id: 'proj-2',
        name: 'SocialVerse AI Sandbox',
        type: 'AI Workspace Tool',
        techStack: 'Vite + FastAPI',
        features: ['Gmail Auditing Logs', 'Zod Auto Healer', 'Relational DB'],
        status: 'Building',
        lastUpdated: 'Just now',
        liveUrl: 'https://socialverse-ai.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/socialverse-ai'
      },
      {
        id: 'proj-3',
        name: 'TaskFlow Slack Automation',
        type: 'Fintech Sandbox Ledger',
        techStack: 'Next.js + Tailwind',
        features: ['Slack Notifications', 'Google Sheets Sync'],
        status: 'Deployed',
        lastUpdated: '5 hours ago',
        liveUrl: 'https://taskflow-slack.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/taskflow-slack'
      }
    ];
  });

  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('appforge_activity_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Unified live startup logs
    return [
      {
        id: 'evt-1',
        title: 'Acme SaaS Billing compiled successfully',
        description: 'Multi-tenant database schema generated. Bound 7 REST endpoints and Stripe checkout integration.',
        category: 'generation',
        status: 'success',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        latencyMs: 1420
      },
      {
        id: 'evt-2',
        title: 'SocialVerse AI Sandbox compilation pipeline triggered',
        description: 'Preparing sandbox container to process requirements. Target: us-east4 microVM.',
        category: 'build',
        status: 'running',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: 'evt-3',
        title: 'Stripe webhook configuration binding passed',
        description: 'Validated secure OAuth certificates and synchronized customer webhook signature handlers.',
        category: 'integration',
        status: 'success',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        latencyMs: 380
      },
      {
        id: 'evt-4',
        title: 'TaskFlow Slack Automation deployed live',
        description: 'Pushed production static assets and Node cluster configurations successfully to Edge CDN.',
        category: 'deployment',
        status: 'success',
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        latencyMs: 1100
      }
    ];
  });

  // Synchronizers
  const handleAddProject = (newProj: ProjectEntry) => {
    setProjectsList(prev => {
      // If project already exists (e.g. updating during deployment stage change), update standard values
      const exists = prev.some(p => p.id === newProj.id || p.name === newProj.name);
      let updated;
      if (exists) {
        updated = prev.map(p => (p.id === newProj.id || p.name === newProj.name) ? { ...p, ...newProj } : p);
      } else {
        updated = [newProj, ...prev];
      }
      localStorage.setItem('appforge_projects_list', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddActivityLog = (
    title: string, 
    desc: string, 
    category: 'generation' | 'build' | 'integration' | 'deployment' | 'system', 
    status: 'success' | 'running' | 'failed' | 'info'
  ) => {
    const newLog: ActivityEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      description: desc,
      category,
      status,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 48)]; // Keep max size lightweight
      localStorage.setItem('appforge_activity_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // 1. Fetch live project coordinates from standard endpoint
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/project');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      setProject(data);
    } catch (e) {
      console.warn('AppForge bridge syncing: Express server may be booting up.', e);
      setProject({
        projectName: 'appforgeai',
        activeBranch: 'main',
        commitHistory: [],
        fileMetrics: [],
        backlog: [],
        stats: { totalFiles: 0, linesOfCode: 0, issuesSolved: 0, testsPassingPercentage: 0 },
        bridge: { connected: false, lastSync: null, agentVersion: null, hostname: null, os: null, cpuModel: null }
      });
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
    }, 12000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

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
      <div className="min-h-screen bg-[#0d0d0f] text-zinc-400 flex flex-col items-center justify-center p-6 space-y-4 font-mono text-xs">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
        <span>Loading AppForge Monitor Workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-300 font-sans selection:bg-[#ffa116] selection:text-[#1a1a1a]">
      
      {/* Modern Workspace Top Header */}
      <header className="h-14 border-b border-white/5 bg-[#09090b] sticky top-0 z-50 text-xs px-6 flex items-center justify-between select-none">
        <div className="flex items-center space-x-6">
          {/* Custom skewed elegant Orange AppForge logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { setSelectedProject(null); setActiveTab('generate'); }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-blue-500" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-11.75 11.75a1.374 1.374 0 1 0 1.944 1.944l10.778-10.778 10.777 10.778a1.374 1.374 0 1 0 1.944-1.944l-11.75-11.75a1.374 1.374 0 0 0-.982-.414z"/>
              <path d="M13.483 5.483a1.374 1.374 0 0 0-.961.414L1.75 16.67A1.374 1.374 0 1 0 3.69 18.62l10.778-10.778 10.777 10.778a1.374 1.374 0 1 0 1.944-1.944l-11.75-11.75a1.374 1.374 0 0 0-.982-.414z" opacity=".8"/>
              <path d="M12.017 24a1.374 1.374 0 0 0 .961-.414l11.75-11.75a1.374 1.374 0 1 0-1.944-1.944l-10.778 10.778-10.777-10.778a1.374 1.374 0 1 0-1.944 1.944l11.75 11.75a1.374 1.374 0 0 0 .982.414z" />
            </svg>
            <span className="text-white font-medium text-[16px] font-sans tracking-tight">AppForgeAI</span>
          </div>
          
          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-6">
            {[
              { id: 'generate', label: 'Generator Workspace' },
              { id: 'projects', label: 'Projects' },
              { id: 'activity', label: 'Activity' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'settings', label: 'Settings' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'projects') {
                      setSelectedProject(null);
                    }
                    setActiveTab(item.id as any);
                  }}
                  className={`py-1 hover:text-white font-medium transition-colors cursor-pointer relative text-[13px] ${
                    isActive ? 'text-white font-bold' : 'text-zinc-550'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-blue-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center space-x-4">
          
          {/* Connection Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold font-sans rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Workspace Node Online
          </div>

          {/* Quick logs shortcut bubble */}
          <button 
            onClick={() => setActiveTab('activity')}
            className={`text-zinc-400 hover:text-white transition-colors relative p-1.5 hover:bg-zinc-900 rounded-full cursor-pointer border ${
              activeTab === 'activity' ? 'bg-zinc-900 border-white/10' : 'border-white/5 bg-[#0a0a0c]'
            }`}
            title="System Chronological event timeline"
          >
            <Activity className="w-4 h-4 text-blue-400" />
            {activityLogs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ffa116] rounded-full animate-pulse" />
            )}
          </button>

          {/* Avatar Profile Indicator */}
          <div className="relative z-[100]" ref={profileMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen(prev => !prev)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setProfileOpen(true);
                }
              }}
              className={`flex items-center space-x-1.5 border rounded p-1 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
                profileOpen ? 'border-blue-500/35 bg-zinc-900' : 'border-white/5 bg-zinc-950/80 hover:bg-zinc-900'
              }`}
            >
              <span className="w-6 h-6 bg-blue-600 text-white font-bold text-[10px] rounded flex items-center justify-center uppercase font-sans">
                {user.name.slice(0, 2)}
              </span>
            </button>
            
            {/* Popover Profile Options */}
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-10 z-[9999] w-56 bg-[#0c0c0f] border border-white/10 rounded-xl shadow-2xl shadow-black/60 p-2.5 text-[11px] font-mono text-left pointer-events-auto animate-fade-in"
              >
                <div className="px-2 py-2 border-b border-white/5 leading-normal mb-1.5">
                  <span className="text-white font-bold block truncate">{user.name}</span>
                  <span className="text-zinc-500 block truncate text-[9px] font-sans">{user.email}</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveTab('settings');
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-zinc-900 focus:bg-zinc-900 focus:outline-none text-zinc-300 hover:text-white rounded-lg cursor-pointer transition-colors block font-sans text-xs"
                >
                  Configurations Center
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    localStorage.removeItem('appforge_user');
                    setProfileOpen(false);
                    setUser(null);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-red-950/25 focus:bg-red-950/25 focus:outline-none text-red-400 hover:text-red-300 rounded-lg cursor-pointer transition-colors block mt-1.5 border-t border-white/5 font-bold font-sans text-xs"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Hub Body container */}
      <div className="flex max-w-[1360px] mx-auto px-5 py-6 gap-6 min-h-[calc(100vh-56px)] select-none">
        
        {/* Left Vertical Navigator Sidebar */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col justify-between font-sans border-r border-white/5 pr-4 select-none">
          <div className="space-y-6 text-left">
            
            {/* Core categories */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider block px-2.5">Platform Base</span>
              
              <button
                onClick={() => setActiveTab('generate')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeTab === 'generate' 
                    ? 'bg-zinc-900 border border-white/5 text-white font-semibold' 
                    : 'text-zinc-550 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-[#ffa116]" />
                  <span>Generator Workspace</span>
                </div>
                <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase scale-90">active</span>
              </button>

              <button
                onClick={() => {
                  setSelectedProject(null);
                  setActiveTab('projects');
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeTab === 'projects' 
                    ? 'bg-zinc-900 border border-white/5 text-white font-semibold' 
                    : 'text-zinc-550 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Projects catalog</span>
              </button>
            </div>

            {/* Miscellaneous details */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider block px-2.5">Platform details</span>

              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center space-x-3 px-3 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  activeTab === 'integrations' ? 'bg-zinc-900 text-white border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cloud adapters</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full flex items-center space-x-3 px-3 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  activeTab === 'activity' ? 'bg-zinc-900 text-white border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-pink-400" />
                <span>Activity Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-zinc-900 text-white border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Platform Settings</span>
              </button>
            </div>

          </div>

          {/* Active Clock Ticket in local time */}
          <div className="border border-white/5 bg-[#09090b] rounded-lg p-3 space-y-2 mt-auto font-mono text-[9.5px] leading-relaxed text-zinc-500 text-left select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-zinc-300 text-[10px]">Active Node Server</strong>
            </div>
            <p className="font-sans text-[10px] text-zinc-550 leading-normal">
              IST Sync: {time.replace(' IST', '')}
            </p>
          </div>
        </aside>

        {/* Content Pane of Selected Tab */}
        <div className="flex-1 min-w-0">
          
          {/* Render Active Tab */}
          {activeTab === 'projects' && (
            <div className="animate-fade-in text-left">
              <ProjectsPage 
                projectsList={projectsList}
                setProjectsList={setProjectsList}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                onNavigateToGenerate={() => setActiveTab('generate')}
                activityLogs={activityLogs}
                onAddActivityLog={handleAddActivityLog}
              />
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="animate-fade-in text-left">
              <GenerateApp 
                onJobCreated={handleJobCreated}
                activeJob={activeJob}
                setActiveJob={setActiveJob}
                onProjectAdded={handleAddProject}
                onAddActivityLog={handleAddActivityLog}
                setActiveTab={setActiveTab}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
              />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="animate-fade-in text-left">
              <IntegrationsTab />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="animate-fade-in text-left">
              <ActivityPage 
                activityLogs={activityLogs}
                onClearLogs={() => {
                  setActivityLogs([]);
                  localStorage.setItem('appforge_activity_logs', '[]');
                }}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in text-left">
              <SettingsTab 
                onResetBridge={handleResetBridge} 
                projectName={project?.projectName || 'sandboxed-node-core'} 
              />
            </div>
          )}

        </div>
      </div>

      {/* Styled Applet Footer */}
      <footer className="border-t border-white/5 bg-[#09090b] py-6 text-[10px] text-zinc-550 font-mono mt-12 select-none">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>AppForge AI Platform © 2026.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-650 font-sans">Enterprise Cloud Sandbox</span>
            <span>v1.2.0 Stable Build</span>
          </div>
        </div>
      </footer>

      {/* Reusable Floating Global Robot Assistant Widget */}
      <FloatingAssistant activeJob={activeJob} />
    </div>
  );
}
