# How It Works

lemon.test uses five specialized AI agents that work together in a generate → run → fix loop to autonomously create and maintain tests for your codebase.

## The Agent Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    lemon.test Pipeline                       │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Discover   │───▶│  Generate    │───▶│   Execute    │   │
│  │   Files      │    │   Tests      │    │   Tests      │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                                    ┌─────────────▼─────────┐ │
│                                    │     All Passing?      │ │
│                                    └──────┬──────────┬─────┘ │
│                                       Yes │          │ No    │
│                                           │          │       │
│                                    ┌──────▼──┐  ┌───▼──────┐ │
│                                    │  DONE   │  │  Fix     │ │
│                                    │  ✅     │  │  Code    │ │
│                                    └─────────┘  └───┬──────┘ │
│                                                     │        │
│                                    ┌────────────────┘        │
│                                    │ (loop up to 5 times)    │
│                                    └─────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Three Test Types, Three Phases

### Phase 1: Unit Tests

**Target files**: Any `.ts`/`.js` file (excluding `node_modules`, `__tests__`, `.d.ts`, `seeds/`, `migrations/`, `public/`)

**Agent**: `testGeneratorAgent`

**Output**: `src/__tests__/<filename>.test.ts`

The agent reads source code and any prior analysis stored in Redis, then writes comprehensive vitest unit tests covering happy paths, edge cases, and error scenarios.

### Phase 2: Integration Tests

**Target files**: Files containing `routes`, `api`, `service`, `controller`, `middleware`, or `handler`

**Agent**: `integrationGeneratorAgent`

**Output**: `tests/integration/<filename>.test.ts`

The agent focuses on interactions between modules, API endpoints with real database connections, service layer data flows, and cross-boundary error handling.

### Phase 3: E2E Tests

**Target files**: Files containing `app`, `server`, `index`, `routes`, or `auth`

**Agent**: `e2eGeneratorAgent`

**Output**: `tests/e2e/<filename>.test.ts`

The agent writes end-to-end tests for complete user journeys: full API request/response cycles, multi-step workflows, authentication flows, and data lifecycle operations.

## The Test-Fix Loop

After generating tests for all three types, lemon.test runs an iterative fix loop for each:

```
Iteration 1:
  executorAgent runs vitest on all test files
  Results stored in Redis (pass/fail, output, failures)
  
  If all pass → DONE
  If any fail → editorAgent analyzes failures and fixes source code
  
Iteration 2:
  executorAgent runs vitest again (on the fixed code)
  Results stored in Redis
  
  If all pass → DONE
  If any fail → editorAgent applies more fixes
  
...repeats up to MAX_ITERATIONS (5)
```

## How Agents Communicate

All agents communicate through **Redis** as a shared event log:

| Key Pattern | Purpose | Written By | Read By |
|---|---|---|---|
| `code_analysis:*` | Prior code analysis (RAG context) | External | Generator agents |
| `unit_tests:*` | Generated test metadata | Generator agents | — |
| `test_results:*` | Test execution results | executorAgent | editorAgent |
| `code_patches:*` | Applied code fixes | editorAgent (via writeFileTool) | — |

## File Discovery Logic

### Unit Test Discovery
Scans all `.ts`/`.js` files, excludes test directories and type definitions, takes the first 5.

### Integration Test Discovery
Scans for files containing: `routes`, `api`, `service`, `controller`, `middleware`, `handler`. Takes the first 5.

### E2E Test Discovery
Scans for files containing: `app`, `server`, `index`, `routes`, `auth`. Takes the first 3.

## Execution Modes

### Machine Runner Mode (Recommended)

```
Git Push → CircleCI → Machine Runner → lemon.test → Results → CircleCI
```

- Code runs directly on your infrastructure
- No webhooks, no tunnels
- lemon.test is pre-installed on the runner
- CircleCI assigns jobs to the runner automatically

### Webhook Mode (Legacy)

```
Git Push → CircleCI → Webhook → lemon.test Server → Clone Repo → Run Loop → Results
```

- Express server receives CircleCI webhooks
- Clones target repo into a temp workspace
- Runs the full test-fix loop
- Can automatically open GitHub PRs with changes

## Configuration

| Setting | Default | Description |
|---|---|---|
| `MAX_ITERATIONS` | 5 | Maximum fix loop iterations per test type |
| `TARGET_REPO` | `process.cwd()` | Path to the target repository |
| `LEMON_WORKSPACE` | — | Working directory (set by webhook mode) |
| `WEBHOOK_PORT` | 3456 | Port for the webhook server |
