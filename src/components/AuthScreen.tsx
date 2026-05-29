import React, { useState } from 'react';
import { 
  Mail, Lock, User, ShieldAlert, Sparkles, Code2, 
  ArrowRight, CheckCircle2, Terminal, Github, Chrome, 
  HelpCircle, Check, Briefcase, Users, Server, Cpu
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'onboarding'>('signin');
  
  // Credentials States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Onboarding States
  const [workspaceName, setWorkspaceName] = useState('');
  const [framework, setFramework] = useState('React + Express');
  const [teamSize, setTeamSize] = useState('1 (Just me)');
  const [deploymentTier, setDeploymentTier] = useState('Developer Free (Sandbox)');

  // Validation / Feedback States
  const [errorField, setErrorField] = useState<'email' | 'password' | 'confirm' | 'name' | 'workspace' | 'general' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickDemo = () => {
    setName('Rohit Agarwal');
    setEmail('agarwalrohit22428@gmail.com');
    setPassword('Rohit@2026');
    setConfirmPassword('Rohit@2026');
    setErrorField(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab('signin');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorField(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    // Forgot Password Flow
    if (activeTab === 'forgot') {
      if (!trimmedEmail) {
        setErrorField('email');
        setErrorMessage('Please enter your email to dispatch a security reset token.');
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(`🔒 Security link dispatched! Check your mailbox at ${trimmedEmail} within 5 minutes.`);
      }, 1000);
      return;
    }

    // Basic Validations
    if (!trimmedEmail) {
      setErrorField('email');
      setErrorMessage('Email ID is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorField('email');
      setErrorMessage('Please enter a valid email format (e.g. name@company.com).');
      return;
    }

    if (!password) {
      setErrorField('password');
      setErrorMessage('Workspace authentication password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorField('password');
      setErrorMessage('Security constraint: password must be at least 6 characters long.');
      return;
    }

    if (activeTab === 'signup') {
      if (!trimmedName) {
        setErrorField('name');
        setErrorMessage('Please provide your full name to configure your developer profile.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorField('confirm');
        setErrorMessage('Security mismatch: Passion passwords do not align.');
        return;
      }
      
      // Progress to workspace onboarding step first!
      setWorkspaceName(`${trimmedName.split(' ')[0]}'s Space`);
      setActiveTab('onboarding');
      return;
    }

    if (activeTab === 'signin') {
      // Sign-in authentication checks
      if (trimmedEmail === 'agarwalrohit22428@gmail.com' && password !== 'Rohit@2026') {
        setErrorField('password');
        setErrorMessage('Incorrect password credential for this registered developer ID.');
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const userObj = { name: trimmedName || 'Rohit Agarwal', email: trimmedEmail };
        localStorage.setItem('appforge_user', JSON.stringify(userObj));
        onLoginSuccess(userObj);
      }, 800);
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setErrorField('workspace');
      setErrorMessage('Workspace identifier is required to provision standard container nodes.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Persist onboarding preferences alongside user profile
      const userObj = { 
        name: name.trim() || 'Rohit Agarwal', 
        email: email.trim(),
        workspace: workspaceName,
        framework,
        teamSize,
        tier: deploymentTier
      };
      localStorage.setItem('appforge_user', JSON.stringify(userObj));
      localStorage.setItem('appforge_onboarding_config', JSON.stringify(userObj));
      onLoginSuccess(userObj);
    }, 1200);
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    setSuccessMessage(`Redirecting gateway handshake with ${provider === 'google' ? 'Google SECURE-ID' : 'GitHub OAuth server'}...`);
    
    setTimeout(() => {
      setIsSubmitting(false);
      const guestEmail = provider === 'github' ? 'github-dev@appforge.dev' : 'google-partner@gmail.com';
      const guestName = provider === 'github' ? 'Octocat Developer' : 'Handshake Partner';
      
      const userObj = { name: guestName, email: guestEmail };
      localStorage.setItem('appforge_user', JSON.stringify(userObj));
      onLoginSuccess(userObj);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans text-gray-300">
      
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1e90ff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Product Branding Area */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold leading-none tracking-tight text-lg block">AppForge<span className="text-blue-500 font-extrabold">AI</span></span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-medium">Enterprise Creator Protocol</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-medium text-white tracking-tight leading-tight">
              Provision beautiful <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 font-bold">full-stack codebases</span> instantly
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Enter our compiler sandbox. Formulate schemas, define custom Rest endpoints, connect on-prem bridges, and let our self-healing compiler resolve structural errors.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/5 p-3 rounded-lg">
              <CheckCircle2 className="text-emerald-500 w-4.5 h-4.5 shrink-0" />
              <div className="text-[11px]">
                <strong className="text-zinc-200 block font-mono uppercase tracking-wide text-[9px] text-[#1e90ff]">Automatic Healing Loops</strong>
                <span className="text-zinc-400">Heuristic rules validation resolves relational table constraints automatically.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/5 p-3 rounded-lg">
              <Terminal className="text-blue-400 w-4.5 h-4.5 shrink-0" />
              <div className="text-[11px]">
                <strong className="text-zinc-200 block font-mono uppercase tracking-wide text-[9px] text-[#1e90ff]">Integrated Sync Bridge</strong>
                <span className="text-zinc-400 font-sans">Push metrics, trace logs, and code directories seamlessly from local daemons.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-zinc-500">
            Runtime Status: <span className="text-emerald-400">CONNECTIVITY READY (AWS-AP)</span>
          </div>
        </div>

        {/* Right Side: The Gate Forms */}
        <div className="lg:col-span-7 bg-[#0b0b0e] border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative">
          
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            AppForge Terminal Access
          </div>

          {activeTab !== 'onboarding' && (
            <div className="mb-6 space-y-1.5 text-center lg:text-left">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Identity Gateway
                </span>
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-medium tracking-tight text-white">
                {activeTab === 'signin' && 'Access Control Center'}
                {activeTab === 'signup' && 'Create Developer Profile'}
                {activeTab === 'forgot' && 'Disengage Password Gate'}
              </h2>
              <p className="text-xs text-zinc-500">
                {activeTab === 'signin' && 'Deploy, manage, and trace autonomous SaaS systems.'}
                {activeTab === 'signup' && 'Claim your developer seats to launch on-demand servers.'}
                {activeTab === 'forgot' && 'Submit registered email ID to fetch credentials security key.'}
              </p>
            </div>
          )}

          {/* ONBOARDING WORKSPACE STEP FORM */}
          {activeTab === 'onboarding' ? (
            <form onSubmit={handleOnboardingSubmit} className="space-y-5 text-left">
              <div className="space-y-1 bg-zinc-950/50 border border-white/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-widest font-bold">Onboarding Phase (Step 2 of 2)</span>
                </div>
                <h3 className="text-white text-base tracking-tight font-medium mt-1">Configure Workspace Sandboxes</h3>
                <p className="text-[11px] text-zinc-500">Please answer these specifications to scaffold your initial environments repository.</p>
              </div>

              {/* Workspace Container Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">workspace name</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Tech Labs"
                    className={`w-full bg-[#121215] border rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-blue-500 transition-colors ${
                      errorField === 'workspace' ? 'border-red-500' : 'border-white/5'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tech Framework */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">compilation framework</label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full bg-[#121215] border border-white/5 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option>React + Express (Fullstack)</option>
                      <option>Vite + FastAPI</option>
                      <option>Next.js + Tailwind</option>
                      <option>SvelteKit + Postgres</option>
                    </select>
                  </div>
                </div>

                {/* Team size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">active developer seats</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <select
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="w-full bg-[#121215] border border-white/5 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option>1 (Just me)</option>
                      <option>2 - 5 developers</option>
                      <option>6 - 15 engineers</option>
                      <option>Enterprise (Infinite)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Tier selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">deployment cluster plan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { id: 'Developer Free (Sandbox)', desc: 'Isolated sandbox, single compiling bridge, local storage persistence.' },
                    { id: 'Enterprise Teams ($29/mo)', desc: '3 pipeline runners, continuous Git sync, centralized postgres schemas.' }
                  ].map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setDeploymentTier(tier.id)}
                      className={`text-left p-3.5 rounded-lg border text-xs transition-all flex flex-col justify-between cursor-pointer ${
                        deploymentTier === tier.id 
                          ? 'bg-blue-600/10 border-blue-500 text-white font-semibold' 
                          : 'bg-zinc-950/60 border-white/5 hover:border-white/10 text-zinc-400'
                      }`}
                    >
                      <span className="block leading-relaxed tracking-tight">{tier.id}</span>
                      <span className="block text-[10px] text-zinc-500 mt-1 font-normal leading-relaxed">{tier.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Onboarding Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin text-white" />
                    Deploying Sandbox Environment Cluster...
                  </>
                ) : (
                  <>
                    Complete Workspace Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <>
              {/* Tabs Switcher */}
              <div className="grid grid-cols-2 p-1 bg-zinc-950/80 border border-white/5 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorField(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2 text-[10.5px] uppercase tracking-wider font-bold transition-all rounded cursor-pointer ${
                    activeTab === 'signin' 
                      ? 'bg-blue-600/15 text-white border border-blue-500/15 shadow-sm font-bold' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorField(null);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2 text-[10.5px] uppercase tracking-wider font-bold transition-all rounded cursor-pointer ${
                    activeTab === 'signup' 
                      ? 'bg-blue-600/15 text-white border border-blue-500/15 shadow-sm font-bold' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* OAuth Social login options */}
              {activeTab !== 'forgot' && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button 
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    className="flex justify-center items-center gap-2 py-2.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-xs text-zinc-350 transition-colors font-medium font-mono cursor-pointer"
                  >
                    <Chrome className="w-4 h-4 text-red-500" />
                    Google ID
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    className="flex justify-center items-center gap-2 py-2.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-lg text-xs text-zinc-350 transition-colors font-medium font-mono cursor-pointer"
                  >
                    <Github className="w-4 h-4 text-white" />
                    GitHub
                  </button>
                </div>
              )}

              {/* Divider lines context */}
              {activeTab !== 'forgot' && (
                <div className="relative flex py-3 items-center text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 font-bold text-[9px] text-zinc-600">or use secret credentials</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>
              )}

              {/* Standard form layout */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                
                {/* 1. Full description profile name */}
                {activeTab === 'signup' && (
                  <div className="space-y-1.5 text-left animate-fade-in">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Full Developer Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rohit Agarwal"
                        className={`w-full bg-[#121215] border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all ${
                          errorField === 'name' 
                            ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                            : 'border-white/5 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Registered Email address block */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. agarwalrohit22428@gmail.com"
                      className={`w-full bg-[#121215] border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all ${
                        errorField === 'email' 
                          ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                          : 'border-white/5 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. Authentication Password fields */}
                {activeTab !== 'forgot' && (
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center pr-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Workspace Password</label>
                      {activeTab === 'signin' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveTab('forgot');
                            setErrorField(null);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[10px] font-mono lowercase tracking-normal text-zinc-500 hover:text-blue-400 font-semibold transition-colors"
                        >
                          forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-[#121215] border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all ${
                          errorField === 'password' 
                            ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                            : 'border-white/5 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Passion Confirmation passwords */}
                {activeTab === 'signup' && (
                  <div className="space-y-1.5 text-left animate-fade-in">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-[#121215] border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none transition-all ${
                          errorField === 'confirm' 
                            ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                            : 'border-white/5 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* ERROR FEEDBACK BANNER */}
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg flex items-start gap-2.5 text-left text-[11px] text-red-400 animate-head-shake">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-mono text-[9.5px] uppercase tracking-wider block text-red-400">Security Gate alert:</span>
                      <p className="leading-relaxed mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* SUCCESS FEEDBACK BANNER */}
                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg flex items-start gap-2.5 text-left text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold font-mono text-[9.5px] uppercase tracking-wider block text-emerald-400">Handshake success:</span>
                      <p className="leading-relaxed mt-0.5">{successMessage}</p>
                    </div>
                  </div>
                )}

                {/* Submit button Trigger */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 cursor-pointer active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin text-white" />
                      Compiling Cryptographic Signatures...
                    </>
                  ) : (
                    <>
                      {activeTab === 'signin' && 'Verify & Launch Workspace'}
                      {activeTab === 'signup' && 'Register Workspace Seats'}
                      {activeTab === 'forgot' && 'Dispatch Reset security code'}
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>

                {/* Subtext info back togglers */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-500">
                  <span>
                    {activeTab === 'forgot' ? (
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveTab('signin');
                          setErrorField(null);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-zinc-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to secure authentication
                      </button>
                    ) : (
                      <>
                        {activeTab === 'signin' ? 'Need workspace access?' : 'Already registered?'} &nbsp;
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(activeTab === 'signin' ? 'signup' : 'signin');
                            setErrorField(null);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-blue-400 underline font-semibold cursor-pointer"
                        >
                          {activeTab === 'signin' ? 'Create Account' : 'Sign In'}
                        </button>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="text-zinc-400 hover:text-white bg-zinc-950/80 border border-white/5 py-1 px-2.5 rounded font-mono text-[9px] hover:border-blue-500/20 uppercase tracking-widest transition-all cursor-pointer"
                  >
                    ⚡ Autofill Demo Credentials
                  </button>
                </div>

              </form>
            </>
          )}

        </div>

      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] font-mono text-zinc-500 pointer-events-none">
        AppForgeAI Cryptographic Environment Gate | Multi-tenant Sandboxes ISO27001 Certified
      </div>

    </div>
  );
}
