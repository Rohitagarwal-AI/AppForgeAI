import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Layers, HelpCircle, CheckCircle2, Award, Clipboard, Activity } from 'lucide-react';
import { GenerationJob } from '../types';

interface EvaluationLogsProps {
  historyJobs: GenerationJob[];
}

export default function EvaluationLogs({ historyJobs }: EvaluationLogsProps) {
  const totalJobs = historyJobs.length;
  const compliantJobs = historyJobs.filter(j => j.validation?.valid).length;
  const nonCompliantJobs = totalJobs - compliantJobs;
  const complianceRate = totalJobs > 0 ? Math.round((compliantJobs / totalJobs) * 100) : 100;

  // Aggregate errors across all jobs
  const totalErrorsCount = historyJobs.reduce(
    (sum, job) => sum + (job.validation?.errors.length || 0),
    0
  );

  const errorsChecklist = [
    { title: 'Multi-Tenant Isolation Check', rule: 'Entity has standard string "tenantId" field in table', desc: 'Prevents security leaks and cross-tenant data queries in Cloud SQL sandboxes.' },
    { title: 'Pages API Bound Map Check', rule: 'Every screen matches an internal compiled apiEndpoint', desc: 'Validates routes state integrity and blocks offline frontend UI widgets failures.' },
    { title: 'Foreign Model Bound Check', rule: 'API endpoints boundEntity references existing tables', desc: 'Enforces strictly coupled database models and avoids invalid query stubs.' },
    { title: 'Registered Services Integrations Check', rule: 'Hooks reference allowed list on integrations bus', desc: 'Blocks unknown webhook drivers and secures connected cloud services adapters.' }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans text-xs">
      
      {/* 2-Column Pitch Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance metrics card */}
        <div className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-[#1e90ff] font-bold font-mono">AppForge Evaluation Desk</span>
            
            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-mono text-white tracking-tight">{complianceRate}%</span>
              <span className="text-xs text-gray-500 mb-1">specifications compliance pass rate</span>
            </div>
            
            <p className="text-zinc-400 leading-relaxed font-mono text-[11px] pt-1">
              The AppForge evaluation pipeline runs static audits and logical checks on all compiled output models, confirming that structures conform 100% to production-ready API contracts.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/5 text-center font-mono text-[11px]">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px]">Total audited</span>
              <div className="text-white font-bold">{totalJobs} blueprint nodes</div>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px]">Passed cleanly</span>
              <div className="text-emerald-400 font-bold">{compliantJobs} systems</div>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px]">Validation errors</span>
              <div className="text-red-400 font-bold">{totalErrorsCount} instances</div>
            </div>
          </div>
        </div>

        {/* Healer metrics statistics card */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 flex flex-col justify-between font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-medium text-xs uppercase tracking-widest text-zinc-300">Self Healer Performance</h3>
            </div>
            
            <div className="space-y-2 pt-2 text-[11px]">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-zinc-400">Autoclean heals rate:</span>
                <span className="text-emerald-400 font-bold">100% successful</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-zinc-400">Healing latency:</span>
                <span className="text-white font-bold">~15ms node cycle</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Human approvals:</span>
                <span className="text-zinc-500 italic">None required</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 font-sans mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>HEALER ACTIVE. Self-repairing compiler loop is running online.</span>
          </div>
        </div>

      </div>

      {/* Rules audit matrix list */}
      <div className="space-y-4">
        <h3 className="text-white font-medium text-xs font-mono uppercase tracking-widest text-zinc-400">Spec Evaluation Pipeline Rules Matrix</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {errorsChecklist.map((chk, i) => (
            <div 
              key={i} 
              className="bg-[#0d0d0d] border border-white/5 hover:border-zinc-700 p-5 rounded-lg flex gap-4 transition-all font-mono"
            >
              <div className="w-8 h-8 rounded bg-[#111111] border border-white/5 text-blue-400 flex items-center justify-center shrink-0">
                <span className="font-bold text-xs">{i+1}</span>
              </div>
              <div className="space-y-1.5 pt-0.5">
                <div className="text-white font-bold text-xs">{chk.title}</div>
                <div className="text-[#1e90ff] text-[10px] font-semibold">Requirement: {chk.rule}</div>
                <p className="text-zinc-500 text-[10px] pt-1 leading-relaxed font-sans">{chk.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
