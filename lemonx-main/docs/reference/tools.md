# Tools API

Reference documentation for all tools available to lemon.test agents.

## File I/O Tools

### readFileTool

```typescript
import { readFileTool } from "../tools/fs/readFileTool";
```

| Property | Value |
|---|---|
| **ID** | `read-file` |
| **Source** | `src/mastra/tools/fs/readFileTool.ts` |

**Input Schema**:
```typescript
{ path: string }
```

**Output Schema**:
```typescript
{ content: string }
```

**Base Directory Resolution**: `LEMON_WORKSPACE` → `TARGET_REPO` → `process.cwd()`

---

### writeFileTool

```typescript
import { writeFileTool } from "../tools/fs/writeFileTool";
```

| Property | Value |
|---|---|
| **ID** | `write-file` |
| **Source** | `src/mastra/tools/fs/writeFileTool.ts` |

**Input Schema**:
```typescript
{
  path: string,
  content: string,
  patchDescription?: string,
  iteration?: number,
}
```

**Output Schema**:
```typescript
{ success: boolean }
```

**Side Effects**: When `patchDescription` is provided, logs the patch to Redis under `code_patches:<uuid>`.

---

### listFilesTool

```typescript
import { listFilesTool } from "../tools/fs/listFilesTool";
```

| Property | Value |
|---|---|
| **ID** | `list-files` |
| **Source** | `src/mastra/tools/fs/listFilesTool.ts` |

**Input Schema**:
```typescript
{ dir: string }
```

**Output Schema**:
```typescript
{ files: string[] }
```

**Filtering**: Returns only `.ts`/`.js` files, excluding `__tests__` and `node_modules`.

---

## Runner Tools

### runTestsTool

```typescript
import { runTestsTool } from "../tools/runner/runTestsTool";
```

| Property | Value |
|---|---|
| **ID** | `run-tests` |
| **Source** | `src/mastra/tools/runner/runTestsTool.ts` |

**Input Schema**:
```typescript
{ testFilePath: string }
```

**Output Schema**:
```typescript
{
  passed: boolean,
  output: string,
  failures: { testName: string, error: string }[],
}
```

**Execution**: Runs `npx vitest run <testFilePath> --reporter=verbose` in `LEMON_WORKSPACE`.

**Requires**: `LEMON_WORKSPACE` environment variable must be set.

---

## Redis Tools

### fetchAnalysisTool

```typescript
import { fetchAnalysisTool } from "../tools/redis/fetchAnalysisTool";
```

| Property | Value |
|---|---|
| **ID** | `fetch-analysis` |
| **Source** | `src/mastra/tools/redis/fetchAnalysisTool.ts` |

**Input Schema**:
```typescript
{ filePath?: string }
```

**Output Schema**:
```typescript
{
  analyses: {
    filePath: string,
    language: string,
    summary: string,
    issues: string[],
  }[],
}
```

**Key Pattern**: `code_analysis:*`

---

### storeTestsTool

```typescript
import { storeTestsTool } from "../tools/redis/storeTestsTool";
```

| Property | Value |
|---|---|
| **ID** | `store-tests` |
| **Source** | `src/mastra/tools/redis/storeTestsTool.ts` |

**Input Schema**:
```typescript
{
  filePath: string,
  testFilePath: string,
  testCode: string,
}
```

**Output Schema**:
```typescript
{ id: string }
```

**Key Pattern**: `unit_tests:<uuid>`

---

### storeResultsTool

```typescript
import { storeResultsTool } from "../tools/redis/storeResultsTool";
```

| Property | Value |
|---|---|
| **ID** | `store-results` |
| **Source** | `src/mastra/tools/redis/storeResultsTool.ts` |

**Input Schema**:
```typescript
{
  testId: string,
  filePath: string,
  passed: boolean,
  output: string,
  failures: { testName: string, error: string }[],
  iteration: number,
}
```

**Output Schema**:
```typescript
{ id: string }
```

**Key Pattern**: `test_results:<uuid>`

---

### fetchResultsTool

```typescript
import { fetchResultsTool } from "../tools/redis/fetchResultsTool";
```

| Property | Value |
|---|---|
| **ID** | `fetch-results` |
| **Source** | `src/mastra/tools/redis/fetchResultsTool.ts` |

**Input Schema**:
```typescript
{ iteration?: number }
```

**Output Schema**:
```typescript
{
  results: {
    id: string,
    testId: string,
    filePath: string,
    passed: boolean,
    failures: { testName: string, error: string }[],
    iteration: number,
  }[],
  allPassed: boolean,
}
```

**Key Pattern**: `test_results:*`
