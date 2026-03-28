# kōdo (コード)

**Universal persistent memory for AI coding agents.**

Your AI coding agent forgets everything between sessions. kōdo fixes that.

It stores structured memories — conventions, mistakes, decisions, preferences, patterns — in a local SQLite database, and makes them available to every agent you use: Claude Code, Cursor, Kiro, Codex, and any MCP-compatible tool.

```
kodo add -t convention -c "Use snake_case for DB columns"
kodo add -t mistake -c "Don't use process.exit() in library code — throw instead"
kodo learn                  # auto-learn from git history
kodo export                 # sync to .claude/ .cursor/ .kiro/ .codex/
```

## Why kōdo?

| Problem | kōdo's answer |
|---------|---------------|
| Agent forgets your conventions every session | Persistent structured memory with full-text search |
| Locked into one agent's memory format | Exports to Claude Code, Cursor, Kiro, Codex — one memory, every agent |
| Memory is just text blobs | Typed memories: convention, mistake, decision, preference, pattern, note |
| Have to manually teach the agent | `kodo learn` auto-extracts conventions from your git history |
| Memory lives in the cloud | SQLite file in your repo — you own it, it travels with your code |

## Install

```bash
npm install -g kodo-memory
```

## Quick Start

```bash
# Initialize in your project
cd your-project
kodo init

# Add memories manually
kodo add -t convention -c "We use Conventional Commits"
kodo add -t preference -c "Prefer composition over inheritance"
kodo add -t mistake -c "Always check for null before accessing .data"

# Auto-learn from git history
kodo learn

# Search your memories
kodo search "style"
kodo search --type convention

# Export to all your agents
kodo export

# Export to specific agents only
kodo export --agents claude,kiro
```

## Memory Types

| Type | Use for | Example |
|------|---------|---------|
| `convention` | Team/project standards | "Use Conventional Commits" |
| `mistake` | Bugs to never repeat | "Don't forget to close DB connections in finally blocks" |
| `decision` | Architecture choices | "Chose SQLite over Postgres for simplicity" |
| `preference` | Coding style | "Prefer early returns over nested if/else" |
| `pattern` | Reusable solutions | "Use the repository pattern for data access" |
| `note` | General context | "The payments module is being rewritten in Q2" |

## MCP Server

kōdo includes an MCP server so AI agents can read and write memories directly during a session.

### Claude Code

```bash
claude mcp add kodo -- node /path/to/kodo/src/mcp-server.js
```

### Cursor / Kiro / Any MCP Client

Add to your MCP config:

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

The MCP server exposes 4 tools:

| Tool | Description |
|------|-------------|
| `kodo_remember` | Store a new memory |
| `kodo_recall` | Search memories by query, type, or both |
| `kodo_forget` | Delete a memory by ID |
| `kodo_stats` | Get memory statistics |

## Agent Export

`kodo export` generates native config files for each agent:

| Agent | Output path |
|-------|-------------|
| Claude Code | `.claude/settings/memory.md` |
| Cursor | `.cursor/rules/kodo-memory.md` |
| Kiro | `.kiro/steering/kodo-memory.md` |
| Codex | `.codex/memory.md` |

This means your memories work even without the MCP server — they're baked into the agent's context.

## Git Learning

`kodo learn` analyzes your git history and automatically extracts:

- **Commit conventions** — detects Conventional Commits, prefixes, patterns
- **Hotspots** — areas with frequent fixes that need attention
- **Project info** — primary languages, frameworks, tooling

## CLI Reference

```
kodo init                          Initialize kodo in current project
kodo add -t <type> -c <content>    Add a memory
kodo search [query]                Search memories (full-text)
kodo search --type convention      Filter by type
kodo forget <id>                   Delete a memory
kodo stats                         Show memory statistics
kodo learn                         Auto-learn from git history
kodo export                        Export to all agent configs
kodo export --agents claude,kiro   Export to specific agents
```

## How It Works

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

## Storage

Memories are stored in `.kodo/memory.db` (SQLite with WAL mode and FTS5 full-text search). Add `.kodo/` to `.gitignore` for private memories, or commit it to share conventions with your team.

## License

MIT

## Contributing

PRs welcome. The codebase is intentionally small — the whole thing is ~400 lines of JavaScript.
