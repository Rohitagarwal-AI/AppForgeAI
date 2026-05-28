import React, { useState } from 'react';
import { Terminal, ShieldCheck, Cpu, RefreshCw, Layers, ShieldAlert, GitBranch, History } from 'lucide-react';
import { GenerationJob } from '../types';

interface PipelineLogsProps {
  historyJobs: GenerationJob[];
}

export default function PipelineLogs({ historyJobs }: PipelineLogsProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>(
    historyJobs[0]?.jobId || ''
  );

  const selectedJob = historyJobs.find(j => j.jobId === selectedJobId) || historyJobs[0];

  return (
    <div className="space-y-6 animate-fade-in font-mono text-xs text-gray-300">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Jobs History selection list */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-5 space-y-4">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Jobs Trace Ledger
          </h3>
          <p className="text-[10px] text-zinc-500">Select a compiler run to inspect trace logs</p>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {historyJobs.length === 0 ? (
              <span className="text-zinc-600 block italic pt-2">No trace jobs compiled</span>
            ) : (
              historyJobs.map((job) => (
                <button
                  key={job.jobId}
                  onClick={() => setSelectedJobId(job.jobId)}
                  className={`w-full text-left p-2.5 rounded border text-[10px] transition-all flex flex-col gap-0.5 cursor-pointer ${
                    selectedJob?.jobId === job.jobId
                      ? 'bg-blue-900/15 border-blue-500/30 text-blue-400'
                      : 'bg-[#111] hover:bg-[#151515] border-white/5 text-zinc-400'
                  }`}
                >
                  <span className="font-bold text-white truncate w-full">{job.appIntent?.appName || 'Workspace Spec'}</span>
                  <span className="text-[9px] text-zinc-500">{job.jobId}</span>
                  <span className="text-[8px] text-zinc-600 mt-1">{new Date(job.createdAt).toLocaleTimeString()}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Log Stream Console */}
        <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest">Compiler Trace Console</h3>
            </div>
            {selectedJob && (
              <span className="text-[10px] text-zinc-500">
                Job node: <strong className="text-zinc-400">{selectedJob.jobId}</strong>
              </span>
            )}
          </div>

          {!selectedJob ? (
            <div className="bg-[#050505] border border-white/5 p-12 text-center text-zinc-600 rounded">
              <Terminal className="w-8 h-8 text-zinc-800 mx-auto mb-3 animate-pulse" />
              <span>Awaiting telemetry inputs. Compile progress logs will stream here.</span>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Event stage block cards */}
              <div className="space-y-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Trace Sequence Events</span>
                
                <div className="space-y-2">
                  {selectedJob.events.map((ev, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded p-3 flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600 block w-4 font-bold">{i+1}.</span>
                        <span className="text-white font-semibold">{ev.stage}</span>
                        <span className="text-zinc-500 text-[10px]">({ev.latencyMs}ms)</span>
                      </div>
                      <span className="text-emerald-500 font-bold uppercase text-[9px] tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        COMPLETED
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console log outputs */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">Standard Log Output Stream</span>
                
                <div className="bg-black/80 border border-white/10 rounded-md p-4 text-[10.5px] leading-relaxed text-[#eee] font-mono space-y-1.5 max-h-[220px] overflow-y-auto">
                  <div>[system] Initializing compiler sandbox context.</div>
                  <div>[compiler] Ingress prompt target parsed: "{selectedJob.prompt}"</div>
                  <div>[compiler] Invoking model parameters generator pipeline under mode "{selectedJob.mode}"</div>
                  <div>[intent_extractor] Mapping core business domains structures...</div>
                  <div>[intent_extractor] Extracted {selectedJob.appIntent?.entities.length || 3} dynamic objects parameters in intent.</div>
                  <div>[schema_builder] Formulating relational structures schema arrays...</div>
                  {selectedJob.dataSchema?.entities.map((ent) => (
                    <div key={ent.name}>[schema_builder] Compile schema model entity "{ent.name}" with bound tenant identifier field "{ent.tenantId}".</div>
                  ))}
                  <div>[appspec_builder] Stitching routes templates...</div>
                  <div>[validator] Initiating Zod parsing protocols on output model specs...</div>
                  {selectedJob.validation?.valid ? (
                    <div className="text-emerald-400">[validator] Validation checks complete: 100% compliant specifications.</div>
                  ) : (
                    <>
                      <div className="text-red-400">[validator] Validation complete: observed structural discrepancy exceptions.</div>
                      {selectedJob.validation?.errors.map((err, i) => (
                        <div key={i} className="text-[#ff6347] pl-3">↳ [error] Path "{err.path}" - {err.message}</div>
                      ))}
                    </>
                  )}
                  {selectedJob.repairLog.length > 0 && (
                    <>
                      <div>[healer] Exception corrections scheduled on repair queue:</div>
                      {selectedJob.repairLog.map((rep, idx) => (
                        <div key={idx} className="text-emerald-400 pl-3">↳ [healer_success] Executed strategy "{rep.strategy}" to fix mismatch. Output: {rep.outcome}</div>
                      ))}
                    </>
                  )}
                  <div className="text-emerald-400 font-bold">[system] Blueprint {selectedJob.appIntent?.appName} compiling finalized successfully in {selectedJob.latencyMs}ms.</div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
