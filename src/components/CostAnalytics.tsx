import React from 'react';
import { DollarSign, Cpu, Clock, History, AlertCircle, BarChart3, Receipt, Tag } from 'lucide-react';
import { GenerationJob } from '../types';

interface CostAnalyticsProps {
  historyJobs: GenerationJob[];
}

export default function CostAnalytics({ historyJobs }: CostAnalyticsProps) {
  // Compute totals
  const totalPromptTokens = historyJobs.reduce((sum, job) => sum + (job.costBreakdown?.promptTokens || 0), 0);
  const totalCompletionTokens = historyJobs.reduce((sum, job) => sum + (job.costBreakdown?.completionTokens || 0), 0);
  const totalCostUSD = historyJobs.reduce((sum, job) => sum + (job.costBreakdown?.estimatedCostUSD || 0), 0);

  // Compute average latencies
  const avgLatency = historyJobs.length > 0 
    ? Math.round(historyJobs.reduce((sum, job) => sum + job.latencyMs, 0) / historyJobs.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans text-xs">
      
      {/* Upper Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Token Spent */}
        <div className="bg-[#0d0d0d] p-5 border border-white/5 rounded-lg flex justify-between items-center font-mono">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Cumulative Tokens spent</span>
            <div className="text-xl font-bold text-white">{(totalPromptTokens + totalCompletionTokens).toLocaleString()}</div>
            <div className="text-[9px] text-zinc-600">Prompt: {totalPromptTokens.toLocaleString()} | Outputs: {totalCompletionTokens.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-white/5 rounded text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Total Price USD */}
        <div className="bg-[#0d0d0d] p-5 border border-white/5 rounded-lg flex justify-between items-center font-mono">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Estimated cloud Spend</span>
            <div className="text-xl font-bold text-white">${totalCostUSD.toFixed(5)}</div>
            <div className="text-[9px] text-zinc-600">Calculated strictly under Flash price matrix</div>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-white/5 rounded text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Latency */}
        <div className="bg-[#0d0d0d] p-5 border border-white/5 rounded-lg flex justify-between items-center font-mono">
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Average compile latency</span>
            <div className="text-xl font-bold text-white">{avgLatency}ms</div>
            <div className="text-[9px] text-zinc-650 font-sans">Time from raw specifications prompt to valid schema</div>
          </div>
          <div className="p-2.5 bg-zinc-900 border border-white/5 rounded text-yellow-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Model Providers pricing blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Model cards */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-lg p-6 space-y-4 font-mono">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <BarChart3 className="w-4 h-4 text-[#1e90ff]" />
            <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-300">Provider Usage & Parameters</h3>
          </div>

          <div className="space-y-3.5">
            <div className="bg-[#111111] border border-white/5 rounded p-4 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-white font-bold text-xs">Google Gemini 3.5 Flash</span>
                <p className="text-[10px] text-zinc-505 font-sans leading-normal">Our primary senior model orchestrator for structured JSON schemas generation.</p>
              </div>
              <div className="text-right text-[10px] space-y-0.5 font-bold">
                <div className="text-emerald-400">ACTIVE PROVIDER</div>
                <div className="text-zinc-600 text-[9px]">$0.000075 / 1K tok</div>
              </div>
            </div>

            <div className="bg-[#111111]/30 border border-white/5 rounded p-4 opacity-50 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-zinc-400 font-bold text-xs">Google Gemini 1.5 Pro</span>
                <p className="text-[10px] text-zinc-600 font-sans leading-normal">Unavailable in local standard preview. Designed for extreme reasoning tasks.</p>
              </div>
              <div className="text-right text-[10px] font-bold text-zinc-600">
                <div>STANDBY MODE</div>
                <div className="text-[9px]">$0.001250 / 1K tok</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Details */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 flex flex-col justify-between font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-300">Run Billing Receipts</h3>
            </div>

            <div className="space-y-2.5 text-[10.5px]">
              {historyJobs.length === 0 ? (
                <div className="text-zinc-600 italic">No runs billing logs found</div>
              ) : (
                historyJobs.map((job, i) => (
                  <div key={job.jobId} className="flex justify-between text-zinc-400 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <span className="truncate w-32">{job.appIntent?.appName || 'Workspace'} ({job.jobId})</span>
                    <span className="text-emerald-500 font-bold">${(job.costBreakdown?.estimatedCostUSD || 0).toFixed(6)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-[10px] text-zinc-500 font-sans flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Pricing strictly computed matching standard developers logs keys.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
