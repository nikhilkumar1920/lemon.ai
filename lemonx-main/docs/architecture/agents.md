# Agents

lemon.test uses five specialized AI agents built on the Mastra framework. All agents use Cloudflare Workers AI with the model `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

## Generator Agents

### testGeneratorAgent

**Purpose**: Generates vitest unit tests for individual source files.

**Tools**:
- `fetchAnalysisTool` — retrieves prior code analysis from Redis (RAG context)
- `readFileTool` — reads the source file content
- `writeFileTool` — saves the generated test file
- `storeTestsTool` — persists test metadata to Redis

**Output**: `src/__tests__/<filename>.test.ts`

**Testing Coverage**:
- Happy path (normal expected behavior)
- Edge cases (empty input, nulls, boundary values)
- Error cases (exceptions, invalid input)
- Issues flagged in stored analysis

**Source**: `src/mastra/agents/testGeneratorAgent.ts`

---

### integrationGeneratorAgent

**Purpose**: Generates vitest integration tests that verify interactions between multiple modules, services, and external dependencies.

**Tools**:
- `fetchAnalysisTool` — retrieves prior code analysis from Redis
- `readFileTool` — reads the source file content
- `writeFileTool` — saves the generated test file
- `storeTestsTool` — persists test metadata to Redis

**Output**: `tests/integration/<filename>.test.ts`

**Testing Coverage**:
- Interactions between multiple modules/services
- API endpoints with real database connections
- Service layer interactions and data flow
- External integrations (databases, message queues, external APIs)
- Data transformation pipelines
- Authentication and authorization flows
- Error handling across module boundaries

**Guidelines**:
- Test real interactions between components, not isolated units
- Use setup/teardown hooks for shared resources
- Mock only expensive or unreliable external services
- Use real database connections when possible
- Focus on data flow and state changes across boundaries
- Clean up test data in afterAll hooks

**Source**: `src/mastra/agents/integrationGeneratorAgent.ts`

---

### e2eGeneratorAgent

**Purpose**: Generates vitest end-to-end tests that verify complete user flows and system behavior from the outside.

**Tools**:
- `fetchAnalysisTool` — retrieves prior code analysis from Redis
- `readFileTool` — reads source files, especially entry points and routes
- `writeFileTool` — saves the generated test file
- `storeTestsTool` — persists test metadata to Redis

**Output**: `tests/e2e/<filename>.test.ts`

**Testing Coverage**:
- Full API request/response cycles with real server
- Complete user workflows (signup → login → use feature → logout)
- Multi-step processes and state transitions
- Authentication and authorization end-to-end flows
- Payment or transaction flows
- Data lifecycle (create → read → update → delete)
- Error recovery and edge case user journeys
- Cross-feature interactions

**Guidelines**:
- Test from the perspective of an external user/client
- Make real HTTP requests to the application
- Set up test fixtures in beforeAll, clean up in afterAll
- Each test should be a complete, independent user flow
- Verify the full chain: request → processing → response → side effects
- Test both successful flows and error/failure paths

**Source**: `src/mastra/agents/e2eGeneratorAgent.ts`

---

## Execution Agents

### executorAgent

**Purpose**: Runs vitest on generated test files and stores pass/fail results in Redis.

**Tools**:
- `runTestsTool` — executes vitest on a specific test file
- `storeResultsTool` — persists test results to Redis
- `fetchAnalysisTool` — retrieves prior code analysis (available but not primary)

**Responsibilities**:
- Execute vitest with verbose output
- Capture pass/fail status for each test
- Collect full stdout/stderr output
- Parse individual test failures with error messages
- Store everything to Redis with iteration number

**Output**: Test results stored to `test_results:*` keys in Redis

**Source**: `src/mastra/agents/executorAgent.ts`

---

## Editor Agents

### editorAgent

**Purpose**: Reads failing test results from Redis and applies targeted code fixes to make tests pass.

**Tools**:
- `fetchResultsTool` — retrieves test results from Redis
- `fetchAnalysisTool` — retrieves prior code analysis for context
- `readFileTool` — reads source files that need fixing
- `writeFileTool` — applies fixes (logs patches to Redis)
- `listFilesTool` — lists available source files

**Responsibilities**:
- Fetch the latest test results for the current iteration
- For each failing test, read the relevant source file
- Analyze failure messages to determine the root cause
- Apply the minimal fix needed (surgical changes only)
- Never modify test files — only fix source files
- Report what was changed and why

**Principles**:
- Be surgical — make the smallest change that fixes the failure
- If a fix might break other things, add a comment explaining the tradeoff
- Include a patch description and iteration number with every fix

**Source**: `src/mastra/agents/editorAgent.ts`

---

## Unused Agents

### orchestratorAgent

A supervisor agent that was designed to coordinate the full loop with LibSQL memory. Currently unused — the orchestration logic lives in `src/index.ts` instead.

**Source**: `src/mastra/agents/orchestratorAgent.ts`

### research-agent

A standalone research agent using OpenAI GPT-5-mini. Not part of the testing pipeline.

**Source**: `src/mastra/agents/research-agent.ts`

---

## Agent Tool Matrix

| Agent | fetchAnalysis | readFile | writeFile | runTests | storeResults | storeTests | fetchResults | listFiles |
|---|---|---|---|---|---|---|---|---|
| testGeneratorAgent | ✅ | ✅ | ✅ | | | ✅ | | |
| integrationGeneratorAgent | ✅ | ✅ | ✅ | | | ✅ | | |
| e2eGeneratorAgent | ✅ | ✅ | ✅ | | | ✅ | | |
| executorAgent | ✅ | | | ✅ | ✅ | | | |
| editorAgent | ✅ | ✅ | ✅ | | | | ✅ | ✅ |
