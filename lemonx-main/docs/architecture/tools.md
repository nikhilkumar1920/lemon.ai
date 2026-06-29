# Tools

Tools are the interfaces through which AI agents interact with the codebase, test runner, and Redis state store. All tools are built using Mastra's `createTool` API with Zod schemas for input/output validation.

## File I/O Tools

### readFileTool

**ID**: `read-file`

**Purpose**: Read a source file from the target repository.

**Input**:
| Parameter | Type | Description |
|---|---|---|
| `path` | string | File path relative to the workspace root |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `content` | string | Full file contents |

**Resolution**: Uses `LEMON_WORKSPACE`, then `TARGET_REPO`, then `process.cwd()` as the base directory.

**Source**: `src/mastra/tools/fs/readFileTool.ts`

---

### writeFileTool

**ID**: `write-file`

**Purpose**: Write or overwrite a file on disk. Used to save test files or apply code fixes.

**Input**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | string | Yes | File path relative to the workspace root |
| `content` | string | Yes | Full file content |
| `patchDescription` | string | No | Description of the change (triggers patch logging) |
| `iteration` | number | No | Current iteration number (for patch tracking) |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `success` | boolean | Always `true` if the write succeeded |

**Side Effects**: When `patchDescription` is provided, the tool also logs the patch to Redis under `code_patches:<uuid>` with the file path, description, timestamp, and iteration number.

**Source**: `src/mastra/tools/fs/writeFileTool.ts`

---

### listFilesTool

**ID**: `list-files`

**Purpose**: List all source files in a directory recursively.

**Input**:
| Parameter | Type | Description |
|---|---|---|
| `dir` | string | Directory to scan |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `files` | string[] | Array of `.ts`/`.js` file paths (excludes `__tests__` and `node_modules`) |

**Source**: `src/mastra/tools/fs/listFilesTool.ts`

---

## Runner Tools

### runTestsTool

**ID**: `run-tests`

**Purpose**: Execute vitest on a specific test file and return pass/fail results.

**Input**:
| Parameter | Type | Description |
|---|---|---|
| `testFilePath` | string | Path to the test file (e.g., `src/__tests__/myModule.test.ts`) |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `passed` | boolean | Whether all tests in the file passed |
| `output` | string | Full stdout + stderr from vitest |
| `failures` | array | Array of `{testName, error}` objects for each failing test |

**Execution**: Runs `npx vitest run <testFilePath> --reporter=verbose` in the `LEMON_WORKSPACE` directory.

**Failure Parsing**: Uses regex to extract test names and error messages from vitest verbose output.

**Source**: `src/mastra/tools/runner/runTestsTool.ts`

---

## Redis Tools

### fetchAnalysisTool

**ID**: `fetch-analysis`

**Purpose**: Fetch stored code analysis from Redis to use as knowledge context (RAG) for writing tests.

**Input**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `filePath` | string | No | Filter by file path, or omit to fetch all analyses |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `analyses` | array | Array of `{filePath, language, summary, issues}` objects |

**Key Pattern**: `code_analysis:*`

**Source**: `src/mastra/tools/redis/fetchAnalysisTool.ts`

---

### storeTestsTool

**ID**: `store-tests`

**Purpose**: Store generated unit test code and metadata into Redis.

**Input**:
| Parameter | Type | Description |
|---|---|---|
| `filePath` | string | Original source file path |
| `testFilePath` | string | Path where the test was written |
| `testCode` | string | Full test file content |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `id` | string | UUID of the stored record |

**Key Pattern**: `unit_tests:<uuid>`

**Stored Data**: Includes `id`, `filePath`, `testFilePath`, `testCode`, `generatedAt` timestamp, and `status: "pending"`.

**Source**: `src/mastra/tools/redis/storeTestsTool.ts`

---

### storeResultsTool

**ID**: `store-results`

**Purpose**: Store test execution results into Redis.

**Input**:
| Parameter | Type | Description |
|---|---|---|
| `testId` | string | Unique identifier for the test |
| `filePath` | string | Test file path |
| `passed` | boolean | Whether the test passed |
| `output` | string | Full test output |
| `failures` | array | Array of `{testName, error}` objects |
| `iteration` | number | Current iteration number |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `id` | string | UUID of the stored record |

**Key Pattern**: `test_results:<uuid>`

**Stored Data**: Includes all input fields plus a `runAt` timestamp.

**Source**: `src/mastra/tools/redis/storeResultsTool.ts`

---

### fetchResultsTool

**ID**: `fetch-results`

**Purpose**: Fetch the latest test results from Redis to determine what failed.

**Input**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `iteration` | number | No | Filter by specific iteration, or omit to fetch all |

**Output**:
| Parameter | Type | Description |
|---|---|---|
| `results` | array | Array of `{id, testId, filePath, passed, failures, iteration}` objects |
| `allPassed` | boolean | Whether all fetched results show passing tests |

**Key Pattern**: `test_results:*`

**Source**: `src/mastra/tools/redis/fetchResultsTool.ts`

---

## Tool Usage by Agent

| Tool | testGenerator | integrationGenerator | e2eGenerator | executor | editor |
|---|---|---|---|---|---|
| readFileTool | ✅ | ✅ | ✅ | | ✅ |
| writeFileTool | ✅ | ✅ | ✅ | | ✅ |
| listFilesTool | | | | | ✅ |
| runTestsTool | | | | ✅ | |
| fetchAnalysisTool | ✅ | ✅ | ✅ | ✅ | ✅ |
| storeTestsTool | ✅ | ✅ | ✅ | | |
| storeResultsTool | | | | ✅ | |
| fetchResultsTool | | | | | ✅ |
