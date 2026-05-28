import React, { useState } from 'react';
import { Terminal, Copy, Check, RefreshCw, Cpu, Monitor, Activity, ShieldAlert, Link2 } from 'lucide-react';
import { BridgeStatus } from '../types.js';

interface LocalBridgeSetupProps {
  bridge: BridgeStatus;
  projectName: string;
  onRefresh: () => void;
  onReset: () => void;
}

export default function LocalBridgeSetup({ bridge, projectName, onRefresh, onReset }: LocalBridgeSetupProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Derive current absolute window URL to display to user
  const hostUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'https://your-applet-url.run.app';

  const terminalCommand = `node bridge-sync.js ${hostUrl}`;

  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Header & Status Banner */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        bridge.connected 
          ? 'bg-[#0d0d0d] border-emerald-500/20 text-emerald-300' 
          : 'bg-[#0d0d0d] border-white/5 text-gray-400'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-2.5 h-2.5 rounded-full ${bridge.connected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-[#1a1a1a]'}`} />
            <div>
              <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
                Desktop Linking Bridge
                {bridge.connected ? (
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-[#1a1a1a] text-gray-500 px-2.5 py-0.5 rounded border border-white/5">
                    Awaiting Connection
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {bridge.connected 
                  ? `Last handshaked from laptop at ${new Date(bridge.lastSync!).toLocaleTimeString()}`
                  : 'Link your local development terminal to receive real-time project metrics.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a1a1a] border border-white/10 hover:bg-white/5 text-white text-xs font-semibold transition"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
              Check Heartbeat
            </button>
            {bridge.connected && (
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 rounded bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 text-xs font-semibold transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Detailed Connection Metrics */}
        {bridge.connected && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-start gap-3 bg-[#0a0a0a] p-3 rounded border border-white/5">
              <Monitor className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-gray-500 font-mono">Desktop Workstation</div>
                <div className="text-sm font-semibold text-gray-200 mt-0.5 truncate max-w-[180px]">{bridge.hostname}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#0a0a0a] p-3 rounded border border-white/5">
              <Activity className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-gray-500 font-mono">Hosting OS platform</div>
                <div className="text-sm font-semibold text-gray-200 mt-0.5 truncate max-w-[180px]">{bridge.os}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-[#0a0a0a] p-3 rounded border border-white/5">
              <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] uppercase text-gray-500 font-mono">Processor core config</div>
                <div className="text-sm font-semibold text-gray-200 mt-0.5 truncate max-w-[180px]">{bridge.cpuModel}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Instructions Card */}
      <div className="bg-[#0d0d0d] rounded-xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            Quick Connection Dashboard Hook
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Follow these two simple steps to stream real-time workspace telemetries from your desktop project folder.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/25">
                1
              </span>
              <h4 className="font-semibold text-gray-200 text-sm">Download or Save custom sync client</h4>
            </div>
            <p className="text-xs text-gray-400 ml-8">
              Create a file named <code className="text-gray-300 font-mono bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-white/5">bridge-sync.js</code> inside your local <code className="text-gray-300 font-mono bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-white/5">{projectName || 'appforgeai'}</code> folder on your desktop, and save the synchronizer contents inside it.
            </p>
            <div className="ml-8 p-4 bg-[#0a0a0a] border border-white/5 rounded space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-mono">bridge-sync.js</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  No External NPM dependencies needed
                </span>
              </div>
              <div className="text-xs text-gray-500">
                The script scans native metrics like Git active logs, modified workspace sizes, and system threads, pushing lightweight payloads to this hub. You don't need any complex installation.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/25">
                2
              </span>
              <h4 className="font-semibold text-gray-200 text-sm">Execute linking cmd in your local project folder</h4>
            </div>
            <p className="text-xs text-gray-400 ml-8">
              Open your terminal inside your desktop <code className="text-blue-400 font-mono bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-white/5">appforgeai</code> directory and execute the trigger command:
            </p>
            
            {/* Terminal Command container */}
            <div className="ml-8 flex items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-white/5 rounded font-mono text-xs group">
              <div className="flex items-center gap-2 text-gray-300 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                <span className="text-gray-500 select-none">$</span>
                <span>{terminalCommand}</span>
              </div>
              <button
                onClick={() => copyToClipboard(terminalCommand, setCopiedCommand)}
                className="p-2 text-gray-400 hover:text-white bg-[#1a1a1a] border border-white/10 rounded shrink-0 hover:bg-white/5 transition-colors"
                title="Copy Terminal Command"
              >
                {copiedCommand ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] p-4 border-t border-white/5 flex items-start gap-3 text-gray-400 text-xs px-6">
          <ShieldAlert className="w-4 h-4 text-blue-450 shrink-0 mt-0.5" />
          <div>
            We recommend setting up a local watcher (e.g. running <code className="bg-[#1a1a1a] text-gray-300 px-1 rounded">watch -n 10 node bridge-sync.js</code> on Mac/Linux, or looping via terminal) to dynamically monitor status, size, and files as you write real draft implementations on your desktop.
          </div>
        </div>
      </div>
    </div>
  );
}
