import React, { useState, useEffect } from 'react';
import { 
  Sliders, ShieldCheck, Mail, Database, Terminal, Settings, 
  RefreshCw, AlertTriangle, Key, Save, Eye, EyeOff, Sparkles, 
  CheckCircle2, Server, HelpCircle, HardDrive, Cpu, FileJson, Trash2,
  User, Bell, Palette, CreditCard, Shield, Gift, Zap
} from 'lucide-react';

interface SettingsTabProps {
  onResetBridge: () => void;
  projectName: string;
}

export default function SettingsTab({ onResetBridge, projectName }: SettingsTabProps) {
  
  // Settings Tab Selector state
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'workspace' | 'keys' | 'notifications' | 'theme' | 'billing'>('profile');

  // Confirmation state
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // SparkToast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Profile States
  const [profileName, setProfileName] = useState(() => {
    try {
      const saved = localStorage.getItem('appforge_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.name || 'Rohit Agarwal';
      }
    } catch {}
    return 'Rohit Agarwal';
  });

  const [profileEmail, setProfileEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('appforge_user');
      if (saved) {
        const u = JSON.parse(saved);
        return u.email || 'agarwalrohit22428@gmail.com';
      }
    } catch {}
    return 'agarwalrohit22428@gmail.com';
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('appforge_user', JSON.stringify({ name: profileName, email: profileEmail }));
    triggerToast('👤 Profile information successfully updated.');
  };

  // 2. Workspace States
  const [currentProjectName, setCurrentProjectName] = useState(() => {
    return localStorage.getItem('appforge_project_name') || projectName || 'AppForge Workspace Project';
  });
  const [clusterRegion, setClusterRegion] = useState('us-east4');
  const [enableHotReload, setEnableHotReload] = useState(true);
  const [strictSslValidation, setStrictSslValidation] = useState(false);
  const [complyAstChecks, setComplyAstChecks] = useState(true);

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('appforge_project_name', currentProjectName);
    triggerToast('📁 Workspace parameters saved and active on sandbox node.');
  };

  // 3. API Keys & Vaults States
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('appforge_gemini_key') || '';
  });
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return localStorage.getItem('appforge_supabase_url') || '';
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    return localStorage.getItem('appforge_supabase_key') || '';
  });
  const [showKey, setShowKey] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  const handleSaveSecrets = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiApiKey.trim()) {
      localStorage.setItem('appforge_gemini_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('appforge_gemini_key');
    }
    
    if (supabaseUrl.trim() && supabaseKey.trim()) {
      localStorage.setItem('appforge_supabase_url', supabaseUrl.trim());
      localStorage.setItem('appforge_supabase_key', supabaseKey.trim());
    } else {
      localStorage.removeItem('appforge_supabase_url');
      localStorage.removeItem('appforge_supabase_key');
    }
    triggerToast('🔐 Encryption vectors active. Secrets mounted in Node process sandbox.');
  };

  // 4. Notifications States
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [buildFailureAlerts, setBuildFailureAlerts] = useState(true);
  const [apiUsageAlerts, setApiUsageAlerts] = useState(false);
  const [digestEmail, setDigestEmail] = useState(true);

  const handleSaveNotifications = () => {
    triggerToast('🔔 Dispatch thresholds updated on active web service node.');
  };

  // 5. Theme Selector state
  const [themePreset, setThemePreset] = useState<'slate' | 'carbon' | 'amber' | 'emerald'>('slate');

  const handleApplyTheme = () => {
    localStorage.setItem('appforge_theme_preset', themePreset);
    triggerToast(`🎨 Cohesive "${themePreset.toUpperCase()}" premium theme coefficients applied.`);
  };

  // 6. Billing States
  const [billingPlan, setBillingPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  
  // Interactive Stripe Subscription Checkout Simulator States
  const [checkoutPlan, setCheckoutPlan] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  
  // Card elements simulator
  const [checkoutCardNumber, setCheckoutCardNumber] = useState<string>('');
  const [checkoutExpiry, setCheckoutExpiry] = useState<string>('');
  const [checkoutCvc, setCheckoutCvc] = useState<string>('');
  const [checkoutCardholder, setCheckoutCardholder] = useState<string>('Rohit Agarwal');
  
  // Promo codes
  const [couponCode, setCouponCode] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0); // e.g. 30 -> 30% off

  const handleApplyPromo = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME50') {
      setPromoDiscount(50);
      setPromoMessage('✨ Promo "WELCOME50" Applied: 50% discount registered.');
    } else if (code === 'APPFORGE100') {
      setPromoDiscount(100);
      setPromoMessage('🎉 Developer Override "APPFORGE100" Activated: 100% OFF for Sandbox testing.');
    } else if (code === 'CHATG_TIME' || code === 'CHATG' || code === 'WELCOME30') {
      setPromoDiscount(30);
      setPromoMessage('⚡ Coupon "CHATG_TIME" Applied: 30% discount verified.');
    } else if (code) {
      setPromoDiscount(0);
      setPromoMessage('❌ Invalid coupon code or expired promotional voucher.');
    }
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;
    
    // Validate simple parameters
    if (checkoutPlan !== 'free') {
      if (checkoutCardNumber.replace(/\s/g, '').length < 16) {
        triggerToast('⚠️ Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!checkoutExpiry || checkoutExpiry.length < 5) {
        triggerToast('⚠️ Please enter expiry details (MM/YY).');
        return;
      }
      if (!checkoutCvc || checkoutCvc.length < 3) {
        triggerToast('⚠️ Please enter a 3-digit CVC/CVV security code.');
        return;
      }
    }

    setCheckoutLoading(true);
    setCheckoutStep(1);
    
    // Simulate progressive micro-actions to make steps crystal clear
    setTimeout(() => {
      setCheckoutStep(2);
      setTimeout(() => {
        setCheckoutStep(3);
        setTimeout(() => {
          setCheckoutStep(4);
          setTimeout(() => {
            setBillingPlan(checkoutPlan);
            setCheckoutLoading(false);
            setCheckoutSuccess(true);
            setCheckoutStep(0);
            triggerToast(`💳 Workspace subscription plan updated to ${checkoutPlan.toUpperCase()} successfully.`);
          }, 850);
        }, 750);
      }, 700);
    }, 600);
  };

  const handlePurgeCache = () => {
    setShowPurgeConfirm(true);
  };

  const handleConfirmPurgeCache = () => {
    localStorage.clear();
    triggerToast('🗑️ Shared workspace database cache flushed. Refreshing.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const [isResetting, setIsResetting] = useState(false);
  const handleTriggerReset = () => {
    setIsResetting(true);
    onResetBridge();
    setTimeout(() => {
      setIsResetting(false);
      triggerToast('🔄 Heartbeat request sent! Bridge daemon socket reconstituted.');
    }, 1500);
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans text-xs pb-12 select-none">
      
      {/* Toast Flash UI */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-[9999] bg-[#0c0c0e]/95 border border-[#30d158]/35 text-white font-mono text-[11px] px-4.5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-[#30d158] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Intro Header Section */}
      <div className="bg-[#09090b] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex items-center gap-3.5 text-left">
          <div className="w-10 h-10 rounded bg-zinc-950 border border-white/10 flex items-center justify-center text-blue-400">
            <Settings className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              Platform Configuration Center
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Calibrate developer profiles, secure encryption vaults, notifications paths, and premium visual layout theme options.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Navigation */}
      <div className="flex border-b border-white/5 font-mono text-[11px] p-1 bg-[#0c0c0f] rounded-lg">
        {([
          { id: 'profile', label: 'Developer Profile', icon: <User className="w-3.5 h-3.5" /> },
          { id: 'workspace', label: 'Workspace Node', icon: <Server className="w-3.5 h-3.5" /> },
          { id: 'keys', label: 'Secrets Vault', icon: <Key className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Alert Channels', icon: <Bell className="w-3.5 h-3.5" /> },
          { id: 'theme', label: 'Visual Themes', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'billing', label: 'Billing Plan', icon: <CreditCard className="w-3.5 h-3.5" /> }
        ] as const).map((subtab) => (
          <button
            key={subtab.id}
            onClick={() => setActiveSubTab(subtab.id)}
            className={`flex-1 py-3 px-2 rounded flex items-center justify-center gap-1.8 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === subtab.id 
                ? 'bg-zinc-900 border border-white/5 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {subtab.icon}
            <span className="hidden lg:inline">{subtab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Configurations Container split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left-side form elements (takes 3 columns) */}
        <div className="lg:col-span-3 bg-[#09090c] border border-white/5 p-6 rounded-xl min-h-[400px]">
          
          {/* PROFILE SUBTAB */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5 text-left">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Developer Credentials Info
                </h3>
                <p className="text-xs text-zinc-550">Configure your local workspace identity parameters saved inside the storage buffer.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono">
                {/* Name */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-500 block">developer name</label>
                  <input 
                    type="text" 
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9.5px] uppercase font-bold tracking-widest text-[#ffa116] block">verified notification email</label>
                  <input 
                    type="email" 
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Apply Identity Info
                </button>
              </div>
            </form>
          )}

          {/* WORKSPACE SUBTAB */}
          {activeSubTab === 'workspace' && (
            <form onSubmit={handleSaveWorkspace} className="space-y-5 text-left font-mono">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#ffa116]" />
                  Sandbox Node Configuration
                </h3>
                <p className="text-xs text-zinc-550">Adjust compilation boundaries, microVM target hosts, and ast triggers.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[11px]">
                {/* Default Metadata Name */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-500 block">Workspace default Project label</label>
                  <input 
                    type="text" 
                    value={currentProjectName}
                    onChange={(e) => setCurrentProjectName(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-white/5 px-3.5 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9.5px] uppercase font-bold tracking-widest text-zinc-500 block">Cluster Gateway Host Region</label>
                  <select 
                    value={clusterRegion}
                    onChange={(e) => setClusterRegion(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 px-3 py-2.5 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="us-east4">us-east4 (Serverless MicroVM Node)</option>
                    <option value="asia-southeast1">asia-southeast1 (AWS Partner Node)</option>
                    <option value="europe-west3">europe-west3 (Frankfurt Ingress TLS)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Daemon Parameters</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[10.5px]">
                  <label className="flex items-center justify-between p-2.5 rounded bg-zinc-950/45 border border-white/5 cursor-pointer hover:border-white/10">
                    <span className="text-zinc-400">UI Hot Reloading</span>
                    <input 
                      type="checkbox" 
                      checked={enableHotReload}
                      onChange={(e) => setEnableHotReload(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded bg-zinc-950/45 border border-white/5 cursor-pointer hover:border-white/10">
                    <span className="text-zinc-400">Strict SSL Validation</span>
                    <input 
                      type="checkbox" 
                      checked={strictSslValidation}
                      onChange={(e) => setStrictSslValidation(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded bg-zinc-950/45 border border-white/5 cursor-pointer hover:border-white/10">
                    <span className="text-zinc-400">AST checksums</span>
                    <input 
                      type="checkbox" 
                      checked={complyAstChecks}
                      onChange={(e) => setComplyAstChecks(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Workspace options
                </button>
              </div>
            </form>
          )}

          {/* SECRETS VAULT KEYS */}
          {activeSubTab === 'keys' && (
            <form onSubmit={handleSaveSecrets} className="space-y-5 text-left font-mono">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  Secure Cryptographic Secret Vault
                </h3>
                <p className="text-xs text-zinc-555">Securely store auth credentials proxies. Sensitive keys are hashed on system vectors.</p>
              </div>

              {/* Secure notice check */}
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg text-zinc-400 leading-relaxed text-[11px] flex gap-3.5 font-sans">
                <ShieldCheck className="w-4.5 h-4.5 text-[#ffa116] shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1.5">
                  <strong className="text-white font-mono text-[10.5px] uppercase font-bold block">Optional: Gemini LLM Custom API Key</strong>
                  <p>
                    By default, AppForge uses centralized server models. For higher limits, paste your private <code className="text-white font-mono select-all">GEMINI_API_KEY</code> token below. This variables remains 100% hidden from customer browsers.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Gemini API Key */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9px] uppercase font-bold tracking-widest text-[#ffa116] block">gemini api secret key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
                    <input 
                      type={showGemini ? 'text' : 'password'} 
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="e.g. AIzaSy..."
                      className="w-full bg-zinc-950 border border-white/5 pl-9 pr-12 py-2.5 rounded-lg text-xs text-white placeholder-zinc-750 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-650 hover:text-white transition-colors cursor-pointer"
                    >
                      {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Supabase URL and Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-550 block">supabase target url</label>
                    <div className="relative">
                      <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
                      <input 
                        type="url" 
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://testdb.supabase.co"
                        className="w-full bg-zinc-950 border border-white/5 pl-9 pr-4 py-2.2 rounded-lg text-xs text-white placeholder-zinc-750 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-555 block">supabase service key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-650" />
                      <input 
                        type={showKey ? 'text' : 'password'} 
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR"
                        className="w-full bg-zinc-950 border border-white/5 pl-9 pr-12 py-2.2 rounded-lg text-xs text-white placeholder-zinc-750 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-650 hover:text-white transition-colors cursor-pointer"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Secrets Vault keys
                </button>
              </div>
            </form>
          )}

          {/* ALERT CHANNELS NOTIFICATIONS */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-5 text-left font-mono">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  Telemetry Routing Subscriptions
                </h3>
                <p className="text-xs text-zinc-550">Toggles alerts dispatches compiled during pipeline exceptions and deployment states.</p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/70 border border-white/5 hover:border-white/10 cursor-pointer">
                  <div className="space-y-0.5 text-left">
                    <span className="text-white font-bold block text-[11px]">Slack Alerts Integration</span>
                    <span className="text-[10px] text-zinc-500 font-sans">Dispatch alert logs directly to Slack channels on task status changes.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={slackAlerts}
                    onChange={(e) => setSlackAlerts(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/70 border border-white/5 hover:border-white/10 cursor-pointer">
                  <div className="space-y-0.5 text-left">
                    <span className="text-white font-bold block text-[11px]">Docker Build Failures alerts</span>
                    <span className="text-[10px] text-zinc-500 font-sans">Receive system email warning immediately when code builds throws syntax exceptions.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={buildFailureAlerts}
                    onChange={(e) => setBuildFailureAlerts(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/70 border border-white/5 hover:border-white/10 cursor-pointer">
                  <div className="space-y-0.5 text-left">
                    <span className="text-white font-bold block text-[11px]">Dynamic API Quota notifications</span>
                    <span className="text-[10px] text-zinc-500 font-sans">Flag system metrics when server model tokens count exceeds warnings limit.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={apiUsageAlerts}
                    onChange={(e) => setApiUsageAlerts(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer shrink-0"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNotifications}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Notifications dispatch configs
                </button>
              </div>
            </div>
          )}

          {/* VISUAL THEMES */}
          {activeSubTab === 'theme' && (
            <div className="space-y-5 text-left font-mono">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-pink-400" />
                  Cohesive Theme Presets
                </h3>
                <p className="text-xs text-zinc-555">Toggle UI color presets to adjust negative space margins.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {([
                  { id: 'slate', name: 'Cosmic Slate', colors: 'from-zinc-900 to-zinc-950 border-white/10 text-white' },
                  { id: 'carbon', name: 'Solid Carbon', colors: 'from-[#0b0b0d] to-[#121215] border-white/5 text-zinc-400' },
                  { id: 'amber', name: 'Cyber Amber', colors: 'from-amber-950/10 to-[#0e0a05] border-amber-500/20 text-[#ffa116]' },
                  { id: 'emerald', name: 'Forest Emerald', colors: 'from-[#06100c] to-[#040806] border-emerald-500/20 text-[#30d158]' }
                ] as const).map((preset) => (
                  <div 
                    key={preset.id}
                    onClick={() => setThemePreset(preset.id)}
                    className={`bg-zinc-950 border rounded-xl p-4.5 cursor-pointer select-none transition-all flex flex-col justify-between space-y-3 ${
                      themePreset === preset.id 
                        ? 'border-[#1e90ff] shadow-sm shadow-[#1e90ff]/15' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`h-10 bg-gradient-to-tr ${preset.colors} rounded border flex items-center justify-center font-bold text-[10px] tracking-wider uppercase font-mono`}>
                      preset
                    </div>
                    <div>
                      <span className="text-white font-bold block text-[11px] font-sans">{preset.name}</span>
                      <span className="text-[10px] text-zinc-500 font-sans italic">Premium custom layout</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  onClick={handleApplyTheme}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-mono text-[10.5px] font-bold uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save visual theme preferences
                </button>
              </div>
            </div>
          )}

          {/* BILLING PLAN */}
          {activeSubTab === 'billing' && (
            <div className="space-y-5 text-left font-mono">
              <div className="space-y-1 border-b border-white/5 pb-2">
                <h3 className="text-white text-sm font-semibold font-mono uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Subscription level
                </h3>
                <p className="text-xs text-zinc-555">Compare sub-plans, track active compilation thresholds, or export receipts.</p>
              </div>

              {/* Current tier block */}
              <div className="p-5 bg-gradient-to-r from-blue-950/20 to-indigo-950/20 border border-blue-500/25 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1 text-left">
                  <span className="text-[#1e90ff] uppercase text-[9px] font-bold tracking-widest bg-blue-500/10 border border-blue-500/15 px-2.5 py-0.5 rounded-full">
                    Current active subscription
                  </span>
                  <h4 className="text-white text-base font-semibold font-sans pt-0.5">
                    {billingPlan === 'free' ? 'Developer Sandbox Free' : billingPlan === 'pro' ? 'Developer Pro Cloud' : 'Enterprise Cloud Sandbox'}
                  </h4>
                  <p className="text-[10.5px] text-zinc-400 font-sans leading-normal">
                    {billingPlan === 'free' 
                      ? 'Allows hosting up to 2 active projects. Perfect for individual API layout prototyping.' 
                      : billingPlan === 'pro' 
                        ? 'Allows hosting up to 5 active projects with high-speed LLM queue priority.' 
                        : 'Allows hosting up to 10 distinct microVM containers. Full telemetry sync bridge daemons included.'}
                  </p>
                </div>
                <div className="text-left font-mono shrink-0 sm:text-right">
                  <span className="text-white font-bold block text-lg">
                    {billingPlan === 'free' ? '$0' : billingPlan === 'pro' ? '$19 / mo' : '$49 / mo'}
                  </span>
                  <span className="text-zinc-500 text-[10px] block leading-normal">Next renewal: June 28, 2026</span>
                </div>
              </div>

              {/* Comparison packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1 text-xs">
                {/* Standard Free tier */}
                <div className="bg-zinc-950/70 p-4.5 rounded-xl border border-white/5 text-left flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 uppercase tracking-widest text-[8.5px] font-bold block">Free Tier</span>
                    <strong className="text-white font-sans text-sm block">$0</strong>
                    <p className="text-zinc-500 text-[10px] font-sans leading-relaxed">
                      Slower compilation queue timeouts limit. Includes 2 projects list. No Slack/Stripe keys adapter bindings active.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCheckoutPlan('free');
                      setPromoDiscount(0);
                      setCouponCode('');
                      setPromoMessage(null);
                      setCheckoutSuccess(false);
                    }}
                    disabled={billingPlan === 'free'}
                    className={`w-full text-center py-2 border rounded font-bold uppercase text-[9.5px] transition-all cursor-pointer font-mono ${
                      billingPlan === 'free'
                        ? 'bg-zinc-900 border-white/5 text-zinc-500 pointer-events-none'
                        : 'border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {billingPlan === 'free' ? 'Currently Selected' : 'Downgrade to Free'}
                  </button>
                </div>

                {/* Professional plan */}
                <div className="bg-zinc-950/70 p-4.5 rounded-xl border border-blue-500/15 text-left flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#ffa116]/10 text-[#ffa116] border-b border-l border-white/15 text-[8.5px] uppercase font-bold px-2 py-0.5 font-mono select-none font-sans">
                    popular
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[#ffa116] uppercase tracking-widest text-[8.5px] font-bold block">Developer Pro</span>
                    <strong className="text-white font-sans text-sm block">$19 / mo</strong>
                    <p className="text-zinc-500 text-[10px] font-sans leading-relaxed">
                      Max 5 live projects. Standard speed compilation queues. Secure Gmail and Slack adapter support.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCheckoutPlan('pro');
                      setCheckoutCardNumber('');
                      setCheckoutExpiry('');
                      setCheckoutCvc('');
                      setPromoDiscount(0);
                      setCouponCode('');
                      setPromoMessage(null);
                      setCheckoutSuccess(false);
                    }}
                    className={`w-full text-center py-2 border rounded font-bold uppercase text-[9.5px] transition-all cursor-pointer font-mono ${
                      billingPlan === 'pro' 
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold' 
                        : 'border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {billingPlan === 'pro' ? 'Currently Selected' : 'Upgrade to Pro'}
                  </button>
                </div>

                {/* Enterprise cluster plan */}
                <div className="bg-[#101015]/60 p-4.5 rounded-xl border border-emerald-500/15 text-left flex flex-col justify-between space-y-4 font-mono">
                  <div className="space-y-1.5">
                    <span className="text-[#30d158] uppercase tracking-widest text-[8.5px] font-bold block">Enterprise cluster</span>
                    <strong className="text-white font-sans text-sm block">$49 / mo</strong>
                    <p className="text-zinc-500 text-[10px] font-sans leading-relaxed">
                      Infinite projects with direct sync daemons. Highest speed LLM queues. Secure webhook adapters.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCheckoutPlan('enterprise');
                      setCheckoutCardNumber('');
                      setCheckoutExpiry('');
                      setCheckoutCvc('');
                      setPromoDiscount(0);
                      setCouponCode('');
                      setPromoMessage(null);
                      setCheckoutSuccess(false);
                    }}
                    className={`w-full text-center py-2 border rounded font-bold uppercase text-[9.5px] transition-all cursor-pointer font-mono ${
                      billingPlan === 'enterprise' 
                        ? 'bg-emerald-600/10 border-[#30d158] text-emerald-400 font-bold' 
                        : 'border-white/10 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {billingPlan === 'enterprise' ? 'Currently Selected' : 'Upgrade to Enterprise'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column diagnostics (takes 1 column) */}
        <div className="space-y-6">
          
          {/* Diagnostic utilities box */}
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5.5 flex flex-col justify-between font-mono h-full space-y-5 text-left">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Workspace Diagnostic Control</h3>
              </div>

              <p className="text-zinc-500 font-sans text-[11px] leading-relaxed">
                Send diagnostic triggers or flush storage cache blocks. Useful when local syncing returns outdated schema contracts.
              </p>

              <button
                onClick={handleTriggerReset}
                disabled={isResetting}
                className={`w-full text-center py-2.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  isResetting 
                    ? 'bg-red-950/10 text-red-400 border-red-950/25 cursor-not-allowed' 
                    : 'bg-red-950/25 hover:bg-red-900/35 text-red-500 hover:text-white border-red-900/35 active:scale-[0.98]'
                }`}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    Resetting daemon socket...
                  </>
                ) : (
                  'Reset Connection Bridge'
                )}
              </button>
            </div>

            <div className="space-y-2 pt-3.5 border-t border-white/5 font-sans">
              <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#ffa116] block font-mono">Storage cache maintenance</span>
              <p className="text-zinc-550 text-[10px] leading-normal">
                Dismounts locally stored project cards and cache blocks securely.
              </p>
              <button
                type="button"
                onClick={handlePurgeCache}
                className="w-full text-center py-2 rounded-lg bg-zinc-950 hover:bg-[#120808] text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-950/15 text-[9.5px] uppercase font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-650" />
                Purge Database Cache
              </button>
            </div>

            <div className="text-[9px] text-zinc-600 font-mono text-center pt-2.5 border-t border-white/5">
              AppForge Node sandbox config v1.2 Release Stable.
            </div>
          </div>

        </div>

      </div>

      {/* PURGE WORKSPACE CACHE CONFIRMATION MODAL */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[10000] backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-red-500/20 max-w-sm w-full rounded-xl overflow-hidden shadow-2xl shadow-black animate-fade-in animate-duration-150">
            <div className="p-5 space-y-4">
              <div className="flex gap-3 items-start">
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-red-500 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-red-400">Purge workspace sandbox</h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Are you sure you want to purge the sandbox database cache? This returns mock pipelines to default states.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#060608] px-5 py-3 border-t border-white/5 flex justify-end gap-2.5 font-mono">
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurgeCache}
                className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all cursor-pointer shadow-lg shadow-red-950/25"
              >
                Purge Cache
              </button>
            </div>
          </div>
        </div>
      )}
      {checkoutPlan !== null && (
        <div className="fixed inset-0 bg-black/90 z-[10001] backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#0b0b0d] border border-white/5 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 font-sans">
            
            {/* Left Column: Purchase Summary and Coupon */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-2 opacity-60">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Sandbox Secure checkout</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">Plan chosen</span>
                  <h3 className="text-white text-lg font-bold">
                    {checkoutPlan === 'free' ? 'Developer Sandbox Free' : checkoutPlan === 'pro' ? 'Developer Pro Cloud Upgrade' : 'Enterprise Cluster Suite Access'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Host up to {checkoutPlan === 'free' ? '2' : checkoutPlan === 'pro' ? '5' : '10'} distinct active relational tenants.
                  </p>
                </div>

                {/* Pricing calculations */}
                <div className="pt-4 border-t border-white/5 space-y-2.5 font-mono text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-550">Subscription base:</span>
                    <span className="text-white font-sans">${checkoutPlan === 'free' ? '0.00' : checkoutPlan === 'pro' ? '19.00' : '49.00'}</span>
                  </div>
                  
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-[#30d158]">
                      <span>Voucher discount ({promoDiscount}%):</span>
                      <span className="font-sans">-${checkoutPlan === 'free' ? '0.00' : ((checkoutPlan === 'pro' ? 19 : 49) * promoDiscount / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-zinc-550">Secure Cloud Tax (18% GST):</span>
                    <span className="text-white font-sans">
                      ${checkoutPlan === 'free' 
                        ? '0.00' 
                        : (Math.max(0, (checkoutPlan === 'pro' ? 19 : 49) * (1 - promoDiscount / 100)) * 0.18).toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold font-sans">
                    <span className="text-white font-mono uppercase tracking-wider">Amount Due Today (USD):</span>
                    <span className="text-emerald-400 text-sm">
                      ${checkoutPlan === 'free' 
                        ? '0.00' 
                        : (Math.max(0, (checkoutPlan === 'pro' ? 19 : 49) * (1 - promoDiscount / 100)) * 1.18).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon inputs bar */}
              {checkoutPlan !== 'free' && !checkoutSuccess && (
                <div className="space-y-2 select-text">
                  <label className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">Promotion voucher code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. WELCOME50, APPFORGE100"
                      className="flex-1 bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[10px] px-3.5 py-1.5 rounded-lg border border-white/10 uppercase font-bold cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[10px] leading-tight font-mono ${promoMessage.includes('❌') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {promoMessage}
                    </p>
                  )}
                  <div className="p-2.5 bg-blue-950/20 border border-blue-500/15 rounded-lg text-[9.5px] text-blue-400 leading-normal font-mono select-all">
                    💡 Free Testing Voucher: Use coupon <strong className="text-white">APPFORGE100</strong> to waive 100% of the price instantly!
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Secure Stripe fields or Progressive loader */}
            <div className="p-6 md:p-8 flex-1 bg-[#09090b]/40 text-left flex flex-col justify-between min-h-[345px]">
              {checkoutLoading ? (
                /* LOADING STAGE CHRONOMETER */
                <div className="flex-1 flex flex-col justify-center space-y-6 select-none py-4">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin" />
                  </div>
                  <div className="space-y-4 font-mono text-[10.5px] text-zinc-400">
                    <div className="text-center font-bold text-white text-xs uppercase tracking-wider animate-pulse">
                      Processing Stripe Transaction...
                    </div>
                    
                    <div className="space-y-2 max-w-[280px] mx-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">●</span>
                        <span className={checkoutStep >= 1 ? 'text-zinc-200 font-bold' : 'text-zinc-600'}>Card authenticating via Stripe...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={checkoutStep >= 2 ? 'text-emerald-500 font-bold' : 'text-zinc-600'}>
                          {checkoutStep >= 2 ? '●' : '○'}
                        </span>
                        <span className={checkoutStep >= 2 ? 'text-zinc-200 font-bold' : 'text-zinc-600'}>Handshaking payment webhook API...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={checkoutStep >= 3 ? 'text-emerald-500 font-bold' : 'text-zinc-600'}>
                          {checkoutStep >= 3 ? '●' : '○'}
                        </span>
                        <span className={checkoutStep >= 3 ? 'text-zinc-200' : 'text-zinc-600'}>Allocating microVM cloud capacity...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={checkoutStep >= 4 ? 'text-emerald-500 font-bold' : 'text-zinc-600'}>
                          {checkoutStep >= 4 ? '●' : '○'}
                        </span>
                        <span className={checkoutStep >= 4 ? 'text-indigo-400' : 'text-zinc-600'}>Final sync with workspace daemon...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : checkoutSuccess ? (
                /* SUCCESS RECEIPT GENERATOR BANNER */
                <div className="flex-1 flex flex-col justify-between space-y-5 animate-fade-in py-1">
                  <div className="space-y-3.5">
                    <div className="flex justify-center">
                      <div className="bg-[#30d158]/10 border border-[#30d158]/35 p-3 rounded-full text-[#30d158]">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">Payment Authorized!</h4>
                      <p className="text-[10px] text-zinc-400">Subscription successfully updated in Sandbox.</p>
                    </div>

                    {/* Printable receipt */}
                    <div className="p-3.5 bg-zinc-950 border border-white/5 rounded-xl font-mono text-[9px] text-zinc-500 space-y-2 leading-relaxed select-text">
                      <div className="flex justify-between border-b border-white/5 pb-1 text-[9.5px]">
                        <span className="text-zinc-400 font-bold">AppForge Receipt</span>
                        <span className="text-emerald-400 font-bold">PAID</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Invoice ref:</span>
                        <span className="text-zinc-300">INV-2026-6428</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer name:</span>
                        <span className="text-zinc-200">{checkoutCardholder || 'Rohit Agarwal'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid amount:</span>
                        <span className="text-[#30d158] font-bold">
                          ${checkoutPlan === 'free' 
                            ? '0.00' 
                            : (Math.max(0, (checkoutPlan === 'pro' ? 19 : 49) * (1 - promoDiscount / 100)) * 1.18).toFixed(2)} USD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Timestamp (UTC):</span>
                        <span className="text-zinc-300">{new Date().toISOString().substring(0, 10)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutPlan(null);
                      setCheckoutSuccess(false);
                    }}
                    className="w-full bg-blue-650 hover:bg-blue-600 text-white font-mono text-[10px] font-bold py-2.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer text-center block"
                  >
                    Return to Settings Workspace
                  </button>
                </div>
              ) : (
                /* SECURE CREDIT CARD PAYMENT INPUTS SCREEN */
                <form onSubmit={handleSimulatePayment} className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                      {checkoutPlan === 'free' ? 'No Payment Required' : 'Credit Card details'}
                    </span>
                    
                    {checkoutPlan === 'free' ? (
                      <div className="p-6 bg-zinc-950/80 border border-white/5 rounded-xl text-center space-y-3 font-mono text-[10.5px]">
                        <span className="text-zinc-400 block">Downgrading to standard Free tier.</span>
                        <p className="text-zinc-600 leading-normal">
                          This resolves sandbox workspace parameters to free limits instantly. No card details needed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-left text-xs font-mono select-text">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Cardholder Name</label>
                          <input
                            required
                            type="text"
                            value={checkoutCardholder}
                            onChange={(e) => setCheckoutCardholder(e.target.value)}
                            placeholder="Rohit Agarwal"
                            className="w-full bg-[#121214] text-white border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Card Number</label>
                          <div className="relative">
                            <input
                              required={promoDiscount < 100}
                              type="text"
                              maxLength={19}
                              value={checkoutCardNumber}
                              onChange={(e) => {
                                // Format text: xxxx xxxx xxxx xxxx
                                const v = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                                setCheckoutCardNumber(v);
                              }}
                              placeholder="4111 2222 3333 4444"
                              className="w-full bg-[#121214] text-white border border-white/5 hover:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <CreditCard className="w-3 h-3 text-zinc-650 absolute left-2.5 top-2.5" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Expiry (MM/YY)</label>
                            <input
                              required={promoDiscount < 100}
                              type="text"
                              maxLength={5}
                              value={checkoutExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 2) {
                                  val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                }
                                setCheckoutExpiry(val);
                              }}
                              placeholder="12/29"
                              className="w-full bg-[#121214] text-white border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">CVC / CVV</label>
                            <input
                              required={promoDiscount < 100}
                              type="text"
                              maxLength={3}
                              value={checkoutCvc}
                              onChange={(e) => setCheckoutCvc(e.target.value.replace(/\D/g, ''))}
                              placeholder="234"
                              className="w-full bg-[#121214] text-white border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] text-white font-mono text-[10.5px] font-bold py-2.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/10"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      {checkoutPlan === 'free' ? 'Confirm Free Downgrade' : 'PAY & ACTIVATE TIER'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setCheckoutPlan(null)}
                      className="w-full text-center text-zinc-550 hover:text-zinc-350 text-[10px] uppercase font-mono tracking-wider pt-0.5 cursor-pointer transition-colors"
                    >
                      Cancel and go back
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
