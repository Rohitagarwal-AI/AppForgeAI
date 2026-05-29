import React from 'react';
import { Sparkles, Activity, Shield } from 'lucide-react';

export const examples = [
  { title: 'SaaS Lead CRM', desc: 'SaaS CRM task manager with lead status, custom properties, and WhatsApp alerts' },
  { title: 'Agile Tracker', desc: 'SaaS product tracker with projects, collaborative team comments, and Slack bots' },
  { title: 'Warehouse Stock', desc: 'Secure retail inventory hub with vendor contacts, capacity indicators, and Gmail logs' },
  { title: 'Ecommerce Checkout', desc: 'Ecommerce checkout platform with carts checkout, Stripe webhooks, and invoice logs' }
];

interface GeneratorFormProps {
  customProjectName: string;
  setCustomProjectName: (name: string) => void;
  projectType: string;
  setProjectType: (type: string) => void;
  techStack: string;
  setTechStack: (stack: string) => void;
  selectedFeatures: string[];
  setSelectedFeatures: (features: string[] | ((prev: string[]) => string[])) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleGenerate: (e: React.FormEvent) => void;
  handleTemplateClick: (title: string, desc: string) => void;
  showReadme: boolean;
  setShowReadme: (show: boolean) => void;
}

export default function GeneratorForm({
  customProjectName,
  setCustomProjectName,
  projectType,
  setProjectType,
  techStack,
  setTechStack,
  selectedFeatures,
  setSelectedFeatures,
  prompt,
  setPrompt,
  handleGenerate,
  handleTemplateClick,
  showReadme,
  setShowReadme
}: GeneratorFormProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none py-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1e1b4b]/50 border border-blue-500/20 text-blue-400 rounded-full text-[10.5px] font-bold uppercase tracking-widest font-mono shadow-sm shadow-blue-500/5 select-none hover:border-blue-500/30 transition-all">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> AppForge AI Workspace
        </div>
        <h1 className="text-4xl sm:text-5.5xl md:text-6.5xl font-black tracking-tight leading-[1.08] font-display text-white select-text">
          Build{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 via-indigo-400 via-purple-500 via-pink-500 to-amber-400 bg-[length:200%_auto] animate-gradient-walk font-black pr-1">
            Full-Stack Apps
          </span>{' '}
          <br className="hidden sm:inline" />
          from{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-[#ffa116] via-rose-500 to-indigo-400 bg-[length:200%_auto] animate-gradient-walk font-serif italic font-medium pr-1">
            One Prompt
          </span>
        </h1>
        <p className="text-zinc-400 text-[12.5px] md:text-sm max-w-2xl mx-auto leading-relaxed font-sans text-center px-4 select-text">
          Unleash the multi-tenant compiler engines. Express your business logic, choose system schemas, 
          and watch our advanced compiler synthesize fully-bound relational structures, secure REST routes, 
          and sandboxed runtime deployments instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-[#09090b] border border-white/5 rounded-xl p-6 md:p-8 shadow-2xl relative space-y-6">
          <div className="absolute top-0 right-0 h-[2px] w-32 bg-gradient-to-r from-transparent to-blue-500 rounded" />
          
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Specs selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                  Project Identifier Name
                </label>
                <input
                  required
                  type="text"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  placeholder="e.g. LeadVanguard CRM, ApexStock Ledger"
                  className="w-full bg-[#121214] border border-white/10 rounded-lg py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 font-sans focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                    App Domain Category
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option>SaaS Suite</option>
                    <option>AI Workspace Tool</option>
                    <option>Ecommerce checkout</option>
                    <option>Fintech Sandbox Ledger</option>
                    <option>Healthcare EHR Ledger</option>
                  </select>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                    Compiler Technical stack
                  </label>
                  <select
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option>React + Express</option>
                    <option>Next.js + Tailwind</option>
                    <option>Vite + FastAPI</option>
                    <option>SvelteKit + Postgres</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Integration checklist modules */}
            <div className="space-y-3.5 text-left">
              <div className="flex justify-between items-center pb-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                  Integrated Module Adapters (Engine Hooks)
                </label>
                <span className="text-[10.5px] font-sans text-zinc-600">Compiled into routes automatically.</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: 'Slack Notifications', desc: 'Alert channels' },
                  { name: 'Stripe Checkout', desc: 'Secure payment gateway' },
                  { name: 'Gmail Auditing Logs', desc: 'Automatic email logs' },
                  { name: 'WhatsApp Alerts', desc: 'Immediate messages' },
                  { name: 'Google Sheets Sync', desc: 'Real-time spreadsheets' },
                  { name: 'Zod Auto Healer', desc: 'Reference integrity guards' },
                  { name: 'Relational DB', desc: 'Persisted schema model' }
                ].map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.name);
                  return (
                    <button
                      type="button"
                      key={feat.name}
                      onClick={() => {
                        setSelectedFeatures(prev => 
                          isChecked 
                            ? prev.filter(f => f !== feat.name) 
                            : [...prev, feat.name]
                        );
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer space-y-1.5 min-h-[72px] h-full ${
                        isChecked 
                          ? 'bg-blue-600/10 border-blue-500/40 text-white' 
                          : 'bg-[#121214] border-white/5 text-zinc-400 hover:border-white/10 hover:bg-zinc-950'
                      }`}
                    >
                      <span className="font-bold text-xs truncate w-full">{feat.name}</span>
                      <span className="text-[10px] text-zinc-500 block truncate font-sans">{feat.desc}</span>
                      
                      <span className={`absolute top-2 right-2.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center font-mono text-[8px] ${
                        isChecked ? 'bg-blue-500 border-blue-500 text-white font-bold' : 'border-zinc-850 bg-zinc-900/40'
                      }`}>
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt textarea description box */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none">
                Describe requirements, user flows or business schema logic
              </label>
              <textarea
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Create a task tracker and leads tracking dashboard. The leads should have name, email, status, and agents. When a lead is completed, dispatch Slack webhook sequence."
                className="w-full h-40 bg-[#121214] border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-t border-white/5 pt-5 gap-3">
              <div className="text-zinc-500 text-[10.5px] font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
                <span>Zod heuristics: auto-healer active</span>
              </div>

              <button
                type="submit"
                disabled={!prompt.trim() || !customProjectName.trim()}
                className={`w-full sm:w-auto px-7 py-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 select-none ${
                  !prompt.trim() || !customProjectName.trim()
                    ? 'bg-zinc-850/80 text-zinc-550 border border-white/5 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/10 cursor-pointer active:scale-95'
                }`}
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>Generate App</span>
              </button>
            </div>
          </form>
        </div>

        {/* Choose Template quick selectors */}
        <div className="space-y-3 text-left">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none px-1">
            Choose template custom blueprints
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {examples.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTemplateClick(item.title, item.desc)}
                className="p-3.5 bg-[#09090b] border border-white/5 rounded-xl text-left hover:border-blue-500/25 cursor-pointer hover:bg-zinc-950 transition-all space-y-1 block h-full focus:outline-none"
              >
                <span className="text-white font-bold block text-xs truncate">{item.title}</span>
                <p className="text-[10.5px] text-zinc-550 leading-normal font-sans line-clamp-2 h-8">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PRE-COMPILER TECHNICAL DESIGN SECTION - EXPLAINS PROBLEM, COMPLEX SLICES & TRADEOFFS */}
        <div className="bg-[#09090b] border border-white/5 rounded-xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wide">Shield Guard Multi-Layer Integrity Compiler (Architecture Specs)</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowReadme(!showReadme)}
              className="text-[10px] uppercase font-mono tracking-wider font-extrabold px-2.5 py-1 bg-zinc-900 border border-white/5 hover:border-zinc-700 rounded text-zinc-400 hover:text-white cursor-pointer select-none"
            >
              {showReadme ? 'Collapse Specs' : 'Expand Technical Specs'}
            </button>
          </div>

          {showReadme && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-[11px] font-sans">
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-indigo-400 flex items-center gap-1.5 leading-none font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                    1. Core Problem Statement: The Ambiguity Barrier
                  </span>
                  <p className="text-zinc-300 leading-normal font-sans text-justify">
                    Translating messy, high-level English instructions into bullet-proof computer code is a hard problem. LLMs alone introduce <strong>hallucinatory states, broken import boundaries, route discrepancies, and syntax errors</strong>. To be reliable, generation must be treated as a multi-step compilation process with strict verification.
                  </p>
                </div>

                <div className="space-y-1 text-left">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-emerald-400 flex items-center gap-1.5 leading-none font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    2. Multi-Layer Integrity Compilation Approach
                  </span>
                  <p className="text-zinc-300 leading-normal font-sans text-justify">
                    We bypass direct prompt-to-code pipelines by instantiating a structured intermediate language called <strong>AppSpec schema (AST syntax trees)</strong>. The AppSpec isolates components, API endpoints, schema attributes, and integration hook targets, which are audited by a Zod syntax validator and cured by a self-healing repair loop before coding.
                  </p>
                </div>

                <div className="space-y-1 text-left font-sans">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-blue-400 flex items-center gap-1.5 leading-none font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    3. Meaningful Operational Slice Chosen
                  </span>
                  <p className="text-zinc-300 leading-normal font-sans text-justify">
                    We focus on the hard engineering layer: <strong>multi-tenant relational structures mapping to a virtual sandbox microVM container on port 3000</strong>. The generated system binds a live database file tree, compiling CJS API routes, Postgres schema triggers, and responsive React data-grids.
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l border-zinc-900 pt-4 md:pt-0 md:pl-6 text-left">
                <div className="space-y-1 text-left font-sans">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-[#ffa116] flex items-center gap-1.5 leading-none font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffa116] inline-block" />
                    4. Bullet-Proof Reliability Strategy
                  </span>
                  <p className="text-zinc-300 leading-normal font-sans text-justify font-sans font-normal">
                    Our validator scans for 5 strict properties: <em>Spec correctness, REST Endpoint to Entity alignment, missing UI page files, dangling TypeScript module exports, and local Virtual Daemon status</em>. If errors occur, the compiler triggers recursive auto-heal repair strategies to fix syntax anomalies on-the-fly.
                  </p>
                </div>

                <div className="space-y-1 text-left font-sans">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest font-extrabold text-pink-400 flex items-center gap-1.5 leading-none font-sans font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 inline-block" />
                    5. Intentionally Decoupled Trade-offs (Cuts)
                  </span>
                  <p className="text-zinc-400 leading-normal font-sans">
                    To enable instant sandbox simulation and UI testing, we intentionally cut the following heavy operations:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-zinc-500 font-sans text-[10.5px]">
                    <li>Real production Cloud Spanner multi-minute database synchronization latency.</li>
                    <li>Live SSL registrar handshakes and domain delegation stages.</li>
                    <li>Complex Kubernetes pod-clustering structures, replaced with an elegant high-performance simulated daemon container frame.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
