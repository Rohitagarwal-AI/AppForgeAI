import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { AppForgeProject, ProjectTask, Commit, FileMetric, GenerationJob, IntegrationRegistryEntry } from './src/types.js';
import { rerunRepairsForJob, runGenerationPipeline } from './src/lib/pipeline/streamRunner.js';

// Setup Express
const app = express();
const PORT = Number(process.env.PORT || 3000);

// Persistent Database for Codebase Projects
const dbFilePath = path.join(process.cwd(), 'projects-db.json');
let projectsListMemory: any[] = [];

try {
  if (fs.existsSync(dbFilePath)) {
    projectsListMemory = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } else {
    projectsListMemory = [
      {
        id: 'proj-1',
        name: 'Acme SaaS Billing',
        type: 'SaaS Suite',
        techStack: 'React + Express',
        status: 'Deployed',
        features: ['Stripe Checkout', 'Relational DB', 'Weekly Receipt Scheduler'],
        lastUpdated: '2 hours ago',
        liveUrl: 'https://acme-billing.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/acme-billing-saas'
      },
      {
        id: 'proj-2',
        name: 'TaskFlow Slack Automation',
        type: 'AI Workspace Tool',
        techStack: 'Next.js + Tailwind',
        status: 'Deployed',
        features: ['Slack Notifications', 'Relational DB', 'Consistency Healer'],
        lastUpdated: '5 hours ago',
        liveUrl: 'https://taskflow-bot.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/taskflow-slackbot'
      },
      {
        id: 'proj-3',
        name: 'HealthLink EHR Ledger',
        type: 'Healthcare Ledger',
        techStack: 'Vite + FastAPI',
        status: 'Failed',
        features: ['HIPAA Logging Shield', 'Gmail Auditing Logs', 'Custom Workflows'],
        lastUpdated: '1 day ago',
        liveUrl: 'https://healthlink-ehr.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/healthlink-ehr'
      },
      {
        id: 'proj-4',
        name: 'SocialVerse Social Sandbox',
        type: 'Community Sandbox',
        techStack: 'Vite + Express',
        status: 'Building',
        features: ['Push Notification Broker', 'Relational DB', 'WhatsApp Alerts'],
        lastUpdated: 'Just now',
        liveUrl: 'https://socialverse.appforge.ai',
        githubRepo: 'github.com/agarwalrohit/socialverse-sandbox'
      }
    ];
    fs.writeFileSync(dbFilePath, JSON.stringify(projectsListMemory, null, 2), 'utf8');
  }
} catch (e) {
  console.error('Failed to initialize projects DB file:', e);
}

function saveProjectsToDisk() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(projectsListMemory, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write projects database to disk:', e);
  }
}

// In-Memory Database for Blueprint Jobs
const jobsStore: Record<string, any> = {};

// Integrations Registry
const integrationsRegistry: IntegrationRegistryEntry[] = [
  { id: 'openai', name: 'OpenAI', status: process.env.OPENAI_API_KEY ? 'configured' : 'available', description: 'Server-side model provider for intent extraction, validation repair, and AppSpec generation.', capabilities: ['Structured JSON generation', 'Repair retries'], authType: 'OPENAI_API_KEY', triggers: ['Generate App'], actions: ['Extract Intent', 'Repair Output'] },
  { id: 'gemini', name: 'Gemini', status: process.env.GEMINI_API_KEY ? 'configured' : 'available', description: 'Google Gemini model routing for structured generation and fast fallback planning.', capabilities: ['JSON generation', 'Prompt analysis'], authType: 'GEMINI_API_KEY', triggers: ['Generate App'], actions: ['Build AppSpec', 'Validate Output'] },
  { id: 'groq', name: 'Groq', status: process.env.GROQ_API_KEY ? 'configured' : 'available', description: 'Low-latency OpenAI-compatible route for structured intermediate pipeline output.', capabilities: ['Fast inference', 'JSON repair'], authType: 'GROQ_API_KEY', triggers: ['Retry Generation'], actions: ['Repair JSON', 'Normalize Entities'] },
  { id: 'github', name: 'GitHub', status: 'available', description: 'Repository export destination for generated source trees and project history.', capabilities: ['Repo creation', 'Commit export'], authType: 'GitHub Token', triggers: ['Project Save'], actions: ['Create Repository', 'Push Code'] },
  { id: 'supabase', name: 'Supabase', status: 'available', description: 'Postgres, auth, storage, and realtime database deployment target.', capabilities: ['Postgres schema', 'Auth tables'], authType: 'Project URL + Service Key', triggers: ['Database Schema Generation'], actions: ['Apply SQL', 'Create Auth Config'] },
  { id: 'firebase', name: 'Firebase', status: 'available', description: 'Alternative auth, storage, and app hosting integration.', capabilities: ['Auth', 'Storage', 'Hosting'], authType: 'Firebase Service Account', triggers: ['Deploy'], actions: ['Create App', 'Deploy Rules'] },
  { id: 'vercel', name: 'Vercel', status: 'available', description: 'Frontend preview and Next.js deployment adapter.', capabilities: ['Preview deploys', 'Environment sync'], authType: 'Vercel Token', triggers: ['Preview App'], actions: ['Create Deployment'] },
  { id: 'render', name: 'Render', status: 'available', description: 'Production web service and static site deployment target.', capabilities: ['Web service', 'Static site'], authType: 'Render API Key', triggers: ['Deploy'], actions: ['Create Service', 'Trigger Build'] },
  { id: 'stripe', name: 'Stripe', status: 'available', description: 'Payments and billing integration for generated SaaS and commerce apps.', capabilities: ['Checkout', 'Webhooks'], authType: 'STRIPE_SECRET_KEY', triggers: ['Payment Created'], actions: ['Create Checkout', 'Handle Webhook'] },
  { id: 'gmail', name: 'Gmail', status: 'available', description: 'Email notifications and generated app transactional mail hooks.', capabilities: ['Send Email', 'Draft Templates'], authType: 'OAuth2 App Password', triggers: ['Email Notification'], actions: ['Send Message'] },
  { id: 'slack', name: 'Slack', status: 'available', description: 'Team alerts for generation, deployment, and app workflow activity.', capabilities: ['Channel alerts', 'Webhook messages'], authType: 'Slack Bot Token', triggers: ['Build Finished'], actions: ['Send Message'] }
];

// Middleware
app.use(express.json());

// In-Memory Database for State Persistence
let projectData: AppForgeProject = {
  projectName: 'appforgeai',
  activeBranch: 'main',
  commitHistory: [
    {
      hash: 'da5f8a2c1e79b30',
      author: 'agarwalrohit22428@gmail.com',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      message: 'feat: integrated client-side telemetry with mock fallback trigger'
    },
    {
      hash: 'bc4e973df26e811',
      author: 'agarwalrohit22428@gmail.com',
      date: new Date(Date.now() - 3600000 * 5).toISOString(),
      message: 'refactor: converted state flow to atomic single-view schema'
    },
    {
      hash: '3e1a8b27c94d0ef',
      author: 'agarwalrohit22428@gmail.com',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      message: 'feat: initialized appforgeai skeleton architecture'
    },
    {
      hash: '1a2b3c4d5e6f7a8',
      author: 'system',
      date: new Date(Date.now() - 3600000 * 48).toISOString(),
      message: 'chore: initial repository scaffold'
    }
  ],
  fileMetrics: [
    { name: 'App.tsx', size: 4500, type: 'typescript', lastModified: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { name: 'server.ts', size: 8200, type: 'typescript', lastModified: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { name: 'types.ts', size: 1200, type: 'typescript', lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { name: 'index.html', size: 1500, type: 'html', lastModified: new Date(Date.now() - 1000 * 3600 * 24).toISOString() },
    { name: 'vite.config.ts', size: 850, type: 'typescript', lastModified: new Date(Date.now() - 1000 * 3600 * 24).toISOString() },
    { name: 'package.json', size: 1100, type: 'json', lastModified: new Date(Date.now() - 1000 * 60 * 12).toISOString() }
  ],
  backlog: [
    {
      id: 'task-1',
      title: 'Configure Real-time Websocket Connection',
      description: 'Stream micro-heartbeats from local desktop script directly to status widget.',
      status: 'In Progress',
      priority: 'High',
      category: 'Infrastructure',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'task-2',
      title: 'Verify File Tree Diff Logic',
      description: 'Verify local-to-cloud directory sync integrity check to skip node_modules.',
      status: 'Review',
      priority: 'Medium',
      category: 'File System',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: 'task-3',
      title: 'Analyze Development Status via Gemini',
      description: 'Review project structure and draft active coding path suggestions periodically.',
      status: 'Backlog',
      priority: 'High',
      category: 'AI Assistant',
      createdAt: new Date(Date.now()).toISOString()
    },
    {
      id: 'task-4',
      title: 'Setup Core Agent Workspace',
      description: 'Scaffold basic full-stack Express & React app structure for real-time diagnostics.',
      status: 'Done',
      priority: 'High',
      category: 'Scaffolding',
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
    }
  ],
  stats: {
    totalFiles: 6,
    linesOfCode: 17350,
    issuesSolved: 14,
    testsPassingPercentage: 100
  },
  bridge: {
    connected: true,
    lastSync: new Date().toISOString(),
    agentVersion: '1.2.0',
    hostname: 'DESKTOP-AF-SIMULATOR',
    os: 'AI Studio Cloud Terminal (Linux Container)',
    cpuModel: 'Intel Xeon Platinum @ 3.40GHz'
  }
};

// Lazy initialization of Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not defined in Secrets panel.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// REST Api Routes

// Live projects list
app.get('/api/projects', (req: Request, res: Response) => {
  res.json(projectsListMemory);
});

// Update standard projects listing state
app.post('/api/projects', (req: Request, res: Response) => {
  const { projects } = req.body;
  if (Array.isArray(projects)) {
    projectsListMemory = projects;
    saveProjectsToDisk();
    res.json({ success: true, count: projectsListMemory.length });
  } else {
    res.status(400).json({ error: 'Projects array is required' });
  }
});

// Helper route to reset or push a new project directly
app.post('/api/projects/add', (req: Request, res: Response) => {
  const { project } = req.body;
  if (project && typeof project === 'object') {
    projectsListMemory = [project, ...projectsListMemory];
    saveProjectsToDisk();
    res.json({ success: true, project });
  } else {
    res.status(400).json({ error: 'Valid project object is required' });
  }
});

// 1. Get raw current project status
app.get('/api/project', (req: Request, res: Response) => {
  res.json(projectData);
});

// 2. Local desktop sync POST endpoint
app.post('/api/project/sync', (req: Request, res: Response) => {
  const { projectName, activeBranch, commitHistory, fileMetrics, stats, bridgeInfo } = req.body;

  if (!projectName) {
    res.status(400).json({ error: 'projectName is required' });
    return;
  }

  // Overwrite database state with incoming metrics from active local workspace
  projectData.projectName = projectName;
  if (activeBranch) projectData.activeBranch = activeBranch;
  if (commitHistory && Array.isArray(commitHistory)) projectData.commitHistory = commitHistory;
  if (fileMetrics && Array.isArray(fileMetrics)) projectData.fileMetrics = fileMetrics;
  if (stats) {
    projectData.stats = {
      ...projectData.stats,
      ...stats
    };
  }

  // Update connection bridge metadata
  projectData.bridge = {
    connected: true,
    lastSync: new Date().toISOString(),
    agentVersion: bridgeInfo?.agentVersion || '0.1.0',
    hostname: bridgeInfo?.hostname || 'localhost',
    os: bridgeInfo?.os || 'unknown',
    cpuModel: bridgeInfo?.cpuModel || 'unknown'
  };

  res.json({ success: true, message: 'Project metrics synchronized successfully.', updatedState: projectData });
});

// 3. Update task status on Kanban board
app.post('/api/project/task/update', (req: Request, res: Response) => {
  const { taskId, status } = req.body;
  const task = projectData.backlog.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    res.json({ success: true, updatedTask: task });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// 4. Create new task
app.post('/api/project/task/create', (req: Request, res: Response) => {
  const { title, description, priority, category } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }
  const newTask: ProjectTask = {
    id: `task-${Date.now()}`,
    title,
    description: description || '',
    priority: priority || 'Medium',
    status: 'Backlog',
    category: category || 'General',
    createdAt: new Date().toISOString()
  };
  projectData.backlog.push(newTask);
  res.json({ success: true, newTask });
});

// 5. Trigger Reset to Mock Status (for preview testing)
app.post('/api/project/reset', (req: Request, res: Response) => {
  projectData.bridge = {
    connected: false,
    lastSync: null,
    agentVersion: null,
    hostname: null,
    os: null,
    cpuModel: null
  };
  res.json({ success: true, message: 'Bridge status disconnected.' });
});

// 5.1 Toggle Active Simulator Mode
app.post('/api/project/toggle-bridge', (req: Request, res: Response) => {
  const { connected } = req.body;
  if (connected) {
    projectData.bridge = {
      connected: true,
      lastSync: new Date().toISOString(),
      agentVersion: '1.2.0',
      hostname: 'DESKTOP-AF-SIMULATOR',
      os: 'AI Studio Cloud Terminal (Linux Container)',
      cpuModel: 'Intel Xeon Platinum @ 3.40GHz'
    };
  } else {
    projectData.bridge = {
      connected: false,
      lastSync: null,
      agentVersion: null,
      hostname: null,
      os: null,
      cpuModel: null
    };
  }
  res.json({ success: true, bridge: projectData.bridge });
});

// 6. Request Gemini AI assessment & suggestions based on tracked code metrics
app.post('/api/project/ai-insight', async (req: Request, res: Response) => {
  try {
    const ai = getGemini();

    const currentFilesStr = projectData.fileMetrics.map(f => `${f.name} (${f.size} bytes)`).join(', ');
    const currentCommitsStr = projectData.commitHistory.map(c => `[${c.author}] ${c.message}`).slice(0, 4).join('\n');
    const tasksBacklogStr = projectData.backlog.map(t => `- [${t.status}] ${t.title} (${t.priority} priority)`).join('\n');

    const prompt = `
You are AppForgeAI AI Architect. Analyze the current development parameters:
- Project Name: ${projectData.projectName}
- Active Branch: ${projectData.activeBranch}
- Core tracked files: ${currentFilesStr}
- Recent Commit Log:
${currentCommitsStr}

- Kanban Task backlog:
${tasksBacklogStr}

Give structured, concise developer feedback. Address the user directly ('agarwalrohit22428@gmail.com' or 'Rohit'). 
Suggest exactly two next concrete steps (e.g., code templates, architecture checks, or testing workflows) for "appforgeai" project. Keep the tone premium, collaborative, and strictly practical with formatted Markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are AppForgeAI's senior code strategist and assistant. Help track implementation progress and deliver clear developer guides.",
        temperature: 0.7
      }
    });

    res.json({ success: true, insight: response.text });
  } catch (error: any) {
    console.error('Gemini error:', error);
    res.json({
      success: false,
      message: error.message || 'AI is currently offline. Please configure GEMINI_API_KEY in the Secrets panel to activate senior advisor model.'
    });
  }
});

// ============================================================================
// BLUEPRINT GENERATION PIPELINE ROUTERS
// ============================================================================

// 1. Trigger AppForge Blueprint generation
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, projectName, appType, techStack, features } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ error: 'Core developer specifications prompt is required' });
      return;
    }
    const job = await runGenerationPipeline({ prompt, projectName, appType, techStack, features });
    jobsStore[job.jobId] = job;
    res.json(job);
  } catch (err: any) {
    console.error('Generation endpoint crash: ', err);
    res.status(500).json({ error: err.message || 'Fatal generation error' });
  }
});

// 2. Fetch specific generation job details
app.get('/api/generate/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobsStore[jobId];
  if (!job) {
    res.status(404).json({ error: `Generation job ${jobId} not found` });
    return;
  }
  res.json(job);
});

// 3. Keep-alive SSE Stream mapping for live log pipeline replay
app.get('/api/generate/:jobId/stream', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobsStore[jobId];
  if (!job) {
    res.status(404).json({ error: `Generation job ${jobId} not found` });
    return;
  }

  // Setup Server Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  let stepIndex = 0;
  const intervalTime = 600; // ms standard

  const interval = setInterval(() => {
    if (stepIndex < job.events.length) {
      const currentEvent = job.events[stepIndex];
      res.write(`data: ${JSON.stringify({ type: 'stage_update', event: currentEvent })}\n\n`);
      stepIndex++;
    } else {
      res.write(`data: ${JSON.stringify({ type: 'completed', job })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, intervalTime);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// 4. Integrations registry lookup
app.get('/api/integrations', (req: Request, res: Response) => {
  res.json(integrationsRegistry);
});

// 5. Contextual AI Assistant conversations
app.post('/api/assistant', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message payload is required' });
      return;
    }

    const hasKey = !!process.env.GEMINI_API_KEY;
    let responseText = '';
    let apiError: string | null = null;

    if (hasKey) {
      try {
        const ai = getGemini();
        const systemInstruction = `
You are AppForgeAI's senior code strategist, systems architect, and chief workspace advisor.
You are exceptionally powerful, direct, precise, and correct. Your responses should provide deep, highly technical, and immediately actionable answers about the code metrics, catalog systems, multi-tenancy, and compliance checking.

ACTIVE PLATFORM TELEMETRY AND METRICS:
- Current Target Project name: "${projectData.projectName}"
- Current Active branch: "${projectData.activeBranch}"
- File System Metrics tracked: ${JSON.stringify(projectData.fileMetrics)}
- Active Kanban Backlog Deck:
${projectData.backlog.map(t => `  * [${t.status}] [Priority: ${t.priority}] [Category: ${t.category}] ${t.title}: ${t.description}`).join('\n')}
- Workspace Statistics: LOC: ${projectData.stats.linesOfCode}, Issues Fixed: ${projectData.stats.issuesSolved}, Tests: ${projectData.stats.testsPassingPercentage}% passing.
- Daemon Synchronization Tunnel Bridge:
  * Connected? ${projectData.bridge.connected}
  * Host Daemon: "${projectData.bridge.hostname}"
  * Kernel OS: "${projectData.bridge.os}"
  * CPU Structure: "${projectData.bridge.cpuModel}"
- Core Registered Database Projects:
${projectsListMemory.map(p => `  * Project: "${p.name}" (Type: "${p.type}", Stack: "${p.techStack}", Features: ${JSON.stringify(p.features || [])}, Live: "${p.liveUrl}")`).join('\n')}
- Cloud Adapter Integrations Webhooks Registry:
${JSON.stringify(integrationsRegistry)}
- Current Client Session Blueprint Status:
${JSON.stringify(context || {})}

YOUR TASK GUIDELINES:
- Deliver exactly correct, comprehensive, senior-level architectural replies.
- Never invent information outside the context or state variables. Use the active data blocks to back any claim or design suggestion (e.g., recommend real file edits in tracked file names, or reference actual backlog cards, or active modules in the projects database).
- Use polished, highly professional developer styling with clean structured headers, descriptive bullet points, clear tables, and formatted TypeScript/JSON code blocks. Keep the language direct and clear.
`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: message,
          config: {
            systemInstruction,
            temperature: 0.65
          }
        });
        responseText = response.text || "AI completed successfully.";
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to local diagnostics:', err);
        apiError = err.message || 'Unknown Gemini API error';
      }
    }

    if (!responseText) {
      // Fallback local assistant response
      const msgLower = message.toLowerCase();
      
      const header = "";

      if (msgLower.includes('explain') || msgLower.includes('spec') || msgLower.includes('what is') || msgLower.includes('blueprint') || msgLower.includes('contract')) {
        responseText = header + `### AppForge AI System Blueprint Contract Analysis

The app blueprint models represent a structured compile-time protocol designed to orchestrate full-stack SaaS pipelines.

#### Core Structural Subsystems:
1. **AppIntent**:
   * **Purpose**: Captures user specifications, app description, target audience segment, and technology stack preferences.
   * **Attributes**: App Name, Category, Stack type, and chosen module list.
2. **DataSchema (Relational Entity Model)**:
   * **Purpose**: Defines database tables with strict relationship indexes and custom field constraints.
   * **Enforced Validation**: Employs a mandatory \`tenantId\` partition key for native multi-tenant workspace security.
3. **AppSpec (Infrastructure Map)**:
   * **Purpose**: Deploys web endpoints, page layout hierarchies, middleware hook definitions, and responsive frontend routes.

\`\`\`ts
// Blueprint Compile Structure Signature
interface GenerationJob {
  jobId: string;
  prompt: string;
  appIntent: AppIntent;
  dataSchema: DataSchema;
  appSpec: AppSpec;
  validation: ValidationResult;
  repairLog: RepairEvent[];
}
\`\`\``;
      } else if (msgLower.includes('error') || msgLower.includes('repair') || msgLower.includes('validate') || msgLower.includes('healed') || msgLower.includes('compliance') || msgLower.includes('validator')) {
        responseText = header + `### AppForge AI Code Integrity & Auto-Healing Core

The system validator executes strict structural alignment checks to prevent microvm cold-starts or container crashes.

#### Validation Pipeline Rules:
1. **Multi-Tenant Security Enforcement**:
   * Audits state machines and schemas to ensure every table block possesses a \`tenantId\` field. This ensures rigorous logical isolation between enterprise users.
2. **Page-to-API Route Compliance**:
   * Insures all visual elements map cleanly to active REST routes in the backend runtime.
3. **Typescript Strict Checks**:
   * Verifies imports and model types prior to code bundle emissions using Vite & Express.

#### Interactive Auto-Healing Logic:
When an inconsistency is detected, the **Compliant Healing** engine runs the following repairs:
* \`field_repair\`: Automatically appends missing tenant keys into standard entities.
* \`consistency_repair\`: Truncates mismatched navigation components to maintain clean UI routing.

*You can trigger a manual schema repair on any invalid active blueprint in the **Build Blueprints** workspace tab.*`;
      } else if (msgLower.includes('integration') || msgLower.includes('hook') || msgLower.includes('slack') || msgLower.includes('stripe') || msgLower.includes('whatsapp') || msgLower.includes('gmail') || msgLower.includes('sheet') || msgLower.includes('jira') || msgLower.includes('adapter')) {
        const matchingAdapters = integrationsRegistry.map(reg => `* **${reg.name}** (\`${reg.id}\`): ${reg.description}\n  * *Triggers*: ${reg.triggers.join(', ')}\n  * *Capabilities*: ${reg.capabilities.join(', ')}`).join('\n');
        responseText = header + `### High-Performance Workspace Cloud Adapters

AppForgeAI features full-stack adapters connected directly through secure OAuth and credential tunnels:

${matchingAdapters}

*To activate, configure your web credentials in the **Cloud Adapters** configuration rail.*`;
      } else if (msgLower.includes('database') || msgLower.includes('schema') || msgLower.includes('relation') || msgLower.includes('model') || msgLower.includes('table') || msgLower.includes('entity')) {
        responseText = header + `### Multi-Tenant Relational Database Orchestration

Within the AppForge AI generator, your data structure is compiled into isolated virtual layers:

| Concept | Implementation Strategy | Multi-Tenant Isolate Key |
| :--- | :--- | :--- |
| **Workspace Tenant Partition** | Automatic field filter injection | Enforced by \`tenantId: string\` |
| **Relationship Mapping** | Standard Foreign Key constraint generation | Relational index tracking |
| **Schema Validation Audit** | Automatic structure-to-query comparison | Healed by Compliant Validator |

#### Structural Entity Declaration Example:
\`\`\`json
{
  "name": "UserAccount",
  "fields": [
    { "name": "id", "type": "uuid", "isRequired": true },
    { "name": "tenantId", "type": "string", "isRequired": true },
    { "name": "email", "type": "string", "isRequired": true },
    { "name": "role", "type": "string", "isRequired": true }
  ]
}
\`\`\``;
      } else if (msgLower.includes('project') || msgLower.includes('acme') || msgLower.includes('taskflow') || msgLower.includes('healthlink') || msgLower.includes('socialverse') || msgLower.includes('catalog')) {
        const projList = projectsListMemory.map(p => `* **${p.name}** [Status: ${p.status}] (${p.techStack}) - *${p.type}*\n  * Live sandbox: [View Link](${p.liveUrl})\n  * Source repository: \`${p.githubRepo}\``).join('\n');
        responseText = header + `### Active Workspace Project Records Catalog

I pulled these records from the current persistence ledger in real time:

${projList}

*Manage, clone, or delete these deployments by visiting the **Developer Hub** under the Projects catalogue tab.*`;
      } else if (msgLower.includes('backlog') || msgLower.includes('task') || msgLower.includes('todo') || msgLower.includes('kanban')) {
        const backlogList = projectData.backlog.map(t => `* [${t.status}] **${t.title}** (${t.priority} priority) - *${t.category}*`).join('\n');
        responseText = header + `### Integrated Scrum Kanban Backlog

Here is the current state of tasks on your development board:

${backlogList}

*Update, create, or re-order these cards using the interactive Kanban board situated inside the **Monitor** dashboard.*`;
      } else if (msgLower.includes('bridge') || msgLower.includes('sync') || msgLower.includes('daemon') || msgLower.includes('hostname') || msgLower.includes('connection')) {
        responseText = header + `### AppForge Daemon Tunnel Status

The local background bridge keeps cloud files synchronized with your desktop workspace daemon:

* **Connection Status**: ${projectData.bridge.connected ? '🟢 ONLINE & BOUND' : '🔴 OFFLINE / DISCONNECTED'}
* **Target Node Hostname**: \`${projectData.bridge.hostname || 'None'}\`
* **Agent Core version**: \`${projectData.bridge.agentVersion || 'Not compiled'}\`
* **Local Kernel OS**: \`${projectData.bridge.os || 'None'}\`
* **Hardware CPU Architecture**: \`${projectData.bridge.cpuModel || 'None'}\`
* **Last Synchronization timestamp**: \`${projectData.bridge.lastSync || 'Never'}\`

*You can test reconnection routines or toggle simulator states in the **Platform Settings** hub.*`;
      } else {
        responseText = header + `### Welcome to your Senior Workspace AI Advisor!

I am ready to provide powerful, structure-aware responses regarding your code, database schemas, and micro-vm microservices.

Here is a list of specific deep topics you can ask me to analyze now:
1. **Explain Blueprint Contracts**: "Explain the components inside an active AppSpec model?" or "How does multi-tenant security isolate rows?"
2. **Auto-Healing Audits**: "How does the validator healer fix database compile errors?"
3. **Review Databases & Entities**: "Show me how relational properties map between schemas."
4. **Active Workspace Telemetry**: "Outline the tracked files lists or active Kanban backlog decks."
5. **Synchronize Local Tunnels**: "Explain the daemon bridge architecture specifications."`;
      }
    }

    res.json({ success: true, answer: responseText });
  } catch (err: any) {
    console.error('Assistant endpoint crash: ', err);
    res.json({ success: false, error: err.message || 'Assistant failed' });
  }
});

// 6. Manual trigger for auto repairs
app.post('/api/generate/:jobId/repair', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobsStore[jobId];
  if (!job) {
    res.status(404).json({ error: `Generation job ${jobId} not found` });
    return;
  }

  if (!job.validation || job.validation.overallStatus === 'passed') {
    res.json({ success: true, message: 'Blueprint already 100% valid under core schema regulations.', job });
    return;
  }

  const repairedJob = rerunRepairsForJob(job);
  jobsStore[jobId] = repairedJob;

  res.json({
    success: true,
    message: 'Manual repair execution completed successfully.',
    job: repairedJob
  });
});

// Serve frontend assets with Vite development / production fallback
async function bootServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AppForgeAI background server launched successfully, routing traffic sequentially on port ${PORT}`);
  });
}

bootServer();
