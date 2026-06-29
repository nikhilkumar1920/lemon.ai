# Agents API

Reference documentation for all AI agents in lemon.test.

## Mastra Instance

All agents are registered in a single Mastra instance:

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  agents: {
    testGeneratorAgent,
    executorAgent,
    editorAgent,
    integrationGeneratorAgent,
    e2eGeneratorAgent,
  },
});
```

Access agents via:

```typescript
const agent = mastra.getAgent("testGeneratorAgent");
const result = await agent.generate("your prompt");
```

---

## testGeneratorAgent

| Property | Value |
|---|---|
| **ID** | `testGeneratorAgent` |
| **Model** | `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Source** | `src/mastra/agents/testGeneratorAgent.ts` |

**Tools**: `fetchAnalysisTool`, `readFileTool`, `writeFileTool`, `storeTestsTool`

**Instructions Summary**: Expert test engineer that reads source code + Redis analysis, writes comprehensive vitest unit tests covering happy paths, edge cases, error cases, and known issues.

---

## integrationGeneratorAgent

| Property | Value |
|---|---|
| **ID** | `integrationGeneratorAgent` |
| **Model** | `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Source** | `src/mastra/agents/integrationGeneratorAgent.ts` |

**Tools**: `fetchAnalysisTool`, `readFileTool`, `writeFileTool`, `storeTestsTool`

**Instructions Summary**: Expert test engineer specializing in integration testing. Tests interactions between modules, API endpoints with real databases, service layer data flows, and cross-boundary error handling.

---

## e2eGeneratorAgent

| Property | Value |
|---|---|
| **ID** | `e2eGeneratorAgent` |
| **Model** | `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Source** | `src/mastra/agents/e2eGeneratorAgent.ts` |

**Tools**: `fetchAnalysisTool`, `readFileTool`, `writeFileTool`, `storeTestsTool`

**Instructions Summary**: Expert test engineer specializing in end-to-end testing. Tests complete user journeys, full API request/response cycles, multi-step workflows, and authentication flows from an external client perspective.

---

## executorAgent

| Property | Value |
|---|---|
| **ID** | `executorAgent` |
| **Model** | `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Source** | `src/mastra/agents/executorAgent.ts` |

**Tools**: `runTestsTool`, `storeResultsTool`, `fetchAnalysisTool`

**Instructions Summary**: Test execution agent that runs vitest, captures pass/fail status, full output, and individual test failures. Persists everything to Redis for the editor agent.

---

## editorAgent

| Property | Value |
|---|---|
| **ID** | `editorAgent` |
| **Model** | `cloudflare-workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Source** | `src/mastra/agents/editorAgent.ts` |

**Tools**: `fetchResultsTool`, `fetchAnalysisTool`, `readFileTool`, `writeFileTool`, `listFilesTool`

**Instructions Summary**: Senior code editor and debugger. Reads failing test results from Redis, analyzes failure messages, and applies minimal surgical fixes to source files only (never modifies test files).
