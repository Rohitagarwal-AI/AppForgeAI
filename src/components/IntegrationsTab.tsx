import React, { useState, useEffect } from 'react';
import { Network, HelpCircle, ShieldCheck, Mail, Sliders, ToggleLeft, Activity, Info } from 'lucide-react';
import { IntegrationRegistryEntry } from '../types';

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<IntegrationRegistryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (e) {
      console.error('Failed fetching integrations registry payload:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs space-y-2 animate-pulse">
        <Activity className="w-5 h-5 mx-auto animate-spin text-blue-400" />
        <span>Syncing system middleware registry metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-gray-300 font-sans text-xs">
      
      {/* Intro block */}
      <div className="bg-[#0d0d0d] border border-white/5 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-medium text-base tracking-tight">AppForge Integrations Registry</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Approved cloud services adapters available for secure bindings matching AppSpecs</p>
          </div>
        </div>
        <p className="text-zinc-400 max-w-2xl leading-relaxed font-mono text-[11px]">
          Blueprint generators compile middleware loops directly into our global integrations bus. Define valid bindings in your prompts, and our builders attach the underlying OAuth scopes, payload webhooks, and rate-limiting schemas automatically.
        </p>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div 
            key={item.id} 
            className="bg-[#0d0d0d] border border-white/5 rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all font-mono"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#111111] px-3.5 py-2 rounded border border-white/5">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">{item.name} Adapter</span>
                  <span className="text-[9px] text-zinc-500">ID: {item.id}</span>
                </div>
                
                <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded ${
                  item.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                    : item.status === 'configured' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-zinc-800 text-zinc-500 border border-white/5'
                }`}>
                  {item.status}
                </span>
              </div>

              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">{item.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5 text-[10px]">
              <div>
                <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">Auth Configuration Type</span>
                <span className="text-zinc-300 font-sans text-[11px] font-medium block mb-2">{item.authType || 'Standard Token'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2">
                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">Supported Triggers</span>
                  <div className="space-y-1 font-sans text-zinc-400 text-[10px]">
                    {item.triggers?.map((trig, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                        <span>{trig}</span>
                      </div>
                    )) || <span>None defined</span>}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">Exposed Actions</span>
                  <div className="space-y-1 font-sans text-zinc-400 text-[10px]">
                    {item.actions?.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                        <span>{act}</span>
                      </div>
                    )) || <span>None defined</span>}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block mb-1">Capabilities Exposed</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.capabilities.map((cap, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-400 text-[9px]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
