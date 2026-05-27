<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## AI Assistant & Authentication Notes

- The repository contains an AI Assistant (`/assistant` + `POST /api/assistant`) that explains pipeline outputs (AppIntent, DataSchema, AppSpec, validation errors, repair logs). The assistant selects a provider by environment variable priority: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, then `GEMINI_API_KEY`.
- Authentication uses Supabase Auth. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment to enable sign-in and protected routes.
- During local builds the Supabase client is guarded so builds do not fail when env vars are missing; however runtime behavior requires those keys for full auth functionality.

