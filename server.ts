import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { AppForgeProject, ProjectTask, Commit, FileMetric, GenerationJob, IntegrationRegistryEntry } from './src/types.js';
import { generateDeterministicDemo, generateAIBlueprint, validateBlueprint, runRepairs } from './src/generate-engine.js';

// Setup Express
const app = express();
const PORT = 3000;

// In-Memory Database for Blueprint Jobs
const jobsStore: Record<string, GenerationJob> = {};

// Integrations Registry
const integrationsRegistry: IntegrationRegistryEntry[] = [
  { id: 'slack', name: 'Slack', status: 'active', description: 'Stream system events, sprint alerts, and operational notifications directly to collaboration channels.', capabilities: ['Direct messaging', 'Channel broadcasts', 'Interactive action blocks'], authType: 'OAuth2 / Bot Token', triggers: ['Task Status Changed', 'Build Triggered', 'Critical Error'], actions: ['Send Message', 'Create Channel', 'Broadcast Alert'] },
  { id: 'whatsapp', name: 'WhatsApp', status: 'available', description: 'Dispatch customer communication sequences, security alerts, or status summaries directly via WhatsApp Business link.', capabilities: ['Transactional SMS templates', 'Inbound payload handlers'], authType: 'API Secret Key', triggers: ['New Signup', 'Payment Received'], actions: ['Send Template Message', 'Push Notification'] },
  { id: 'gmail', name: 'Gmail', status: 'configured', description: 'Deliver automated corporate receipts, invoices, custom notification digests, and drafts sequences.', capabilities: ['Transactional drafts pre-fill', 'Internal receipt dispatches'], authType: 'OAuth2 App Password', triggers: ['Order Completed', 'Weekly Digest Plan'], actions: ['Send HTML Email', 'Draft Email Reply'] },
  { id: 'stripe', name: 'Stripe', status: 'active', description: 'Process global subscription models, checkout sessions, invoices, and webhook event-to-schema synchronization.', capabilities: ['Checkout flow proxy', 'Payment webhooks hook'], authType: 'Webhook Key & Restricted Token', triggers: ['Charge Succeeded', 'Subscription Cancelled', 'Invoice Unpaid'], actions: ['Create Customer', 'Refund Transaction', 'Retrieve Invoices'] },
  { id: 'sheets', name: 'Google Sheets', status: 'available', description: 'Append logs, activity metrics, customer directories, or audit listings instantly to collaborative tables.', capabilities: ['Live sheets append row', 'Cell value lookup triggers'], authType: 'Google Service Account OAuth2', triggers: ['Row Added', 'Metric Threshold Crossed'], actions: ['Append Row', 'Update Row', 'Create Sheet'] },
  { id: 'jira', name: 'Jira', status: 'available', description: 'Synchronize sprint backlog parameters, card transitions, epic updates, and subtask trees with external project desk.', capabilities: ['Issue statuses callbacks', 'Task state replication'], authType: 'Atlassian OAuth Access Token', triggers: ['Issue Updated', 'Comment Created'], actions: ['Create Issue', 'Transition Task', 'Add Comment'] },
  { id: 'webhook', name: 'Webhook', status: 'configured', description: 'Bridge general third-party services with high-performance payload relays, signature checks, and validation queues.', capabilities: ['Arbitrary payload receive', 'Custom JSON triggers dispatch'], authType: 'HMAC Webhook Sign Secret', triggers: ['Incoming Webhook Dispatch'], actions: ['Forward Request', 'Dispatch JSON Payload'] }
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
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ error: 'Core developer specifications prompt is required' });
      return;
    }
    const hasKey = !!process.env.GEMINI_API_KEY;
    let job: GenerationJob;
    if (hasKey) {
      job = await generateAIBlueprint(prompt, process.env.GEMINI_API_KEY!);
    } else {
      job = generateDeterministicDemo(prompt);
    }
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

    if (hasKey) {
      const ai = getGemini();
      const systemInstruction = `
You are AppForgeAI's senior code strategist and assistant. Help explain AppSpec documents, database models, schemas, and repair logs clearly. 
Here is the active context: ${JSON.stringify(context || {})}
State clear action guidelines. Use strict, direct, concise developer feedback and keep formatted Markdown. Include no unasked commentary.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      responseText = response.text || "AI completed successfully.";
    } else {
      // Fallback local assistant response
      const msgLower = message.toLowerCase();
      if (msgLower.includes('explain') || msgLower.includes('spec') || msgLower.includes('what is')) {
        responseText = `**AppForgeAI Senior Architect (Local Offline Assistant):**\n\nThe app blueprint models represent a completely scaffolded workspace stack:\n- **AppIntent**: Captures your primary feature goals and dependencies requested.\n- **DataSchema**: Maps logical relational entities with strict multi-tenant isolate key (\`tenantId\`).\n- **AppSpec**: Orchestrates the API routing, integration middleware hook registries, and visual UI layouts components.`;
      } else if (msgLower.includes('error') || msgLower.includes('repair') || msgLower.includes('validate')) {
        responseText = `**AppForgeAI Senior Architect (Local Offline Assistant):**\n\nOur system validation engine scans structural alignments:\n1. Checks every entity for the \`tenantId\` parameter field.\n2. Confirms page layouts bind closely to actual API paths.\n3. Checks that bound entities reflect real DB tables.\n\nAll repair logs record auto-adjustments. If anything is missing, the engine executes \`field_repair\` or \`consistency_repair\` immediately.`;
      } else {
        responseText = `**AppForgeAI Senior Architect (Local Offline Assistant):**\n\nWelcome to your project console! \n- To track development locally, connect using the **Connecting Terminal** script instructions.\n- To compile a brand new blueprint workspace, head directly to **Generate App** page in the sub navigation rail. \n- (Note: Configure process.env.GEMINI_API_KEY to activate full AI contextual answers).`;
      }
    }

    res.json({ success: true, answer: responseText });
  } catch (err: any) {
    console.error('Assistant endpoint error: ', err);
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

  if (!job.validation || job.validation.valid) {
    res.json({ success: true, message: 'Blueprint already 100% valid under core schema regulations.', job });
    return;
  }

  const repairsResult = runRepairs(job.appIntent, job.dataSchema, job.appSpec, job.validation);
  job.dataSchema = repairsResult.repairedSchema;
  job.appSpec = repairsResult.repairedSpec;
  job.repairLog = [...job.repairLog, ...repairsResult.repairs];
  job.validation = validateBlueprint(job.appIntent, job.dataSchema, job.appSpec);
  
  job.events.push({
    stage: 'Repair Engine',
    status: 'completed',
    latencyMs: 15
  });

  res.json({
    success: true,
    message: 'Manual repair execution completed successfully.',
    job
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
