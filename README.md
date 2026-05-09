# Nexus

> Intelligent AI orchestration platform. Bring your own API keys. The routing engine automatically selects the optimal model, tools, and workflow for every request.

---

## What This Is

Nexus is not a chatbot wrapper. It is an AI operating system — a platform that:

- **Routes** every request to the best available model based on intent, complexity, and cost
- **Orchestrates** multi-model workflows where different models handle different stages
- **Manages** a plugin/tool ecosystem that models can invoke during reasoning
- **Explains** every routing decision transparently in the UI
- **Never charges** for AI usage — users connect their own provider API keys (OpenAI, Anthropic, Google Gemini, Ollama)

---

## Core Architecture

```
Browser (Next.js App Router)
  └── Routing Engine (server-side, TypeScript)
        ├── Intent Classifier     — classifies prompt into task type
        ├── Model Scorer          — scores available models against user preferences
        ├── Provider Adapters     — OpenAI / Anthropic / Google / Ollama via Vercel AI SDK
        └── Plugin Executor       — sandboxed tool invocation (web search, doc parser, etc.)

Supabase
  ├── PostgreSQL   — users, conversations, messages, workflows, plugins, metrics
  ├── Auth         — GitHub + Google OAuth
  ├── Vault        — encrypted API key storage (keys never reach the frontend)
  └── Storage      — file uploads for document analysis
```

---

## Routing Engine

The routing engine is the core product. It processes every prompt through a four-stage pipeline:

### Stage 1 — Intent Classification
Rule-based classifier detects task type from prompt content and history:

| Intent | Trigger signals |
|--------|----------------|
| `simple_qa` | Short, conversational |
| `long_document_analysis` | File refs, long input (>3000 chars) |
| `code_generation` | Code patterns, build/implement keywords |
| `code_review` | Review/debug/fix + code presence |
| `math_reasoning` | Calculate, equation, proof keywords |
| `creative_writing` | Write a, story, poem, essay |
| `web_research` | Latest, current, today, news keywords |
| `data_analysis` | Data, chart, CSV, trend keywords |
| `multi_step_task` | Build me, step by step, workflow keywords |

### Stage 2 — Model Scoring
Each available model is scored across five dimensions, weighted by user preferences:

```
score = (accuracy × pref_accuracy × 0.25)
      + (speed × pref_speed × 0.20)
      + (cost_efficiency × pref_cost × 0.20)
      + (task_suitability × 0.25)
      + (context_fit × 0.10)
```

Models are hard-disqualified if they lack required capabilities (tool use, vision, context window).

### Stage 3 — Tool Selection
If the classified intent requires tools (e.g. web research → web_search), the engine checks which plugins the user has enabled and includes the relevant tools in the model call.

### Stage 4 — Execution + Explanation
The winner model is called via Vercel AI SDK with streaming. The routing decision (model chosen, reasoning, score breakdown, estimated cost) is returned in response headers and displayed in the UI.

---

## Model Registry

| Provider | Model | Strengths | Context |
|----------|-------|-----------|---------|
| Anthropic | claude-3-5-sonnet | Documents, code, long-context | 200K |
| Anthropic | claude-3-haiku | Fast Q&A | 200K |
| OpenAI | gpt-4o | General, creative, vision | 128K |
| OpenAI | gpt-4o-mini | Cost-efficient Q&A | 128K |
| OpenAI | o3-mini | Math, reasoning, code | 128K |
| Google | gemini-2.0-flash | Ultra-long context, low cost | 1M |
| Ollama | (user-configured) | Privacy, local execution | varies |

---

## API Key Security

User-provided API keys follow this flow — the raw key is **never stored in plaintext, never returned to the browser**:

```
1. User submits key → POST /api/keys (HTTPS, server-side only)
2. Server calls Supabase Vault → stores encrypted secret
3. Vault returns a UUID (vault_secret_id) — this is all that's stored in DB
4. At request time: server decrypts key in memory, uses for API call, discards
5. Frontend never receives the key — only sees: provider, label, test status
```

---

## Plugin System

Plugins expose tools to the AI models. Each plugin defines:
- **Capabilities** — what it can do (`web_search`, `file_read`, `math`, etc.)
- **Config schema** — what the user must provide (e.g. Tavily API key)
- **Tools** — functions the model can invoke with structured parameters

### Built-in Plugins (Phase 1)
| Plugin | Capability | External key required |
|--------|-----------|----------------------|
| Web Search | `web_search` | Tavily API key |
| URL Reader | `web_read` | None |
| Calculator | `math` | None |
| Document Parser | `file_read` | None |

---

## Database Schema

Six core tables with Row Level Security — users only see their own data:

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user data, optimization preferences |
| `api_keys` | Provider key metadata (vault_secret_id only, no raw keys) |
| `conversations` | Chat session containers |
| `messages` | Messages with full routing metadata per response |
| `workflows` | Saved ReactFlow node graphs |
| `workflow_runs` | Execution logs with step-by-step trace |
| `plugins` | Plugin registry (system + user-submitted future) |
| `user_plugins` | Per-user plugin installations and config |
| `model_metrics` | Aggregated performance data for routing refinement |

---

## User Optimization Preferences

Users configure routing weights via sliders (0–1 per dimension):

| Preference | Effect on routing |
|-----------|------------------|
| Accuracy | Weights toward higher-capability models |
| Speed | Weights toward lower-latency models |
| Cost | Weights toward cheaper models |
| Creativity | Weights toward models with creative strength scores |
| Reasoning | Weights toward reasoning-specialized models |
| Privacy | Weights toward local/Ollama models |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Workflow editor | ReactFlow / @xyflow/react |
| Auth | Supabase Auth (GitHub + Google OAuth) |
| Database | Supabase PostgreSQL with Row Level Security |
| Secret storage | Supabase Vault |
| File storage | Supabase Storage |
| AI SDK | Vercel AI SDK (unified provider interface + streaming) |
| Hosting | Vercel (Fluid Compute, native streaming) |

---

## Phased Implementation Plan

### Phase 1 — Foundation (Weeks 1–2)
- [x] Next.js 16 project scaffold
- [x] Supabase database schema (6 migrations)
- [x] Auth flow (GitHub + Google OAuth)
- [x] API key management — add / remove / test (server-side only)
- [x] Supabase Vault integration for key encryption
- [x] Routing engine — intent classifier, model scorer, provider adapters
- [x] Dashboard layout + sidebar navigation
- [x] Proxy-based session auth (Next.js 16 `proxy.ts`)

### Phase 2 — Core Chat (Weeks 3–4)
- [ ] Streaming chat interface with Vercel AI SDK
- [ ] Routing decision badge and explainer panel
- [ ] Conversation persistence (messages + routing metadata)
- [ ] Optimization preference sliders (user settings)
- [ ] Routing engine integration with live API calls

### Phase 3 — Plugins + Analytics (Weeks 5–6)
- [ ] Plugin enable/configure UI
- [ ] Web Search plugin (Tavily)
- [ ] URL Reader and Calculator plugins
- [ ] Ollama / local model support
- [ ] Cost tracking dashboard
- [ ] Usage analytics by model, day, task type

### Phase 4 — Workflow Builder (Weeks 7–8)
- [ ] ReactFlow canvas with node palette
- [ ] Trigger, Model, Tool, Condition, Output node types
- [ ] Server-side workflow runner with step logging
- [ ] Workflow run history and status

### Phase 5 — Scale (Post-MVP)
- [ ] Coding agent / terminal sandbox (Vercel Sandbox)
- [ ] Plugin marketplace (third-party submissions)
- [ ] Team workspaces and shared API key pools
- [ ] Scheduled workflow triggers
- [ ] RAG / vector DB integration (pgvector)
- [ ] Routing improvement from historical performance data

---

## Monetization Plan

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 3 providers, built-in plugins only |
| Pro | $12/mo | All providers, all plugins, workflow builder |
| Power | $29/mo | Priority routing, analytics export, custom endpoints |
| Team | $49/seat/mo | Shared workspace, pooled keys, audit logs |

---

## Competitive Positioning

| Tool | Gap Nexus fills |
|------|----------------|
| LangChain | No UI, developer-only, no routing |
| OpenRouter | Routing only — no plugins, no workflows, no UI |
| Dify | Not BYOK-first, opaque routing logic |
| Flowise | Complex setup, poor routing, no cost transparency |
| ChatGPT | No model choice, no cost visibility, no API key control |

**Core differentiator:** BYOK + transparent intelligent routing + visual workflows in a clean UI built for non-technical users.

---

## Repository Structure

```
nexus/
├── app/
│   ├── (auth)/           # Login, OAuth callback
│   ├── (dashboard)/      # Chat, Workflows, Plugins, Analytics, Settings
│   └── api/              # Route handlers — chat, keys, workflows, plugins
├── components/
│   ├── chat/             # Chat UI, message list, routing badge
│   ├── layout/           # Sidebar, shell
│   ├── plugins/          # Plugin manager UI
│   ├── routing/          # Routing explainer panel
│   ├── settings/         # API key manager, preference sliders
│   └── workflow/         # ReactFlow canvas and node types
├── lib/
│   ├── routing/          # Engine, classifier, scorer, model registry
│   ├── providers/        # AI SDK adapters (OpenAI, Anthropic, Google, Ollama)
│   ├── plugins/          # Plugin registry and built-in plugin handlers
│   ├── workflows/        # Workflow runner and node executors
│   ├── supabase/         # Browser client, server client, session helper
│   └── vault.ts          # Supabase Vault read/write/delete
├── types/                # Shared TypeScript types
├── supabase/
│   └── migrations/       # 001–006: profiles, keys, conversations, workflows, plugins, metrics
└── proxy.ts              # Next.js 16 auth proxy (replaces middleware.ts)
```
