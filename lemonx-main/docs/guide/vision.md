# Vision

## The Problem

Writing and maintaining tests is one of the most time-consuming activities in software development. Most codebases have:

- **Insufficient test coverage** — teams prioritize shipping features over writing tests
- **Outdated tests** — tests break when code changes and nobody fixes them
- **Inconsistent quality** — test writing skill varies across the team
- **Blind spots** — edge cases and error paths are rarely tested

The result: bugs in production, regressions, and fragile codebases.

## The Solution

lemon.test is an agentic AI testing platform that autonomously:

1. **Generates** comprehensive vitest unit, integration, and E2E tests by reading your source code
2. **Executes** those tests and captures detailed pass/fail results
3. **Fixes** both failing tests and the source code that causes failures
4. **Iterates** until everything passes or a configurable limit is reached

The goal: **zero blind spots** in your test coverage, with zero manual effort.

## Design Principles

### Specialized Agents Over One Generalist

Instead of a single AI that does everything, lemon.test uses five specialized agents, each with a narrow, well-defined role:

- Three generator agents (unit, integration, E2E) with different testing expertise
- One executor agent focused purely on running tests and capturing results
- One editor agent that acts as a senior debugger

This specialization produces better results because each agent has focused instructions and the right tools for its specific job.

### Redis as the Nervous System

All agent communication flows through Redis as a shared event log. This design provides:

- **Full auditability** — every test result, code analysis, and patch is persisted
- **Decoupled agents** — agents don't need to know about each other, only about Redis
- **Traceability** — you can replay the entire decision history for any iteration

### Your Infrastructure, Your Code

lemon.test runs on your own CircleCI machine runner. Your code never leaves your infrastructure. There are no external servers processing your code, no webhooks tunneling through firewalls, no third-party services reading your source files.

### Iterative Self-Healing

The test-fix loop is the core innovation. Rather than generating tests once and hoping they pass, lemon.test:

1. Runs tests
2. Analyzes failures
3. Applies surgical fixes
4. Repeats until everything passes

This mirrors how a senior engineer would approach test-driven development — write tests, make them pass, iterate.

## The Future

lemon.test is building toward:

- **Adaptive test generation** — learning from your codebase's patterns to generate more relevant tests
- **Smart file prioritization** — focusing on the most critical and frequently changed files first
- **Cross-repo learning** — applying patterns learned from one repository to improve testing in another
- **Performance testing** — extending beyond correctness to performance and load testing
- **Security testing** — generating tests that verify security boundaries and common vulnerability patterns
