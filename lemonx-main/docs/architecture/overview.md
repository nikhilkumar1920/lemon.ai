# Architecture Overview

lemon.test is a multi-agent AI testing platform built on the Mastra framework. It autonomously generates, executes, and fixes tests for TypeScript/JavaScript codebases.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        lemon.test                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Entry Points                             │  │
│  │                                                              │  │
│  │  src/index.ts          src/webhook-server.ts                │  │
│  │  (direct execution)    (Express server, legacy mode)         │  │
│  └────────────┬───────────────────────────┬──────────────────┘  │
│               │                           │                      │
│               ▼                           ▼                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Mastra Orchestrator                       │  │
│  │                                                              │  │
│  │  testGeneratorAgent  integrationGeneratorAgent              │  │
│  │  e2eGeneratorAgent   executorAgent   editorAgent            │  │
│  └────────────┬───────────────────────────┬──────────────────┘  │
│               │                           │                      │
│               ▼                           ▼                      │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │       Tools           │  │         Redis                  │   │
│  │                        │  │                                │   │
│  │  File I/O:             │  │  code_analysis:*              │   │
│  │  - readFileTool        │  │  unit_tests:*                 │   │
│  │  - writeFileTool       │  │  test_results:*               │   │
│  │  - listFilesTool       │  │  code_patches:*               │   │
│  │                        │  │                                │   │
│  │  Runner:               │  │  (shared event log)            │   │
│  │  - runTestsTool        │  │                                │   │
│  │                        │  │                                │   │
│  │  Redis:                │  │                                │   │
│  │  - fetchAnalysisTool   │  │                                │   │
│  │  - fetchResultsTool    │  │                                │   │
│  │  - storeResultsTool    │  │                                │   │
│  │  - storeTestsTool      │  │                                │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  External Services                          │  │
│  │                                                              │  │
│  │  Cloudflare Workers AI (Llama 3.3 70B)                      │  │
│  │  CircleCI Machine Runner                                    │  │
│  │  GitHub API (optional PR creation)                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Core Components

### AI Agents

Five specialized agents powered by Mastra, each with a distinct role:

| Agent | Purpose | Model |
|---|---|---|
| `testGeneratorAgent` | Generates vitest unit tests | Cloudflare Workers AI |
| `integrationGeneratorAgent` | Generates integration tests | Cloudflare Workers AI |
| `e2eGeneratorAgent` | Generates E2E tests | Cloudflare Workers AI |
| `executorAgent` | Runs tests, stores results | Cloudflare Workers AI |
| `editorAgent` | Analyzes failures, fixes code | Cloudflare Workers AI |

### Tools

Purpose-built tools that agents use to interact with the codebase:

**File I/O Tools** — read, write, and list files in the target repository
**Runner Tools** — execute vitest and parse results
**Redis Tools** — store and retrieve analysis, tests, and results

### State Management

Redis serves as the shared event log and knowledge base:

- **Code Analysis** — prior analysis used as RAG context for generators
- **Test Metadata** — generated tests with source file mappings
- **Test Results** — pass/fail status, output, and failure details per iteration
- **Code Patches** — every fix applied by the editor agent with descriptions

## Execution Flow

1. **Discovery** — Scan target repo for source files matching each test type
2. **Generation** — Each generator agent reads source code + analysis, writes tests
3. **Execution** — executorAgent runs vitest, stores results in Redis
4. **Fixing** — editorAgent reads failures, applies minimal source code fixes
5. **Iteration** — Steps 3-4 repeat until all pass or max iterations reached

## Key Design Decisions

### Why Redis Over Direct Agent Communication

Agents communicate through Redis rather than calling each other directly because:

- **Auditability** — every decision is persisted and traceable
- **Decoupling** — agents can be developed, tested, and replaced independently
- **Replayability** — the entire session can be replayed from Redis data
- **Observability** — external tools can monitor agent behavior in real-time

### Why Specialized Agents Over One Generalist

Five specialized agents produce better results than one general-purpose agent:

- Each agent has focused instructions tailored to its specific task
- Tool sets are minimized to only what each agent needs
- Prompts can be optimized independently for each role
- Failures are easier to diagnose and fix

### Why vitest

vitest is the test framework because:

- Native TypeScript support
- Fast execution with parallel test running
- Rich assertion API that the AI can work with effectively
- Wide adoption in the TypeScript ecosystem

## Next

- [Agents](/architecture/agents) — detailed breakdown of each agent
- [Tools](/architecture/tools) — how tools work and when they're used
- [Control Flow](/architecture/control-flow) — step-by-step execution flow
- [State Management](/architecture/state-management) — Redis data structures
