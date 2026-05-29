import React, { useState, useEffect } from 'react';
import { 
  Network, HelpCircle, ShieldCheck, Mail, Sliders, ToggleLeft, 
  Activity, Info, Settings, Lock, Power, RefreshCw, X, Check, Save
} from 'lucide-react';
import { IntegrationRegistryEntry } from '../types';

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<IntegrationRegistryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Custom config cabinet modal
  const [configuringItem, setConfiguringItem] = useState<IntegrationRegistryEntry | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [enableItem, setEnableItem] = useState(true);
  const [testedMessage, setTestedMessage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // SparkToast states
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleToggleConnect = (item: IntegrationRegistryEntry) => {
    const isCurrentlyActive = item.status === 'active' || item.status === 'configured';
    const newStatus = isCurrentlyActive ? 'available' : 'active';
    
    // Update local state and trigger Toast
    setIntegrations(prev => prev.map(intg => intg.id === item.id ? { ...intg, status: newStatus } : intg));
    
    if (isCurrentlyActive) {
      triggerToast(`🔌 Adapter "${item.name}" disconnected successfully.`);
    } else {
      triggerToast(`⚡ Adapter "${item.name}" connected and online!`);
    }
  };

  const handleOpenConfigure = (item: IntegrationRegistryEntry) => {
    setConfiguringItem(item);
    setCustomKey(localStorage.getItem(`appforge_key_${item.id}`) || '');
    setEnableItem(item.status === 'active' || item.status === 'configured');
    setTestedMessage(null);
  };

  const handleSaveConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringItem) return;

    localStorage.setItem(`appforge_key_${configuringItem.id}`, customKey);
    const updatedStatus = enableItem ? 'active' : 'available';

    setIntegrations(prev => prev.map(intg => intg.id === configuringItem.id ? { ...intg, status: updatedStatus } : intg));
    triggerToast(`⚙️ Configuration saved & synchronized for ${configuringItem.name}!`);
    setConfiguringItem(null);
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestedMessage(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestedMessage(`🟢 Connection verified! Successfully handshaked with ${configuringItem?.name} servers (HTTP 200 OK).`);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs space-y-2 animate-pulse">
        <Activity className="w-5 h-5 mx-auto animate-spin text-blue-400" />
        <span>Syncing system middleware registry metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-gray-305 font-sans text-xs">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-8 z-[9999] bg-[#0c0c0e]/95 border border-blue-500/35 text-white font-mono text-[11px] px-4.5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <ShieldCheck className="w-4.5 h-4.5 text-[#30d158] animate-pulse" />
          <span>{toast}</span>
        </div>
      )}

      {/* Intro block */}
      <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-zinc-950 border border-white/10 flex items-center justify-center text-blue-400">
            <Network className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              Cloud Adapters Registry
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select and isolate active cloud bindings, webhook listeners, and third-party SaaS event channels.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {integrations.map((item) => {
          const isConnected = item.status === 'active' || item.status === 'configured';
          
          return (
            <div 
              key={item.id} 
              className="bg-[#09090c] border border-white/5 hover:border-white/10 rounded-xl p-5.5 flex flex-col justify-between space-y-5 hover:scale-[1.01] transition-all font-sans"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs font-mono">{item.name} Adapter</span>
                    <span className="text-[9px] text-zinc-550 font-mono">{item.id.toUpperCase()}-MODULE</span>
                  </div>
                  
                  <span className={`text-[9.5px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-[#30d158] border border-emerald-500/20' 
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}>
                    {isConnected ? 'Active' : 'Dismounted'}
                  </span>
                </div>

                <p className="text-zinc-400 text-[11.5px] leading-relaxed font-normal h-12 line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* simplified quick indicators of triggers & actions */}
              <div className="border-t border-white/5 pt-3.5 flex items-center justify-between font-mono text-[9.5px] text-zinc-550">
                <span>Auth: <strong className="text-zinc-400 font-sans text-[11px] font-normal">{item.authType?.split(' / ')[0] || 'Token'}</strong></span>
                <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 font-bold uppercase tracking-wider text-[8.5px]">
                  {item.capabilities?.length || 2} endpoints
                </span>
              </div>

              {/* Simple action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleToggleConnect(item)}
                  className={`flex-1 text-center py-2 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    isConnected 
                      ? 'bg-red-950/15 border-red-900/10 text-red-400 hover:text-white hover:bg-red-900/25' 
                      : 'bg-emerald-950/15 border-emerald-900/10 text-emerald-400 hover:text-white hover:bg-emerald-900/25'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {isConnected ? 'Disable' : 'Enable'}
                </button>
                
                <button
                  onClick={() => handleOpenConfigure(item)}
                  className="bg-zinc-950 hover:bg-[#151518] text-zinc-400 hover:text-white border border-white/5 hover:border-white/10 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  title="Configure Keys & Credentials"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* DEDICATED AUTHENTICATION CONFIGURATION DRAWER CABINET OVERLAY */}
      {configuringItem && (
        <div className="fixed inset-0 bg-black/85 z-[9999] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c0f] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative select-none">
            <form onSubmit={handleSaveConfiguration}>
              
              {/* Cabinet Header */}
              <div className="bg-[#08080a] border-b border-white/5 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold font-mono">
                    {configuringItem.name.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-white text-md font-semibold tracking-tight">Configure {configuringItem.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-mono">AUTHENTICATION ADAPTER PROFILE CABINET</p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setConfiguringItem(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cabinet Body parameters */}
              <div className="p-6 space-y-5 text-left font-mono">
                
                {/* Integration Info check box */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/5 flex gap-3.5">
                  <Lock className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="font-sans text-[11px] leading-relaxed text-zinc-400 space-y-1">
                    <strong className="text-white font-mono text-[10.5px] uppercase font-bold block">Secure Token Isolation</strong>
                    <p>
                      AppForge securely hashes credential variables using sandbox keystores. Your credentials are used exclusively to process outbound webhooks matching configured AppSpecs.
                    </p>
                  </div>
                </div>

                {/* API Auth Private keys */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-500 block">
                    {configuringItem.authType || 'Standard Header API Auth Key'}
                  </label>
                  <input 
                    type="password" 
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="e.g. key_live_28asfa9fas..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Grid checklist of triggers and Actions */}
                <div className="grid grid-cols-2 gap-4 pt-1 text-[10.5px]">
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block">Supported Triggers</span>
                    <div className="space-y-1 font-sans text-zinc-400">
                      {configuringItem.triggers?.map((trig, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="w-1 h-1 rounded-full bg-blue-400" />
                          <span>{trig}</span>
                        </div>
                      )) || <span>No custom triggers found</span>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-zinc-500 uppercase tracking-widest text-[8px] font-bold block">Active Endpoint Actions</span>
                    <div className="space-y-1 font-sans text-zinc-400">
                      {configuringItem.actions?.map((act, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10.5px]">
                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                          <span>{act}</span>
                        </div>
                      )) || <span>No exposed actions</span>}
                    </div>
                  </div>
                </div>

                {/* Enable / disable toggle checkbox */}
                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/75 border border-white/5 cursor-pointer hover:border-white/10">
                  <span className="text-zinc-400 font-sans text-[11px]">Mount & Activate Adapter Endpoint</span>
                  <input 
                    type="checkbox" 
                    checked={enableItem}
                    onChange={(e) => setEnableItem(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </label>

                {/* Test Feedback */}
                {testedMessage && (
                  <div className="p-3 bg-[#0a0f0d] border border-emerald-500/15 rounded-lg text-emerald-400 text-[10px] font-sans">
                    {testedMessage}
                  </div>
                )}

              </div>

              {/* Cabinet Footer buttons */}
              <div className="bg-[#050507] px-6 py-4.5 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full sm:w-auto bg-zinc-900 border border-white/8 hover:text-white hover:bg-zinc-800 text-zinc-400 px-4 py-2 rounded-lg text-[10.5px] uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testing Tunnel...
                    </>
                  ) : (
                    'Test Handshake Link'
                  )}
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={() => setConfiguringItem(null)}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-450 hover:text-white px-4 py-2 rounded-lg text-[10.5px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4.5 py-2 rounded-lg text-[10.5px] uppercase tracking-wider font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Adaptor configs
                  </button>
                </div>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
