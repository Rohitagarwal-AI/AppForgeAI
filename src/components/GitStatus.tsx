import React from 'react';
import { Commit } from '../types.js';
import { GitCommit, GitBranch, Terminal, ShieldAlert, Calendar } from 'lucide-react';

interface GitStatusProps {
  commits: Commit[];
  activeBranch: string;
}

export default function GitStatus({ commits, activeBranch }: GitStatusProps) {
  
  // Format dates elegantly
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return 'just now';
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-white tracking-tight">Git Branch History Tree</h2>
        <p className="text-xs text-gray-400">Review committed changes, hash identifiers, and timeline releases synchronized from local workspace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Branch Tree View */}
        <div className="lg:col-span-2 bg-[#0d0d0d] rounded-xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded border border-white/5">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Currently Checked Out</div>
              <div className="text-sm font-semibold text-white font-mono">{activeBranch}</div>
            </div>
          </div>

          {/* Timeline visualization */}
          <div className="relative pl-6 space-y-8">
            {/* Tree Connecting Line */}
            <div className="absolute top-3 bottom-3 left-[11px] w-0.5 bg-blue-500/10" />

            {commits.map((commit, index) => {
              const isFirst = index === 0;
              return (
                <div key={commit.hash} className="relative group">
                  
                  {/* Glowing Node Dot */}
                  <div className={`absolute -left-[20px] top-1.5 w-3 h-3 rounded-full border-2 ${
                    isFirst 
                      ? 'bg-blue-400 border-blue-400 ring-4 ring-blue-500/15' 
                      : 'bg-[#0a0a0a] border-gray-600'
                  }`} />

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-300 hover:underline cursor-pointer bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                        {commit.hash.substring(0, 7)}
                      </span>
                      <span className="text-xs text-gray-300 font-medium">{commit.author}</span>
                      <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 font-semibold ml-auto shrink-0">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(commit.date)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#0a0a0a] rounded border border-white/5 group-hover:border-white/10 transition">
                      <p className="text-gray-200 text-sm leading-relaxed">{commit.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Git Info and Instructions */}
        <div className="bg-[#0d0d0d] border border-white/5 p-6 rounded-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-400" />
              Direct Sync Mechanism
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              When executing <code className="bg-[#0a0a0a] text-blue-300 px-1 py-0.5 border border-white/5 rounded font-mono">node bridge-sync.js</code> on your computer, the script queries your shell directly:
            </p>
            <div className="p-3.5 bg-[#0a0a0a] rounded border border-white/5 space-y-3 font-mono text-[11px] text-gray-400">
              <div className="space-y-1">
                <span className="text-gray-500"># Fetch checked branch name:</span>
                <div className="text-gray-300 font-semibold">$ git rev-parse --abbrev-ref HEAD</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500"># Fetch last 5 commit logs:</span>
                <div className="text-gray-300 font-semibold">$ git log --pretty=format:"%h|%an|%ad|%s" -n 5</div>
              </div>
            </div>
            <p className="text-xs text-gray-550">
              This completely eliminates manual dashboard reporting. All files, lines of code progress, and history revisions update dynamically on every save.
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] rounded border border-white/5 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-400 leading-relaxed">
              <strong>Secure Architecture Alert</strong>: The Bridge agent runs client-side on your local terminal and POSTs directly to this cloud dashboard's secure endpoints. No incoming network connections are opened on your private home desktop.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
