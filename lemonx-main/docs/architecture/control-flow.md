# Control Flow

This document describes the step-by-step execution flow of lemon.test from start to finish.

## High-Level Flow

```
Push → CircleCI → Machine Runner → lemon.test → Results → CircleCI
```

Within lemon.test, the flow is:

```
Discovery → Generation → Execution → Fixing → (repeat) → Report
```

## Detailed Execution Flow

### Phase 1: File Discovery

When `src/index.ts` starts, it scans the target repository for source files:

**Unit test targets**:
1. Recursively scan all `.ts`/`.js` files
2. Exclude: `node_modules`, `__tests__`, `.d.ts`, `seeds/`, `migrations/`, `public/`
3. Take the first 5 files

**Integration test targets**:
1. Recursively scan all `.ts`/`.js` files
2. Filter for files containing: `routes`, `api`, `service`, `controller`, `middleware`, `handler`
3. Exclude: `node_modules`, `__tests__`, `.d.ts`
4. Take the first 5 files

**E2E test targets**:
1. Recursively scan all `.ts`/`.js` files
2. Filter for files containing: `app`, `server`, `index`, `routes`, `auth`
3. Exclude: `node_modules`, `__tests__`, `.d.ts`
4. Take the first 3 files

### Phase 2: Test Generation

For each test type, the corresponding generator agent processes files sequentially:

**Unit test generation**:
```
For each source file:
  1. testGeneratorAgent receives prompt with file path
  2. Agent calls fetch-analysis to get RAG context
  3. Agent calls read-file to get source code
  4. Agent writes vitest unit tests
  5. Agent calls write-file to save to src/__tests__/<name>.test.ts
  6. Agent calls store-tests to persist metadata to Redis
```

**Integration test generation**:
```
For each integration target file:
  1. integrationGeneratorAgent receives prompt with file path
  2. Agent calls fetch-analysis to get RAG context
  3. Agent calls read-file to get source code
  4. Agent writes vitest integration tests
  5. Agent calls write-file to save to tests/integration/<name>.test.ts
  6. Agent calls store-tests to persist metadata to Redis
```

**E2E test generation**:
```
For each E2E target file:
  1. e2eGeneratorAgent receives prompt with file path
  2. Agent calls fetch-analysis to get RAG context
  3. Agent calls read-file to get source code
  4. Agent writes vitest E2E tests
  5. Agent calls write-file to save to tests/e2e/<name>.test.ts
  6. Agent calls store-tests to persist metadata to Redis
```

### Phase 3: Test-Fix Loop

After generation, lemon.test runs an independent test-fix loop for each test type:

```
runTestFixLoop(testDir, label):
  For iteration = 1 to MAX_ITERATIONS (5):

    Step A: Execute Tests
      For each test file in testDir:
        1. executorAgent receives prompt with test file path
        2. Agent calls run-tests to execute vitest
        3. Agent calls store-results to persist results to Redis
           - testId, filePath, passed, output, failures, iteration

    Step B: Check Results
      If all tests passed:
        Return { status: "passed", iterations: iteration }
      If iteration == MAX_ITERATIONS:
        Return { status: "max_iterations", iterations: iteration }

    Step C: Fix Failures
      1. editorAgent receives prompt with iteration number
      2. Agent calls fetch-results to get failing tests
      3. For each failing test:
         a. Agent calls read-file on the source file
         b. Agent analyzes the failure
         c. Agent calls write-file with the fix + patchDescription
      4. Loop back to Step A
```

### Phase 4: Reporting

After all three test-fix loops complete, the results are summarized:

```
Unit tests: {status} ({iterations} iterations)
Integration tests: {status} ({iterations} iterations)
E2E tests: {status} ({iterations} iterations)
```

Possible statuses:
- `passed` — all tests passed within the iteration limit
- `max_iterations` — reached the iteration limit with remaining failures
- `no_tests` — no test files were found for this type

## Webhook Mode Flow

In webhook mode (`src/webhook-server.ts`), the flow is similar but wrapped in HTTP endpoints:

### POST /webhook/test-and-fix

```
1. Verify webhook signature (if secret is configured)
2. Clone target repo to temp workspace
3. Set LEMON_WORKSPACE to the cloned directory
4. Run test-fix loop for unit tests
5. Run test-fix loop for integration tests
6. Run test-fix loop for E2E tests
7. If all passed and changes exist:
   a. Create a new branch
   b. Commit all changes
   c. Push to GitHub
   d. Open a PR
8. Return results to caller
9. Clean up temp workspace
```

### POST /webhook/generate-tests

```
1. Clone target repo
2. Set LEMON_WORKSPACE
3. Run testGeneratorAgent for each source file
4. Return list of generated tests
5. Clean up workspace
```

### POST /webhook/generate-integration-tests

Same as above but with integrationGeneratorAgent.

### POST /webhook/generate-e2e-tests

Same as above but with e2eGeneratorAgent.

### POST /webhook/run-tests

```
1. Clone target repo
2. Set LEMON_WORKSPACE
3. Run executorAgent for each test file
4. Return pass/fail results
5. Clean up workspace
```

## Error Handling

- **npm install failures** (webhook mode): Proceeds anyway, logs a warning
- **Git clone failures**: Returns error response immediately
- **Agent failures**: Caught and returned as error responses
- **Max iterations**: Returns `max_iterations` status, not an error
- **No test files**: Returns `no_tests` status, not an error
- **Workspace cleanup**: Always runs in `finally` block, errors silently ignored
