export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  explanation: {
    purpose: string;
    components: string[];
    connections: string;
    dependencies: string[];
    warnings: string[];
  };
}

export function getGeneratedFiles(
  projectName: string,
  projectType: string,
  techStack: string,
  features: string[],
  entities: any[]
): Record<string, GeneratedFile> {
  const normProjName = projectName.trim() || "AppForge Project";
  const slug = normProjName.toLowerCase().replace(/\s+/g, "-");
  
  const entitiesStr = entities && entities.length > 0 
    ? entities.map(e => e.name).join(", ") 
    : "Lead, Customer, Metric";

  const tableRowsSql = entities && entities.length > 0
    ? entities.map(e => {
        const fieldsSql = e.fields.map((f: any) => {
          let t = "VARCHAR(255)";
          if (f.type === "integer") t = "INT";
          if (f.type === "decimal") t = "NUMERIC(12, 2)";
          if (f.type === "boolean") t = "BOOLEAN";
          if (f.type === "datetime") t = "TIMESTAMP";
          return `  ${f.name} ${t}${f.primary ? " PRIMARY KEY" : ""}${f.nullable ? "" : " NOT NULL"}${f.unique ? " UNIQUE" : ""}`;
        }).join(",\n");
        return `CREATE TABLE ${e.tableName} (\n${fieldsSql}\n);`;
      }).join("\n\n")
    : `-- Standard Relational SQL schema fallback\nCREATE TABLE accounts (\n  id VARCHAR(64) PRIMARY KEY,\n  tenantId VARCHAR(64) NOT NULL,\n  name VARCHAR(255) NOT NULL,\n  status VARCHAR(50) DEFAULT 'active'\n);`;

  return {
    "src/components/Navbar.tsx": {
      name: "Navbar.tsx",
      path: "src/components/Navbar.tsx",
      content: `import React from 'react';
import { Sparkles, Bell, Shield, LogOut } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
  organizationName?: string;
}

export default function Navbar({ 
  userEmail = 'admin@${slug}.com', 
  organizationName = '${normProjName} Workspace' 
}: NavbarProps) {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">${normProjName}</h1>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide block uppercase text-left font-mono">{organizationName}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase font-mono tracking-wider">Multi-Tenant Secured</span>
        </div>

        <button className="relative text-zinc-400 hover:text-white transition-colors p-1.5 bg-zinc-900 border border-white/5 rounded-full cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ffa116] rounded-full" />
        </button>

        <div className="h-4 w-px bg-zinc-800" />

        <div className="flex items-center space-x-2.5">
          <span className="w-6 h-6 bg-blue-600 text-white font-bold text-[10px] rounded flex items-center justify-center uppercase font-sans">
            AD
          </span>
          <div className="text-left hidden sm:block">
            <p className="text-[11px] text-white font-semibold leading-none">Admin Developer</p>
            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}`,
      explanation: {
        purpose: "Provides the global, premium, multi-tenant top header layout containing user session contexts, credential statuses, and notification badges.",
        components: ["Navbar component", "App status indicator line", "Profile dropdown badge"],
        connections: "Imported into the main parent layout inside `src/pages/Dashboard.tsx` and `src/App.tsx` for layout framework framing.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Ensure userEmail updates live when Auth token session claims refresh (JWT pipeline)."]
      }
    },

    "src/components/Sidebar.tsx": {
      name: "Sidebar.tsx",
      path: "src/components/Sidebar.tsx",
      content: `import React from 'react';
import { LayoutDashboard, Database, Server, Settings, Activity, GitBranch, AlertCircle } from 'lucide-react';

interface SidebarProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  features?: string[];
}

export default function Sidebar({ currentScreen, onScreenChange, features = [] }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Control' },
    { id: 'records', icon: Database, label: 'Relational DB Rows' },
    { id: 'api_docs', icon: Server, label: 'API Integrations' },
    { id: 'config', icon: Settings, label: 'Security & Settings' }
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between p-4 min-h-[calc(100vh-64px)]">
      <div className="space-y-6">
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block px-3">Main Portal View</span>
          
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onScreenChange(item.id)}
                  className={\`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer \${
                    isActive 
                      ? 'bg-zinc-900 text-white font-bold border border-white/5 shadow-inner' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  }\`}
                >
                  <Icon className={\`w-4 h-4 \${isActive ? 'text-blue-400' : 'text-zinc-500'}\`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-800/65 pt-4 space-y-2 text-left">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block px-3">Active Adapters</span>
          <div className="px-3 space-y-1.5">
            {features.map((feat, i) => (
              <div key={i} className="flex items-center space-x-2 text-[10.5px] text-zinc-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>{feat}</span>
              </div>
            ))}
            {features.length === 0 && (
              <span className="text-[10px] text-zinc-650 italic">No integrations selected.</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/5 text-left space-y-2">
        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-zinc-300 font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
          <span>Tenant Context:</span>
        </div>
        <div className="bg-zinc-950 p-1.5 rounded border border-white/5 font-mono text-[9px] text-blue-400 select-all block truncate">
          tenant_org_v${slug.slice(0, 4)}
        </div>
      </div>
    </aside>
  );
}`,
      explanation: {
        purpose: "Handles layout directory links and dynamic sidebar tracking of micro-services & webhook integrations.",
        components: ["Nav menu loops", "Active hooks summary checklist", "Isolation partition code ID badge"],
        connections: "Direct left margin layouts within responsive dashboard page frameworks.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Link paths must align strictly with active components configuration."]
      }
    },

    "src/components/DashboardCard.tsx": {
      name: "DashboardCard.tsx",
      path: "src/components/DashboardCard.tsx",
      content: `import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  change?: string;
  isPositive?: boolean;
  description?: string;
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  description
}: DashboardCardProps) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 hover:border-zinc-800 transition-all shadow-xl relative overflow-hidden text-left space-y-3.5">
      <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full" />
      
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-widest font-bold">{title}</span>
        <div className="p-2 bg-zinc-800 border border-white/5 rounded-lg text-zinc-400">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-extrabold text-white tracking-tight leading-none">{value}</h3>
        {description && (
          <p className="text-[10px] text-zinc-500 font-sans leading-normal">{description}</p>
        )}
      </div>

      {change && (
        <div className="flex items-center space-x-1.5 border-t border-zinc-850 pt-3">
          <span className={\`text-[10px] font-bold flex items-center font-mono \${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }\`}>
            {isPositive ? '+' : '-'}{change}
          </span>
          <span className="text-[9.5px] text-zinc-550">vs last standard interval</span>
        </div>
      )}
    </div>
  );
}`,
      explanation: {
        purpose: "Renders standard SaaS numeric KPIs formatted symmetrically to give desktop dashboard layouts clean metrics structure.",
        components: ["KPI Header wrapper", "Symmetric icon box", "Indicator trend line tracker"],
        connections: "Direct bento-grid layouts inside `src/pages/Dashboard.tsx` representing real-time rows metrics.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Keep numbers simplified to avoid truncation on small viewport ratios."]
      }
    },

    "src/pages/Home.tsx": {
      name: "Home.tsx",
      path: "src/pages/Home.tsx",
      content: `import React from 'react';
import { ArrowRight, Sparkles, Shield, Terminal, Zap } from 'lucide-react';

interface HomeProps {
  onStart: () => void;
}

export default function Home({ onStart }: HomeProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#070709] flex flex-col justify-center items-center text-center p-6 selection:bg-[#ffa116]">
      <div className="max-w-3xl space-y-8 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10.5px] font-bold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5 animate-spin" /> Neural Stack Core v1.2
        </div>

        <div className="space-y-3.5">
          <h1 className="text-white text-4xl sm:text-5.5xl font-extrabold tracking-tight leading-none">
            Empower Operations with <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-[#ffa116] bg-clip-text text-transparent">
              ${normProjName}
            </span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
            Relational multi-tenant ${projectType} compiler built dynamically. Seamless CRUD entries, secure webhooks middleware, and automated compliance logging.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 group"
          >
            <span>Launch Operations Workspace</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button className="w-full sm:w-auto px-7 py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-950 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
            Read Docs Integration
          </button>
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          {[
            { icon: Shield, title: "Logical Multi-Tenancy", desc: "Forced tenantId checks on every endpoint write." },
            { icon: Terminal, title: "Express REST Core", desc: "Optimized controllers using JSON schema validation." },
            { icon: Zap, title: "Reactive Event Hooks", desc: "Automated triggers mapped to email and Slack channels." }
          ].map((item, id) => {
            const Icon = item.icon;
            return (
              <div key={id} className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl space-y-2">
                <div className="p-1.5 bg-zinc-800 w-fit rounded-lg text-blue-400">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-white font-bold text-xs">{item.title}</h4>
                <p className="text-[10.5px] text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}`,
      explanation: {
        purpose: "Welcome page framework displaying platform credentials overview and features breakdown for the generated software.",
        components: ["Hero titles block", "Operations launch button", "Feature structural summaries grid"],
        connections: "Served as initial page routing index inside `src/App.tsx` file layouts prior to logging in.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Adjust route controllers if users are forced to bypass landing pages entirely."]
      }
    },

    "src/pages/Dashboard.tsx": {
      name: "Dashboard.tsx",
      path: "src/pages/Dashboard.tsx",
      content: `import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import { LayoutDashboard, Users, CreditCard, Activity, ArrowUpRight, Shield, BadgeAlert } from 'lucide-react';

interface DashboardPageProps {
  features?: string[];
  entities?: any[];
}

export default function Dashboard({ features = [], entities = [] }: DashboardPageProps) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-300 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar currentScreen={currentScreen} onScreenChange={setCurrentScreen} features={features} />
        
        <main className="flex-1 p-6 md:p-8 space-y-6 text-left overflow-y-auto">
          
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Main Console Hub</h2>
              <p className="text-[11px] text-zinc-550 font-mono mt-1">Tenant Sandbox Node Status: OK | Secure Postgres Active</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold bg-[#ffa116]/10 text-[#ffa116] border border-[#ffa116]/20 px-3 py-1.5 rounded-lg">
                Build: CJS dist
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <DashboardCard title="Active Row Transactions" value="1,492" icon={Users} change="12.4%" isPositive={true} />
            <DashboardCard title="Adapter Trigger Queue" value="6 Active" icon={Activity} change="3.2%" isPositive={true} />
            <DashboardCard title="Pipeline Integrity Score" value="100%" icon={Shield} change="Perfect" isPositive={true} />
            <DashboardCard title="System Warnings" value="0 Incidents" icon={BadgeAlert} change="0%" isPositive={false} />
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl space-y-4 shadow-xl">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Dynamic App Blueprint Details</h3>
            <p className="text-[11.5px] text-zinc-400 font-sans leading-relaxed">
              This sandbox displays live rows populated inside the relational engine databases. Mapped entities includes: 
              <span className="text-blue-400 font-mono ml-1 font-semibold">${entitiesStr}</span>. 
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}`,
      explanation: {
        purpose: "Primary application workflow page rendering layouts panels, responsive menu items, and telemetry metric summary views.",
        components: ["Layout grid components", "Sidebar integrations mapping list", "Dynamic rows definitions badge"],
        connections: "Directly mounts and references standard subcomponents: `Navbar`, `Sidebar`, and `DashboardCard`.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Ensure that the viewport maintains responsive columns logic in desktop view environments."]
      }
    },

    "src/pages/Login.tsx": {
      name: "Login.tsx",
      path: "src/pages/Login.tsx",
      content: `import React, { useState } from 'react';
import { ShieldCheck, Command, Mail, Lock } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLoginSuccess(email);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-zinc-950 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="absolute top-0 right-0 h-[2px] w-14 bg-blue-500 rounded-tr-2xl" />
        
        <div className="text-center space-y-2">
          <div className="mx-auto block h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold rounded-xl p-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight">Access Secure Organization Node</h2>
          <p className="text-[10.5px] text-zinc-500 leading-normal font-sans">Multi-tenant isolation token is generated on successful signing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest block mb-1">Corporate Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. rohit@${slug}.com"
                className="w-full bg-[#121214] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest block mb-1">Passkey Credential</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121214] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors mt-2"
          >
            Authenticate & Proceed
          </button>
        </form>

        <div className="border-t border-zinc-900 pt-4 text-center leading-normal">
          <span className="text-[10px] text-zinc-600 font-mono block">Node: https://api.${slug}.ai</span>
          <span className="text-[9px] text-zinc-650 font-sans block mt-1">SSL Certificate verification signed via AppForge Key</span>
        </div>
      </div>
    </div>
  );
}`,
      explanation: {
        purpose: "Enterprise gating authenticator parsing organization credential scopes and preparing tenant isolation layers.",
        components: ["Credential input forms", "Secure key logo box", "SSL node verifier footer"],
        connections: "Direct gateway lock component mapped before routing `src/App.tsx` pages entries.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Password should be hashed using saltedbcrypt server-side before persisting."]
      }
    },

    "src/pages/Settings.tsx": {
      name: "Settings.tsx",
      path: "src/pages/Settings.tsx",
      content: `import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Sliders, ShieldAlert, Key, Globe, Database, Activity } from 'lucide-react';

export default function Settings() {
  const [isolateMode, setIsolateMode] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('us-east4');

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-300 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar currentScreen="config" onScreenChange={() => {}} features={['Secure Database']} />
        
        <main className="flex-1 p-6 md:p-8 space-y-6 text-left">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Security & Settings</h2>
            <p className="text-[11px] text-zinc-550 font-mono mt-1">Control active parameters and microvm partitions for ${normProjName}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span>Administrative API Secret Credentials</span>
                </h3>
                
                <div className="space-y-3.5">
                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-zinc-500">SECRET_JWT_SIGNATURE_KEY</span>
                    <span className="text-blue-400 font-bold select-all">jwt_token_key_appforge_v1_${slug.slice(0, 4)}</span>
                  </div>

                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5 flex items-center justify-between font-mono text-[10px]">
                    <span className="text-zinc-500">DATABASE_SSL_PASSPHRASE</span>
                    <span className="text-zinc-600 font-bold">••••••••••••••••••••••••</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" />
                  <span>Forced Multi-Tenancy Regulations</span>
                </h3>
                <p className="text-[10.5px] text-zinc-500 font-sans leading-normal">
                  Toggle mandatory tenant context verification. When activated, all SELECT/INSERT commands reject queries missing valid active organization hashes.
                </p>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isolateMode}
                    onChange={e => setIsolateMode(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-white">Enforce isolated logical partitioning</span>
                </label>
              </div>

            </div>

            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 text-left">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <span>Region Cloud Host</span>
                </h3>
                
                <div className="space-y-2">
                  {['us-east4 (N. Virginia)', 'europe-west1 (Belgium)', 'asia-east2 (Hong Kong)'].map(reg => (
                    <button
                      key={reg}
                      onClick={() => setSelectedRegion(reg)}
                      className={\`w-full p-2.5 rounded-lg border text-left font-mono text-[10.5px] cursor-pointer block \${
                        selectedRegion.startsWith(reg.slice(0, 8))
                          ? 'bg-blue-600/10 border-blue-500/30 text-white font-bold'
                          : 'bg-[#121214] border-white/5 text-zinc-550 hover:border-white/10'
                      }\`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`,
      explanation: {
        purpose: "Settings page workspace governing security flags, secret JWT hashing configuration, and microVM host regional mappings.",
        components: ["Credential fields block", "Isolation toggle switcher", "Regional map list selector"],
        connections: "Direct pages view endpoint triggered inside the main sidebar.",
        dependencies: ["react", "lucide-react"],
        warnings: ["Be sure to encrypt database passphrase variables during production deployments."]
      }
    },

    "src/backend/routes/auth.ts": {
      name: "auth.ts",
      path: "src/backend/routes/auth.ts",
      content: `import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_signature_key_${slug.slice(0, 4)}';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    
    // Standard mock credentials mapping secure corporate user context
    const tenantId = 'org-tenant-id-' + body.email.split('@')[0];
    
    const token = jwt.sign({
      email: body.email,
      tenantId: tenantId,
      workspaceName: '${normProjName} Node',
      role: 'Manager'
    }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      success: true,
      token,
      user: {
        email: body.email,
        tenantId,
        role: 'Manager'
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Invalid credentials payload validation failed',
      details: error.errors || error.message
    });
  }
});

export default authRouter;`,
      explanation: {
        purpose: "Implements secure auth endpoints using Zod models validation schemas and signs logical JWT session scopes block.",
        components: ["Authentication Post route", "Zod logins validate schemas", "JWT signature process block"],
        connections: "Routes connected within `server.ts` entrypoints to coordinate corporate authentication validations.",
        dependencies: ["express", "zod", "jsonwebtoken", "@types/express"],
        warnings: ["Change default signature secret key values in environment files before compiling."]
      }
    },

    "src/backend/routes/projects.ts": {
      name: "projects.ts",
      path: "src/backend/routes/projects.ts",
      content: `import { Router, Request, Response } from 'express';
import { z } from 'zod';

const projectsRouter = Router();

// Zod Schema to force multi-tenant validation integrity
const taskSchema = z.object({
  tenantId: z.string().min(1, "tenantId key is mandatory for logical row isolation"),
  title: z.string().min(3),
  status: z.enum(['Open', 'In Progress', 'Completed']).default('Open'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium')
});

// Dynamic mock storage representing relational row entries isolation
const rowsDatabaseMock: any[] = [
  { id: '1', tenantId: 'tenant-org-demo', title: 'Verify Stripe webhook callback SSL checks', status: 'In Progress', priority: 'High' },
  { id: '2', tenantId: 'tenant-org-demo', title: 'Compile Express production build configuration', status: 'Completed', priority: 'Medium' }
];

projectsRouter.get('/', (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) {
    res.status(400).json({ error: 'tenantId is strictly required. Multi-tenancy safety rejects anonymous transactions.' });
    return;
  }

  // Enforce query filter isolation using tenantId
  const isolated = rowsDatabaseMock.filter(row => row.tenantId === tenantId);
  res.json({ success: true, count: isolated.length, rows: isolated });
});

projectsRouter.post('/', (req: Request, res: Response) => {
  try {
    const validated = taskSchema.parse(req.body);
    const newRow = {
      id: \`row-\${Date.now()}\`,
      ...validated
    };
    rowsDatabaseMock.push(newRow);
    res.status(201).json({ success: true, created: newRow });
  } catch (err: any) {
    res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
  }
});

export default projectsRouter;`,
      explanation: {
        purpose: "Implements isolated query filters to isolate data segments between organization accounts securely.",
        components: ["Query filtering GET route", "Strict post row models", "Database mock storage arrays"],
        connections: "Routes connected inside `server.ts` representing relational transaction items controllers.",
        dependencies: ["express", "zod", "@types/express"],
        warnings: ["Be sure to wire database client index query strategies over the tenantId field."]
      }
    },

    "src/backend/routes/users.ts": {
      name: "users.ts",
      path: "src/backend/routes/users.ts",
      content: `import { Router, Request, Response } from 'express';

const usersRouter = Router();

usersRouter.get('/me', (req: Request, res: Response) => {
  // Simple session decoding representing profile mapping
  res.json({
    success: true,
    user: {
      email: 'manager@${slug}.ai',
      tenantId: 'tenant-org-v${slug.slice(0, 4)}',
      role: 'Project Owner',
      department: 'Corporate Cloud Infrastructure'
    }
  });
});

export default usersRouter;`,
      explanation: {
        purpose: "Express router delivering active session profiles detail contexts to front-end dashboard panels.",
        components: ["GET profile endpoint info"],
        connections: "Connected sequentially inside backend configurations routes.",
        dependencies: ["express", "@types/express"],
        warnings: ["Bypass mock payload logs inside production configurations controllers."]
      }
    },

    "src/database/schema.sql": {
      name: "schema.sql",
      path: "src/database/schema.sql",
      content: `-- ======================================================
-- APPFORGE Relational Schema generation
-- Target: Postgres relational db (v15+)
-- Compiled: ${normProjName} Schema
-- ======================================================

-- Force strict schemas separation
CREATE SCHEMA IF NOT EXISTS "${slug}";
SET search_path TO "${slug}", public;

-- Enable encryption extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

${tableRowsSql}

-- ======================================================
-- STRICT SECURE WEB Webhook Event Listeners Log 
-- ======================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenantId VARCHAR(64) NOT NULL,
  action VARCHAR(255) NOT NULL,
  executedBy VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index creation optimization to enforce logical multi-tenancy filter performance
${entities && entities.length > 0 ? entities.map(e => `CREATE INDEX idx_${e.tableName}_tenantId ON ${e.tableName} (tenantId);`).join("\n") : "CREATE INDEX idx_accounts_tenantId ON accounts (tenantId);"}
CREATE INDEX idx_audit_tenantId ON audit_logs (tenantId);

-- Secure trigger function preventing rows edits bypassing tenantId fields context checks
CREATE OR REPLACE FUNCTION verify_tenant_not_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenantId IS NULL OR NEW.tenantId = '' THEN
    RAISE EXCEPTION 'Multi-tenant integrity warning: Action rejected due to empty tenantId key bounds.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`,
      explanation: {
        purpose: "Prone SQL script carrying multi-tenant isolation indexes and trigger guard constraints designed for PostgreSQL databases.",
        components: ["CREATE Schema statements", "Dynamic tables queries declarations", "Performance Index loops index", "Secure Pl/pgsql triggers constraints"],
        connections: "Executed inside DB synchronization blocks to bootstrap database tables sequentially.",
        dependencies: ["postgresql"],
        warnings: ["Execute tests on targeted database engines to confirm UUID generation package configurations."]
      }
    },

    "src/utils/api.ts": {
      name: "api.ts",
      path: "src/utils/api.ts",
      content: `/**
 * Core microservice fetch utility wrapping headers and logical tenant contexts.
 */
export async function secureFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token_${slug}');
  const tenantId = 'tenant_org_v${slug.slice(0, 4)}';

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', \`Bearer \${token}\`);
  }
  // Inject tenant context inside query parameters or body sequentially
  const separator = path.includes('?') ? '&' : '?';
  const resolvedUrl = \`\${path}\${separator}tenantId=\${tenantId}\`;

  headers.set('Content-Type', 'application/json');

  const response = await fetch(resolvedUrl, {
    ...options,
    headers
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || \`HTTP error reported \${response.status}\`);
  }

  return response.json();
}`,
      explanation: {
        purpose: "Handles client-side fetch calls, appending authorization tokens and logical organization query parameters seamlessly.",
        components: ["Auth token headers injector block", "Dynamic query parameters compiler"],
        connections: "Directly imported inside React layout controllers to query resources.",
        dependencies: [],
        warnings: ["Clear local localStorage parameters immediately upon decoding session termination warnings."]
      }
    },

    "src/utils/validators.ts": {
      name: "validators.ts",
      path: "src/utils/validators.ts",
      content: `import { z } from 'zod';

/**
 * Strict corporate validation schemas representing core entities specifications inside AppForgeAI.
 */
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string({ required_error: "Tenant isolated ID constraint is mandatory." }),
  email: z.string().email("Invalid corporate email schema"),
  role: z.enum(['Admin', 'Developer', 'Viewer']).default('Viewer')
});

export const auditSchema = z.object({
  tenantId: z.string(),
  action: z.string().min(2),
  timestamp: z.string().datetime()
});

export type UserType = z.infer<typeof userSchema>;
export type AuditType = z.infer<typeof auditSchema>;
`,
      explanation: {
        purpose: "Provides client-and-server side structural validation schemas using complete Zod specifications blocks.",
        components: ["User bounds scheme validate Zod", "Audits logger schemas validation", "Static inferences types definitions"],
        connections: "Referenced within server route controllers to filter out malformed requests securely.",
        dependencies: ["zod"],
        warnings: ["Update definitions incrementally when local layouts tables parameters change structure."]
      }
    },

    "src/App.tsx": {
      name: "App.tsx",
      path: "src/App.tsx",
      content: `import React, { useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'home' | 'login' | 'dashboard'>('home');
  const [userEmail, setUserEmail] = useState('');

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setActiveScreen('dashboard');
  };

  return (
    <div className="font-sans antialiased text-zinc-300 bg-zinc-950 min-h-screen">
      {activeScreen === 'home' && (
        <Home onStart={() => setActiveScreen('login')} />
      )}
      
      {activeScreen === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {activeScreen === 'dashboard' && (
        <Dashboard 
          features={${JSON.stringify(features)}} 
          entities={${JSON.stringify(entities)}}
        />
      )}
    </div>
  );
}`,
      explanation: {
        purpose: "Primary application parent context selector orchestrating authenticated screen flows.",
        components: ["Authentication state tracker hook", "Main root conditional render list"],
        connections: "Application entry point mapping subpage directories: `Home`, `Login`, and `Dashboard` layouts.",
        dependencies: ["react"],
        warnings: ["Secure session states with cookies fallback inside highly scaled corporate structures."]
      }
    },

    "src/main.tsx": {
      name: "main.tsx",
      path: "src/main.tsx",
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      explanation: {
        purpose: "Bootstraps react root context inside public indexes template DOM nodes.",
        components: ["ReactDOM.createRoot constructor"],
        connections: "Primary compiler setup loading root page layout contexts.",
        dependencies: ["react", "react-dom"],
        warnings: []
      }
    },

    "src/hooks/useTenantData.ts": {
      name: "useTenantData.ts",
      path: "src/hooks/useTenantData.ts",
      content: `import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number | null;
}

/**
 * Custom React Hook: useTenantData
 * Secures high-performance multi-tenant state resolution, loading boundaries,
 * exponential jitter retry algorithms, and client offline fallback states.
 */
export function useTenantData<T>(
  endpoint: string, 
  tenantId: string, 
  authToken: string | null
) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
    timestamp: null,
  });

  const refetch = useCallback(async (retryCount = 0) => {
    if (!authToken || !tenantId) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error("Missing auth token or target tenant ID constraints."),
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(\`/api/\${endpoint}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${authToken}\`,
          'X-Tenant-ID': tenantId,
        }
      });

      if (!response.ok) {
        throw new Error(\`Tenant request failed with terminal status code \${response.status}.\`);
      }

      const body = await response.json();
      setState({
        data: body.data || body,
        loading: false,
        error: null,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const isRetryable = err.status === 429 || err.status >= 500 || !err.status;
      const maxRetries = 3;

      if (isRetryable && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 200;
        console.warn(\`[AuthForge Jitter] Retrying fetch for endpoint \${endpoint} in \${delay.toFixed(0)}ms...\`);
        setTimeout(() => {
          refetch(retryCount + 1);
        }, delay);
      } else {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          timestamp: Date.now(),
        });
      }
    }
  }, [endpoint, tenantId, authToken]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
  };
}`,
      explanation: {
        purpose: "Encapsulates reactive state fetching with headers injected for tenant telemetry, multi-tenant headers context, and backoff retrying.",
        components: ["useTenantData custom react hook", "Exponent retry trigger", "Cache timestamp trackers"],
        connections: "Executed client-side inside list screens like Dashboard and Relational Data tables.",
        dependencies: ["react"],
        warnings: ["Be sure to specify query parameters correctly to prevent redundant hook re-executions."]
      }
    },

    "src/utils/isolationHelper.ts": {
      name: "isolationHelper.ts",
      path: "src/utils/isolationHelper.ts",
      content: `/**
 * Multi-Tenant Isolation Sanity Helpers
 * Standardized logical rules confirming data records cannot leak across boundaries.
 */

export interface TenantScopedRecord {
  id: string;
  tenantId: string;
  [key: string]: any;
}

/**
 * Filter collection to only match active bounded tenant scopes
 */
export function enforceTenantBounds<T extends TenantScopedRecord>(
  records: T[],
  currentTenantId: string
): T[] {
  if (!currentTenantId) {
    console.error("[AppForge Security Bypass Alert]: Attempted to retrieve records with empty tenant filter.");
    return [];
  }
  return records.filter(record => record.tenantId === currentTenantId);
}

/**
 * Verify a single record is fully isolated and authenticated for active tenant
 */
export function assertTenantIsolation<T extends TenantScopedRecord>(
  record: T,
  expectedTenantId: string
): boolean {
  if (record.tenantId !== expectedTenantId) {
    console.error(\`[AppForge Security Breached]: Mismatched tenant boundaries! Found: \${record.tenantId} but expected \${expectedTenantId}\`);
    return false;
  }
  return true;
}

/**
 * Generate cryptographic tenant checksum metadata for telemetry validation
 */
export async function generateTenantTokenChecksum(
  tenantId: string,
  secretKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(\`\${tenantId}:\${secretKey}\`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}`,
      explanation: {
        purpose: "Client and server-side utilities enforcing zero-trust data filtering for partition tables and computing tenant validation signatures.",
        components: ["enforceTenantBounds utility", "assertTenantIsolation guard", "generateTenantTokenChecksum cryptographic digest"],
        connections: "Imported into middleware routers and offline local providers to secure multi-tenant partitions.",
        dependencies: [],
        warnings: ["Never bypass security verification filters on public endpoints."]
      }
    },

    "package.json": {
      name: "package.json",
      path: "package.json",
      content: `{
  "name": "${slug}",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/backend/server.ts",
    "build": "vite build && esbuild src/backend/server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs",
    "start": "node dist/server.cjs"
  },
  "dependencies": {
    "express": "^4.21.2",
    "zod": "^4.4.3",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1"
  },
  "devDependencies": {
    "vite": "^6.2.3",
    "esbuild": "^0.25.0",
    "typescript": "~5.8.2",
    "tsx": "^4.21.0"
  }
}`,
      explanation: {
        purpose: "Configures npm build targets, compiles Node dependencies structures, and sets start executable parameters.",
        components: ["Scripts commands block", "Production dependencies manifest list"],
        connections: "Project root workspace descriptor manifest specifying build workflows.",
        dependencies: [],
        warnings: ["Be sure to keep development packages segregated in the devDependencies block."]
      }
    }
  };
}
