# AppForgeAI

AppForgeAI is an AI-powered application generation and project monitoring workspace. It combines a React dashboard, an Express API server, Gemini-backed blueprint generation, validation and repair logic, integration tracking, cost analytics, pipeline logs, Git history, and a local bridge for syncing project telemetry.

## What It Does

- Generates structured app blueprints from natural language prompts.
- Produces intent, data schema, API, page, workflow, and integration specifications.
- Validates generated blueprints with Zod and custom consistency checks.
- Repairs common blueprint issues before presenting the final output.
- Tracks generated jobs, pipeline activity, evaluation results, and estimated costs.
- Shows project health, file metrics, Git history, sprint backlog, and bridge status.
- Provides an integration registry for Slack, WhatsApp, Gmail, Stripe, Google Sheets, Jira, and generic webhooks.
- Includes a floating assistant for reviewing and explaining generated work.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- Tailwind CSS
- Google Gemini API
- Zod
- Lucide React icons

## Project Structure

```text
.
|-- server.ts                 # Express API server and Vite dev middleware
|-- src/App.tsx               # Main AppForgeAI workspace UI
|-- src/generate-engine.ts    # Blueprint generation, validation, and repair logic
|-- src/components/           # Dashboard, generator, logs, settings, bridge, and Git UI
|-- src/types.ts              # Shared AppForgeAI data models
|-- index.html                # Vite entry HTML
|-- vite.config.ts            # Vite configuration
`-- package.json              # Scripts and dependencies
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file and add your Gemini API key:

```bash
GEMINI_API_KEY=your_gemini_api_key
```

Run the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev      # Start the Express and Vite development server
npm run lint     # Run TypeScript checks
npm run build    # Build the frontend and bundled server
npm run start    # Start the production server from dist/server.cjs
npm run clean    # Remove generated build output
```

## Core Views

- Dashboard: project status, history, and generation overview.
- Generate App: prompt-driven blueprint generation workflow.
- Pipeline Logs: generated job and stage activity.
- Integrations: available service integrations and capabilities.
- Evaluation Logs: validation and repair history.
- Cost Analytics: estimated generation usage and cost summaries.
- Settings: workspace and bridge controls.
- Connecting Terminal: local bridge setup and sync status.
- Sprint Backlog: task board for project work.
- Git History: recent commit activity and active branch details.

## Notes

AppForgeAI runs with in-memory project and job state during local development. Generated data resets when the server restarts unless it is synced or persisted by future storage work.
