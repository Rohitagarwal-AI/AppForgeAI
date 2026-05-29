import React from 'react';
import { 
  Cpu, Activity, Sparkles, Network, Play, 
  ArrowRight, ShieldCheck, Layers, Plus, Clock, ExternalLink
} from 'lucide-react';
import { AppForgeProject, GenerationJob } from '../types';
import { ProjectEntry } from './ProjectsPage';
import { ActivityEvent } from './ActivityPage';

interface DashboardProps {
  project: AppForgeProject;
  projectsList: ProjectEntry[];
  activityLogs: ActivityEvent[];
  onTriggerGenerateNav: () => void;
  onSelectProject: (project: ProjectEntry) => void;
}

export default function Dashboard({ 
  project, projectsList, activityLogs, onTriggerGenerateNav, onSelectProject 
}: DashboardProps) {
  
  // High-level KPI aggregates
  const activePipelinesCount = projectsList.filter(p => p.status === 'Deployed').length;
  const buildingPipelinesCount = projectsList.filter(p => p.status === 'Building').length;
  const failedPipelinesCount = projectsList.filter(p => p.status === 'Failed').length;
  
  // Combined mock code volume
  const combinedCodeVolume = 17350 + (projectsList.length - 1) * 8500;

  // Filter 3 most recent projects for view
  const recentProjects = projectsList.slice(0, 3);

  // Filter 4 most recent activity logs for view
  const recentActivity = activityLogs.slice(0, 4);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'generation':
        return <Sparkles className="w-3.5 h-3.5 text-[#ffa116]" />;
      case 'build':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'integration':
        return <Network className="w-3.5 h-3.5 text-indigo-400" />;
      case 'deployment':
        return <Play className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15';
      case 'running':
        return 'bg-blue-500/10 text-blue-450 border-blue-500/15 animate-pulse';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/15';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/55';
    }
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans leading-relaxed text-xs">
      
      {/* Intro Greetings Banner */}
      <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1e90ff] block">
            Workspace Active: Enterprise Sandbox
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 select-text">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 animate-gradient-walk font-black pr-0.5">AppForgeAI</span> Portal
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl select-text">
            Sovereign blueprint compilation suite. Securely orchestrate multi-tenant SaaS structures, monitor real-time compiler telemetry, and deploy sandboxed clusters instantly.
          </p>
        </div>

        <button 
          onClick={onTriggerGenerateNav}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] uppercase tracking-wider px-4.5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-500/15 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Generate Software
        </button>
      </div>

      {/* Modern High-level SaaS Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0a0a0c] border border-white/5 p-5.5 rounded-xl text-left select-none">
        
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block font-bold">Active Projects</span>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-xl font-bold text-white font-mono">{projectsList.length}</span>
            <span className="text-[10px] text-emerald-400 font-mono">+{activePipelinesCount} Live</span>
          </div>
        </div>

        <div className="space-y-0.5 border-l border-white/5 pl-4 ml-1">
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block font-bold">Compiler State</span>
          <div className="flex items-baseline gap-2 pt-0.5">
            {buildingPipelinesCount > 0 ? (
              <span className="text-xs font-bold text-blue-400 font-mono uppercase bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse">
                {buildingPipelinesCount} Building
              </span>
            ) : failedPipelinesCount > 0 ? (
              <span className="text-xs font-bold text-red-400 font-mono uppercase bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                {failedPipelinesCount} Failed
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                All Optimal
              </span>
            )}
          </div>
        </div>

        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block font-bold">Aggregated Lines</span>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-lg font-bold text-[#ffa116] font-mono">{combinedCodeVolume.toLocaleString()}</span>
            <span className="text-[9px] text-zinc-500 font-mono">lines</span>
          </div>
        </div>

        <div className="space-y-0.5 border-l border-white/5 pl-4">
          <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block font-bold">System Health</span>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-lg font-bold text-emerald-400 font-mono">100%</span>
            <span className="text-[9px] text-emerald-500 font-mono">AST Compliant</span>
          </div>
        </div>

      </div>

      {/* Main split view: Left (Recent Projects) / Right (Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Recents Projects Section (2/3 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-white text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Active Project Blueprints
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Showing {recentProjects.length} recents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentProjects.map((proj) => (
              <div 
                key={proj.id} 
                onClick={() => onSelectProject(proj)}
                className="bg-[#09090c] border border-white/5 hover:border-white/10 p-5 rounded-xl space-y-4 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 truncate">
                      <span className="text-[8.5px] bg-white/5 border border-white/5 text-zinc-400 px-1.8 py-0.4 rounded font-mono font-bold tracking-wider uppercase">
                        {proj.type}
                      </span>
                      <h4 className="text-white text-[13.5px] font-semibold tracking-tight pt-1 truncate group-hover:text-blue-400 transition-colors">
                        {proj.name}
                      </h4>
                    </div>

                    {/* Status Glow */}
                    <div className="font-mono text-[9px] tracking-wider shrink-0 uppercase select-none">
                      {proj.status === 'Deployed' && (
                        <span className="flex items-center gap-1.2 bg-emerald-950/20 text-emerald-404 border border-emerald-550/15 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-[#30d158] rounded-full animate-pulse shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
                          Live
                        </span>
                      )}
                      {proj.status === 'Building' && (
                        <span className="flex items-center gap-1.2 bg-blue-950/20 text-blue-400 border border-blue-550/15 px-2 py-0.5 rounded-full">
                          Compiling
                        </span>
                      )}
                      {proj.status === 'Failed' && (
                        <span className="flex items-center gap-1.2 bg-red-950/25 text-red-400 border border-red-550/20 px-2 py-0.5 rounded-full">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-400 text-[10.5px] font-sans line-clamp-2 leading-relaxed">
                    Built stack utilizing <code className="bg-zinc-950/60 px-1 py-0.5 border border-white/5 text-[#ffa116] rounded font-mono text-[9.5px]">{proj.techStack}</code> with integration parameters configured beautifully.
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3.5 mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-550">
                  <span>compiled {proj.lastUpdated}</span>
                  <div className="flex items-center gap-1 text-blue-400 font-bold hover:text-white transition-all text-[9.5px] uppercase tracking-wider">
                    <span>Configure Workspace</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}

            {projectsList.length === 0 && (
              <div className="col-span-2 text-center p-8 bg-[#09090c] border border-dashed border-white/5 rounded-xl space-y-3">
                <p className="text-zinc-500 font-mono">No active software configurations index found.</p>
                <button 
                  onClick={onTriggerGenerateNav} 
                  className="text-blue-400 hover:text-blue-300 font-bold text-[10px] uppercase font-mono transition-colors tracking-wider"
                >
                  Generate First AppSpec
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent timeline logs (1/3 column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-white text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Operations Log
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Telemetry</span>
          </div>

          <div className="bg-[#09090c] border border-white/5 rounded-xl p-4.5 space-y-4 font-mono">
            {recentActivity.map((log) => (
              <div key={log.id} className="relative flex gap-3 pb-1 border-b border-white/3 last:border-b-0 last:pb-0 font-sans">
                {/* Microstatus bubble */}
                <div className="w-6 h-6 rounded bg-zinc-950 border border-white/5 flex items-center justify-center shrink-0 z-10">
                  {getCategoryIcon(log.category)}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-[11.5px] tracking-tight truncate max-w-[120px]" title={log.title}>
                      {log.title}
                    </span>
                    <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.2 rounded border shadow-sm ${getStatusStyle(log.status)}`}>
                      {log.status === 'running' ? 'Compiling' : log.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-1 truncate max-w-[170px]" title={log.description}>
                    {log.description}
                  </p>
                  <span className="text-[9px] text-zinc-600 font-mono block">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}

            {activityLogs.length === 0 && (
              <div className="text-center py-8 text-zinc-650 font-mono">
                <span>No active events on pipeline bus.</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
