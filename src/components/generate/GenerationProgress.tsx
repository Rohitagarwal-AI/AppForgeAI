import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

interface GenerationProgressProps {
  currentStepText: string;
  pipelinePercentage: number;
  pipelineSteps: { name: string; status: 'pending' | 'processing' | 'completed' }[];
  pipelineLogs: string[];
  logTerminalEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function GenerationProgress({
  currentStepText,
  pipelinePercentage,
  pipelineSteps,
  pipelineLogs,
  logTerminalEndRef
}: GenerationProgressProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-6 text-left">
      <div className="bg-[#09090b] border border-white/5 shadow-2xl rounded-2xl p-6 space-y-6 relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-[#10e28e] to-indigo-500 animate-pulse" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-white font-bold uppercase tracking-wider text-xs">AI Container Pipeline Active</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Active Sequence: <span className="text-blue-400 font-mono font-bold uppercase">{currentStepText}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-[11px] text-zinc-500">Progress:</span>
            <span className="text-white font-extrabold text-lg tracking-tight">{pipelinePercentage}%</span>
          </div>
        </div>

        {/* Glowing progress bar */}
        <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
          <div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-[#10e28e] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(30,144,255,0.4)]"
            style={{ width: `${pipelinePercentage}%` }}
          />
        </div>

        {/* Step Timeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
          {pipelineSteps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isProcessing = step.status === 'processing';
            return (
              <div
                key={idx}
                className={`p-3 border rounded-xl font-mono flex flex-col justify-between h-[66px] transition-all ${
                  isCompleted 
                    ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400 font-medium'
                    : isProcessing
                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-400 font-bold shadow-[0_0_12px_rgba(30,144,255,0.06)] animate-pulse'
                    : 'bg-[#121214] border-white/5 text-zinc-650'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold opacity-40">STAGE {idx + 1}</span>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {isProcessing && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
                  {!isCompleted && !isProcessing && <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />}
                </div>

                <span className={`text-[9.5px] block truncate transition-colors ${isCompleted ? 'text-zinc-300' : isProcessing ? 'text-blue-400 font-bold' : 'text-zinc-500'}`} title={step.name}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Realtime stdout logs */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none px-1">
            Virtual Compilation activity logs
          </span>
          
          <div className="bg-[#0c0c0e] border border-white/10 rounded-xl p-4 h-64 overflow-y-auto font-mono text-[10px] text-zinc-300 leading-relaxed space-y-1.5 scrollbar-thin select-text">
            {pipelineLogs.map((log, idx) => {
              let isSuccess = log.includes('Success') || log.includes('SUCCESS');
              let isStage = log.includes('Starting Pipeline Stage');
              return (
                <div 
                  key={idx} 
                  className={`font-mono text-[9.5px] truncate text-left ${
                    isSuccess ? 'text-emerald-400 font-bold' : isStage ? 'text-blue-400 underline decoration-blue-500/20' : 'text-zinc-400'
                  }`}
                >
                  {log}
                </div>
              );
            })}
            <div ref={logTerminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
