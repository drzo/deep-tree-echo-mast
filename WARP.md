# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- This repo has two main parts:
  - Root: a Mastra-based TypeScript service (agents, tools, workflows, and triggers) that exposes HTTP endpoints and integrates with Inngest for scheduling/observability.
  - echoself/: a separate Remix web app (UI and demo workspace) with optional Python components and CI automation.

Common commands (root service)
- Install dependencies
  ```powershell path=null start=null
  npm ci
  ```
- Run the Mastra dev server (Hono on http://localhost:5000)
  ```powershell path=null start=null
  npm run dev
  ```
- Build (bundles workflows/agents with Mastra bundler)
  ```powershell path=null start=null
  npm run build
  ```
- Type-check and format
  ```powershell path=null start=null
  npm run check
  npm run check:format
  npm run format
  ```
- Inngest local dev (required for workflows, realtime, and cron)
  - Run this in a second terminal alongside the Mastra dev server:
  ```powershell path=null start=null
  npx inngest-cli dev -u http://localhost:5000/api/inngest --host 127.0.0.1 --port 3000
  ```
- Quick chat API check
  ```powershell path=null start=null
  $body = @{ message = "Hello from Warp" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/chat -ContentType "application/json" -Body $body
  ```

Common commands (echoself web app)
- Install and run
  ```powershell path=null start=null
  cd echoself
  npm ci
  npm run dev
  ```
- Build and start
  ```powershell path=null start=null
  npm run build
  npm start
  ```
- Lint, format, type-check
  ```powershell path=null start=null
  npm run lint
  npm run lint:fix
  npm run format
  npm run format:check
  npm run typecheck
  ```
- Dependency audit (uses repo script and CI)
  ```powershell path=null start=null
  npm run audit:deps
  ```
- Deno (used by CI for lint/tests). If you use it locally:
  ```powershell path=null start=null
  deno lint
  deno test -A
  # single test example
  deno test -A --filter "name or pattern"
  ```

Environment and services
- Root service
  - Node.js: >= 20.9 (package.json engines)
  - Database: PostgreSQL (DATABASE_URL). The service uses @mastra/pg and a direct pg Pool (src/db.ts). The memory tools expect vector search (pgvector) and specific tables; ensure schema exists before using the memory tools.
  - LLM/Embeddings: OPENAI_API_KEY (optional OPENAI_BASE_URL). Embeddings use text-embedding-ada-002 via AI SDK.
  - Scheduling (optional): SCHEDULE_CRON_EXPRESSION and SCHEDULE_CRON_TIMEZONE can override the default daily schedule.
- echoself web app
  - Node.js: >= 18
  - Copy echoself/.env.example to .env and set SUPABASE_URL, SUPABASE_ANON_KEY (and optionally OPENAI_API_KEY for embeddings/AI chat). Supabase migrations live under echoself/supabase/.
  - Optional Python components under echoself/NanEcho (see echoself/README.md).

High-level architecture (root service)
- Entry and server: src/mastra/index.ts
  - Creates a Mastra instance with:
    - storage: sharedPostgresStorage (src/mastra/storage)
    - agents: deepTreeEchoAgent
    - workflows: memoryProcessingWorkflow
    - mcpServers: one server exposing all tools
    - server: Hono server on 0.0.0.0:5000 with middleware and API routes
      - /api/inngest: integrates Mastra workflows with the Inngest dev server
      - /api/chat: chat endpoint that
        - queries memories (memoryQueryTool)
        - stores conversation turns (conversationStorageTool)
        - generates a response via deepTreeEchoAgent
  - Enforces a single-agent and single-workflow sanity check for the current UI model.
- Agent: src/mastra/agents/deepTreeEchoAgent.ts
  - OpenAI via AI SDK, memory backed by Postgres, and tools: conversationStorageTool, memoryQueryTool.
- Tools (selected)
  - memoryQueryTool: builds an OpenAI embedding for the user query and searches Postgres across multiple memory tables using both text and vector similarity. Expected tables (with an embedding column):
    - semantic_memory
    - episodic_memory
    - wisdom_repository
    - working_memory
- Workflows and scheduling: src/mastra/workflows/memoryProcessingWorkflow.ts
  - Orchestrates a recurring memory lifecycle with three steps:
    - Daily parsing (working memories, tagging)
    - Weekly processing (consolidate to semantic/episodic/procedural)
    - Monthly introspection (wisdom extraction)
  - A cron trigger is registered in src/mastra/index.ts via registerCronWorkflow; defaults to 02:00 America/Los_Angeles.
- Inngest integration: src/mastra/inngest/
  - client.ts: Dev mode uses baseUrl http://localhost:3000 with @inngest/realtime middleware.
  - index.ts: Wraps Mastra’s inngest helpers, registers API routes as Inngest functions, collects workflow functions, and serves them through inngest/hono. The local serveHost points to http://localhost:5000 in dev.
- Triggers (HTTP webhooks): src/triggers/
  - Slack: /webhooks/slack/action and a /test/slack SSE diagnostics route. Uses @slack/web-api and reacts in-thread.
  - Telegram: /webhooks/telegram/action. Warns if TELEGRAM_BOT_TOKEN is not set.

High-level architecture (echoself web app)
- Remix app (React + Tailwind) under echoself/app and echoself/src
  - Features described in echoself/README.md: AI chat, memory visualization, terminal emulation, orchestrator, and an adaptive feedback loop.
  - Supabase is used for persistence and vector search; OpenAI can be used for embeddings/chat.
  - CI: .github/workflows in echoself automate linting/formatting and dependency audits (see automated-quality.yml). Deno-based lint/tests also run in CI.
- Optional ML/Python: echoself/NanEcho includes a small Python project (pyproject.toml) and a simple server entry (see echoself/README.md for steps).

Notes and pitfalls
- Start order in local dev: first npm run dev (root), then run the Inngest dev CLI in another terminal. Without Inngest dev running, cron-like triggers and realtime monitoring won’t function.
- Database schema: the root memory tools expect pgvector and specific tables/columns. If you’re using Supabase, ensure pgvector is enabled and that the schema matches the tool queries in src/mastra/tools/memoryQueryTool.ts.
- Only one agent and one workflow should be registered (index.ts enforces this with runtime errors).
