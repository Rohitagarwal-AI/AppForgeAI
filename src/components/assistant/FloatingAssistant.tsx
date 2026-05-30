import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, MessageSquare, Terminal, User, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { GenerationJob } from '../../types';

interface FloatingAssistantProps {
  activeJob: GenerationJob | null;
}

export default function FloatingAssistant({ activeJob }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string; timestamp: Date }[]>([]);
  const [input, setInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize messages based on activeJob presence
  useEffect(() => {
    if (messages.length === 0) {
      if (activeJob) {
        setMessages([
          {
            sender: 'assistant',
            text: `Greetings! I am your AppForge Senior Advisor. I detected an active workspace blueprint: **${activeJob.appIntent?.appName || 'Untitled App'}** (${activeJob.appIntent?.appType || 'SaaS'}).\n\nAsk me anything about this spec! Direct examples:
- "Explain what is inside this AppSpec contract?"
- "Verify database compliance rules for ${activeJob.appIntent?.appName}?"
- "Evaluate multi-tenant security architecture?"`,
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages([
          {
            sender: 'assistant',
            text: "Welcome back! I am your AppForge Senior Workspace Advisor. Currently, *no active app blueprint has been generated*.\n\nTo get started, please go to **Generate App** in the sub navigation rail, enter a software concept, and compile a specification! Let me know if you would like me to suggest some preset prompt templates.",
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [activeJob, messages.length]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const presetsWithActive = [
    "Explain what is inside this AppSpec?",
    "Verify tenantId security constraints?",
    "Are there any integration hooks active?",
    "Show me the database relation mapping"
  ];

  const presetsNoActive = [
    "Suggest SaaS starter prompts",
    "How does the repair engine work?",
    "Explain multi-tenant architecture models"
  ];

  const presets = activeJob ? presetsWithActive : presetsNoActive;

  const getFallbackAnswer = (msg: string) => {
    const msgLower = msg.toLowerCase();
    
    if (msgLower.includes('explain') || msgLower.includes('spec') || msgLower.includes('what is') || msgLower.includes('blueprint') || msgLower.includes('contract')) {
      return `### AppForge AI System Blueprint Contract Analysis\n\nThe app blueprint models represent a structured compile-time protocol designed to orchestrate full-stack SaaS pipelines.\n\n#### Core Structural Subsystems:\n1. **AppIntent**:\n   * **Purpose**: Captures user specifications, app description, target audience segment, and technology stack preferences.\n   * **Attributes**: App Name, Category, Stack type, and chosen module list.\n2. **DataSchema (Relational Entity Model)**:\n   * **Purpose**: Defines database tables with strict relationship indexes and custom field constraints.\n   * **Enforced Validation**: Employs a mandatory \`tenantId\` partition key for native multi-tenant workspace security.\n3. **AppSpec (Infrastructure Map)**:\n   * **Purpose**: Deploys web endpoints, page layout hierarchies, middleware hook definitions, and responsive frontend routes.`;
    } else if (msgLower.includes('error') || msgLower.includes('repair') || msgLower.includes('validate') || msgLower.includes('healed') || msgLower.includes('compliance') || msgLower.includes('validator')) {
      return `### AppForge AI Code Integrity & Auto-Healing Core\n\nThe system validator executes strict structural alignment checks to prevent microvm cold-starts or container crashes.\n\n#### Validation Pipeline Rules:\n1. **Multi-Tenant Security Enforcement**:\n   * Audits state machines and schemas to ensure every table block possesses a \`tenantId\` field. This ensures rigorous logical isolation between enterprise users.\n2. **Page-to-API Route Compliance**:\n   * Insures all visual elements map cleanly to active REST routes in the backend runtime.\n3. **Typescript Strict Checks**:\n   * Verifies imports and model types prior to code bundle emissions using Vite & Express.\n\n#### Interactive Auto-Healing Logic:\nWhen an inconsistency is detected, the **Compliant Healing** engine runs the following repairs:\n* \`field_repair\`: Automatically appends missing tenant keys into standard entities.\n* \`consistency_repair\`: Truncates mismatched navigation components to maintain clean UI routing.\n\n*You can trigger a manual schema repair on any invalid active blueprint in the **Build Blueprints** workspace tab.*`;
    } else if (msgLower.includes('integration') || msgLower.includes('hook') || msgLower.includes('slack') || msgLower.includes('stripe') || msgLower.includes('whatsapp') || msgLower.includes('gmail') || msgLower.includes('sheet') || msgLower.includes('jira') || msgLower.includes('adapter')) {
      return `### High-Performance Workspace Cloud Adapters\n\nAppForgeAI features full-stack adapters connected directly through secure OAuth and credential tunnels.\n\n*To activate, configure your web credentials in the **Cloud Adapters** configuration rail.*`;
    } else if (msgLower.includes('database') || msgLower.includes('schema') || msgLower.includes('relation') || msgLower.includes('model') || msgLower.includes('table') || msgLower.includes('entity')) {
      return `### Multi-Tenant Relational Database Orchestration\n\nWithin the AppForge AI generator, your data structure is compiled into isolated virtual layers:\n\n| Concept | Implementation Strategy | Multi-Tenant Isolate Key |\n| :--- | :--- | :--- |\n| **Workspace Tenant Partition** | Automatic field filter injection | Enforced by \`tenantId: string\` |\n| **Relationship Mapping** | Standard Foreign Key constraint generation | Relational index tracking |\n| **Schema Validation Audit** | Automatic structure-to-query comparison | Healed by Compliant Validator |`;
    } else if (msgLower.includes('project') || msgLower.includes('acme') || msgLower.includes('taskflow') || msgLower.includes('healthlink') || msgLower.includes('socialverse') || msgLower.includes('catalog')) {
      return `### Active Workspace Project Records Catalog\n\n*Manage, clone, or delete these deployments by visiting the **Developer Hub** under the Projects catalogue tab.*`;
    } else if (msgLower.includes('backlog') || msgLower.includes('task') || msgLower.includes('todo') || msgLower.includes('kanban')) {
      return `### Integrated Scrum Kanban Backlog\n\n*Update, create, or re-order these cards using the interactive Kanban board situated inside the **Monitor** dashboard.*`;
    } else if (msgLower.includes('bridge') || msgLower.includes('sync') || msgLower.includes('daemon') || msgLower.includes('hostname') || msgLower.includes('connection')) {
      return `### AppForge Daemon Tunnel Status\n\nThe local background bridge keeps cloud files synchronized with your desktop workspace daemon.\n\n*You can test reconnection routines or toggle simulator states in the **Platform Settings** hub.*`;
    } else {
      return `### Welcome to your Senior Workspace AI Advisor!\n\nI am ready to provide powerful, structure-aware responses regarding your code, database schemas, and micro-vm microservices.\n\nHere is a list of specific deep topics you can ask me to analyze now:\n1. **Explain Blueprint Contracts**: "Explain the components inside an active AppSpec model?" or "How does multi-tenant security isolate rows?"\n2. **Schema & Databases**: "How do you generate relational foreign keys for new data schemas?"\n3. **Healing & Validations**: "How does the repair engine work?"\n4. **Workspace Integrations**: "List available OAuth slack webhooks."`;
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || sending) return;

    const userMsg = messageText;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setSending(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: activeJob ? {
            appName: activeJob.appIntent?.appName,
            appType: activeJob.appIntent?.appType,
            entitiesCount: activeJob.dataSchema?.entities?.length,
            valid: activeJob.validation?.valid,
            errorsCount: activeJob.validation?.errors?.length || 0,
            repairsCount: activeJob.repairLog?.length || 0
          } : {}
        })
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [
            ...prev,
            { sender: 'assistant', text: data.answer, timestamp: new Date() }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            { 
              sender: 'assistant', 
              text: `⚠️ **Workspace AI Engine Alert**\n\n${data.error || "Review engine connection bottleneck."}\n\n*General Advisor Status: Standard offline model loaded (Telemetry Code: GEMINI_PENDING_SECRETS)*\n\nPlease activate real-time answers by defining process.env.GEMINI_API_KEY inside the **Settings > Secrets** panel.`, 
              timestamp: new Date() 
            }
          ]);
        }
      } else {
        throw new Error("HTTP connection failed or non-JSON response");
      }
    } catch (e: any) {
      const fallbackAnswer = getFallbackAnswer(userMsg);
      setMessages(prev => [
        ...prev,
        { 
          sender: 'assistant', 
          text: fallbackAnswer, 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessageBadge(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-mono flex flex-col items-end">
      
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] sm:w-[420px] h-[540px] bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-[#070709] border-b border-white/10 px-4.5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="w-4.5 h-4.5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-black shadow-sm" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold leading-none">Senior AI Advisor</h4>
                <p className="text-[9px] text-[#1e90ff] mt-1 uppercase tracking-widest font-bold">AppForge AI Engine Active</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4.5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-black/20"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-6.5 h-6.5 rounded-md border flex items-center justify-center shrink-0 text-xs ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 font-bold' 
                    : 'bg-[#141416] border-white/15 text-emerald-400 font-bold'
                }`}>
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-3 rounded-lg text-[10.5px] leading-relaxed relative overflow-hidden font-sans ${
                  msg.sender === 'user'
                    ? 'bg-zinc-900 border border-white/5 text-white'
                    : 'bg-[#070707] border border-white/10 text-zinc-300'
                }`}>
                  <div className="space-y-1.5 whitespace-pre-wrap">
                    {msg.text.split('\n').map((line, lineIdx) => {
                      if (line.startsWith('- ')) {
                        return (
                          <div key={lineIdx} className="flex gap-2 items-start pl-2 text-zinc-300">
                            <span className="text-[#10e28e] mt-1 shrink-0">•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      return <p key={lineIdx}>{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2.5 items-center text-zinc-500 text-[9px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                <span>Advisor is indexing blueprint schema contracts...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions presets in dialog */}
          <div className="px-4.5 py-1.5 border-t border-white/5 bg-[#080809] flex flex-wrap gap-1.5">
            {presets.slice(0, 3).map((pr, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(pr)}
                disabled={sending}
                className="text-[9px] px-2 py-1 border border-white/5 bg-[#101012] hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-all cursor-pointer truncate max-w-full font-mono"
              >
                {pr}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form 
            onSubmit={handleFormSubmit} 
            className="p-3 bg-[#070709] border-t border-white/10 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Advisor on active schema..."
              disabled={sending}
              className="flex-1 bg-black/60 border border-white/10 rounded-md py-2 px-3 text-[11px] font-mono text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`p-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                sending || !input.trim()
                  ? 'bg-zinc-800 text-zinc-600 border border-white/5 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Circular Action Trigger Button */}
      <button
        onClick={toggleChat}
        className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(30,144,255,0.45)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] cursor-pointer select-none relative group border border-white/20"
      >
        <Bot className="w-6 h-6 animate-pulse" />
        
        {/* Glowing online status dot */}
        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0c0c0e] shadow flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </span>

        {/* Dynamic New Message Attention Badge */}
        {hasNewMessageBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-[8px] font-bold text-white rounded-full uppercase tracking-widest border border-black animate-bounce">
            Live
          </span>
        )}

        {/* Hover Tooltip */}
        {!isOpen && (
          <div className="absolute right-15 px-3 py-1.5 bg-zinc-950 border border-white/10 text-[9px] uppercase tracking-wider text-zinc-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl shadow-black/80 font-mono">
            AppForge Advisor Active
          </div>
        )}
      </button>

    </div>
  );
}
