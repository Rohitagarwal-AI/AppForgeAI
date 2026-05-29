import React, { useState } from 'react';
import { 
  Activity, Clock, Sparkles, Cpu, Play, Terminal, 
  CheckCircle2, XCircle, AlertTriangle, Layers, Network, 
  HelpCircle, Search, Filter, Trash2
} from 'lucide-react';

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  category: 'generation' | 'build' | 'integration' | 'deployment' | 'system';
  status: 'success' | 'running' | 'failed' | 'info';
  timestamp: string;
  latencyMs?: number;
}

interface ActivityPageProps {
  activityLogs: ActivityEvent[];
  onClearLogs?: () => void;
}

export default function ActivityPage({ activityLogs, onClearLogs }: ActivityPageProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'generation' | 'build' | 'integration' | 'deployment' | 'system'>('all');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'generation':
        return <Sparkles className="w-4 h-4 text-[#ffa116]" />;
      case 'build':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'integration':
        return <Network className="w-4 h-4 text-[#bf5af2]" />;
      case 'deployment':
        return <Play className="w-4 h-4 text-[#30d158]" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
      case 'failed':
        return 'bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/55';
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase()) || 
                          log.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || log.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-zinc-300 font-sans text-xs">
      {/* Header Panel */}
      <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-1">
          <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-500" />
            Audit Trace Timeline
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time telemetry and operation event records compiled across multi-tenant compiler engines.
          </p>
        </div>

        {onClearLogs && (
          <button 
            onClick={onClearLogs}
            className="border border-white/5 hover:border-red-900 bg-zinc-950 text-zinc-400 hover:text-red-400 transition-colors uppercase tracking-widest font-mono font-bold text-[10px] px-3.5 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Trace History
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-[#0a0a0c] border border-white/5 p-4 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Filter events by keywords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950/80 border border-white/5 pl-10 pr-4 py-2.5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-white/5 p-1 rounded-lg shrink-0 w-full md:w-auto overflow-x-auto scrollbar-none">
          {([
            { id: 'all', label: 'All' },
            { id: 'generation', label: 'Gen' },
            { id: 'build', label: 'Builds' },
            { id: 'integration', label: 'Connect' },
            { id: 'deployment', label: 'Deploys' },
            { id: 'system', label: 'Sys' }
          ] as const).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-all ${
                filterCategory === cat.id 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/10' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Card List */}
      <div className="bg-[#09090c] border border-white/5 rounded-xl p-6 relative">
        <div className="absolute left-[33px] top-6 bottom-6 w-[2px] bg-zinc-800/60" />

        <div className="space-y-6 relative">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono">
              <Activity className="w-8 h-8 text-zinc-800 mx-auto mb-3 animate-pulse" />
              <span>No trace events match the selection filters.</span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-4 items-start relative select-none animate-fade-in">
                {/* Visual Status Indicator Icon Circle */}
                <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-black">
                  {getCategoryIcon(log.category)}
                </div>

                {/* Event text content */}
                <div className="flex-1 min-w-0 bg-zinc-950/30 hover:bg-zinc-950/60 transition-colors border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-white text-[13px] font-medium tracking-tight">{log.title}</h4>
                      
                      <span className={`text-[8.5px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 border rounded-full ${getStatusStyle(log.status)}`}>
                        {log.status === 'running' ? 'Compiling' : log.status}
                      </span>

                      <span className="text-[9.5px] bg-white/5 text-zinc-400 px-2 py-0.5 border border-white/5 rounded font-mono uppercase tracking-wider">
                        {log.category}
                      </span>
                    </div>
                    
                    <p className="text-zinc-400 text-xs leading-relaxed font-sans">{log.description}</p>
                    
                    {log.latencyMs && (
                      <span className="text-[10px] text-zinc-550 font-mono block">
                        Response Latency: <strong className="text-zinc-400">{log.latencyMs} ms</strong>
                      </span>
                    )}
                  </div>

                  {/* Timestamp detail */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-550 shrink-0 select-none">
                    <Clock className="w-3.5 h-3.5 text-zinc-650" />
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
