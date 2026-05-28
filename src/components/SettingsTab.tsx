import React from 'react';
import { Sliders, ShieldCheck, Mail, Database, Terminal, Settings, RefreshCw, AlertTriangle } from 'lucide-react';

interface SettingsTabProps {
  onResetBridge: () => void;
  projectName: string;
}

export default function SettingsTab({ onResetBridge, projectName }: SettingsTabProps) {
  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans text-xs">
      
      {/* Intro block */}
      <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#161616] border border-white/10 flex items-center justify-center text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-medium text-base tracking-tight">AppForge Platform Settings</h2>
            <p className="text-zinc-500 font-mono mt-0.5 text-[10px]">Configure simulation profiles, auth bindings, and on-prem rules thresholds</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Auth card */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest">Authentication Security</h3>
          </div>

          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 text-yellow-400 rounded flex gap-3 font-mono">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <strong className="text-white text-xs block">Demo mode: Authentication not configured.</strong>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                No active Supabase security context detected in env configuration. AppForgeAI is currently operating in sandbox single-workspace developer mode. All active developer operations map directly into 'agarwalrohit22428@gmail.com'.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-[10.5px]">
            <div className="bg-[#111111] p-4.5 rounded border border-white/5 space-y-1">
              <span className="text-zinc-500">Local credentials:</span>
              <div className="text-white font-bold">developer@appforge.ai</div>
            </div>
            <div className="bg-[#111111] p-4.5 rounded border border-white/5 space-y-1">
              <span className="text-zinc-500">Security group:</span>
              <div className="text-[#1e90ff] font-bold">AI_Workspace_Administrator</div>
            </div>
          </div>
        </div>

        {/* Developer sandbox reset indicators */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 flex flex-col justify-between font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-300">Workspace Controls</h3>
            </div>

            <p className="text-zinc-500 text-[11px] font-sans leading-relaxed">
              Reset active sync bridge states to force immediate diagnostic reconnect requests across on-premises terminals.
            </p>

            <button
              onClick={onResetBridge}
              className="w-full text-center py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded border border-red-900/30 text-[10px] font-bold uppercase cursor-pointer"
            >
              Reset Connection Bridge State
            </button>
          </div>

          <div className="text-[10px] text-zinc-500 font-sans mt-4 pt-4 border-t border-white/5">
            AppForgeAI Workspace node parameters v1.1.2.
          </div>
        </div>

      </div>

    </div>
  );
}
