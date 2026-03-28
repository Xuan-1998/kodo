# Your AI Coding Agent Has Amnesia — Here's the Fix

Every AI coding agent — Claude Code, Cursor, Codex, Kiro — starts every session with a blank slate.

You tell it "we use ESM imports on this project." It nods. Next session? `const fs = require('fs')`. You fix a null pointer bug and explain why. Next session? Same bug. You explain your architecture decisions. Gone. Every. Time.

This isn't a minor annoyance. It's the single biggest productivity killer in AI-assisted development. You're not pair programming — you're training a goldfish.

## The Five Amnesia Patterns

After months of using AI coding agents daily, I've identified five recurring patterns:

1. **Style amnesia** — You correct code style, it forgets next session
2. **Mistake amnesia** — You fix a bug, it makes the same mistake again
3. **Architecture amnesia** — You explain decisions, they evaporate
4. **Tool amnesia** — You switch agents, start from zero
5. **Team amnesia** — New team member's agent has zero institutional knowledge

## Why Existing Solutions Fall Short

**claude-mem** (41.8k stars) captures Claude Code sessions and compresses them. But it's Claude-only. Switch to Cursor? Start over.

**mem0 / OpenMemory** provides a generic memory layer. But it's not coding-specific — it doesn't understand the difference between a convention and a mistake.

**Manual `.cursorrules` / `CLAUDE.md`** files work for one agent. Maintaining them across four agents? Nobody does that.

## The Fix: Structured, Portable, Agent-Agnostic Memory

I built [kōdo](https://github.com/Xuan-1998/kodo) to solve this. The core insight is simple:

**Your coding memory should be structured, searchable, and work everywhere.**

Not text blobs. Not session dumps. Typed memories:

- **Conventions** — "Use Conventional Commits"
- **Mistakes** — "Never use `process.exit()` in library code"
- **Decisions** — "Chose SQLite over Postgres for zero-config"
- **Preferences** — "Prefer early returns over nested if/else"
- **Patterns** — "All API handlers: validate → execute → respond"

Stored in SQLite with full-text search. Exported to native config files for every agent.

## How It Works

```bash
# Teach it once
kodo add -t convention -c "Always use ESM imports, never require()"
kodo add -t mistake -c "Check for null before accessing .data"

# Auto-learn from your git history
kodo learn

# Export to every agent you use — one command
kodo export
# → .claude/settings/memory.md
# → .cursor/rules/kodo-memory.md
# → .kiro/steering/kodo-memory.md
# → .codex/memory.md
```

One memory store. Every agent. Zero cloud.

## The MCP Server

kōdo also runs as an MCP server, so agents can read and write memories live during a session:

```json
{
  "mcpServers": {
    "kodo": {
      "command": "node",
      "args": ["/path/to/kodo/src/mcp-server.js"]
    }
  }
}
```

The agent gets four tools: `kodo_remember`, `kodo_recall`, `kodo_forget`, `kodo_stats`. It can learn a lesson during a debugging session and recall it next time.

## Git Learning

The `kodo learn` command analyzes your git history and auto-extracts:

- Commit conventions (detects Conventional Commits)
- Hotspots (areas with frequent fixes)
- Project info (languages, frameworks, tooling)

Your repo already contains institutional knowledge. kōdo surfaces it.

## Watch Mode

`kodo watch` tails your agent session logs in real-time and auto-extracts memories as you work. No manual input needed — it learns by watching.

## The Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   You / AI  │────▶│  kōdo store  │────▶│  Agent configs   │
│  (CLI/MCP)  │     │  (SQLite +   │     │  .claude/        │
│             │◀────│   FTS5)      │     │  .cursor/rules/  │
│             │     │              │     │  .kiro/steering/  │
└─────────────┘     └──────────────┘     │  .codex/         │
                           ▲              └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  git learn  │
                    │  (auto)     │
                    └─────────────┘
```

~400 lines of JavaScript. SQLite with WAL mode and FTS5. No cloud. No accounts. No dependencies beyond `better-sqlite3` and `commander`.

## Try It

```bash
npm install -g kodo-memory
cd your-project
kodo init
kodo learn
kodo export
```

Or clone and run the demo:

```bash
git clone https://github.com/Xuan-1998/kodo.git
cd kodo && npm install
bash demo/demo.sh
```

Your AI coding agent doesn't have to be a goldfish.

---

*[kōdo](https://github.com/Xuan-1998/kodo) is MIT licensed and open source. PRs welcome.*
