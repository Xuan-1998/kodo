import { MemoryStore } from './store.js';
import { watch, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

const MEMORY_PATTERNS = [
  // Conventions detected from agent output
  { regex: /(?:always|never|must|should|don't|do not|prefer|avoid)\s+(.{10,120})/i, type: 'convention' },
  // Error patterns
  { regex: /(?:error|bug|fix|issue|problem|mistake):\s*(.{10,200})/i, type: 'mistake' },
  // Decisions
  { regex: /(?:decided|chose|picked|went with|using)\s+(.{10,150})/i, type: 'decision' },
];

function extractMemories(text) {
  const memories = [];
  for (const { regex, type } of MEMORY_PATTERNS) {
    const match = text.match(regex);
    if (match) memories.push({ type, content: match[0].slice(0, 300) });
  }
  return memories;
}

function findSessionDirs() {
  const dirs = [];
  // Claude Code sessions
  const claudeProjects = join(homedir(), '.claude', 'projects');
  if (existsSync(claudeProjects)) {
    for (const proj of readdirSync(claudeProjects)) {
      const sessDir = join(claudeProjects, proj, 'sessions');
      if (existsSync(sessDir)) dirs.push({ path: sessDir, agent: 'claude-code' });
    }
  }
  // Codex sessions
  const codexSessions = join(homedir(), '.codex', 'sessions');
  if (existsSync(codexSessions)) dirs.push({ path: codexSessions, agent: 'codex' });
  return dirs;
}

export function watchSessions(projectDir, { onMemory, onError } = {}) {
  const store = new MemoryStore(projectDir);
  const project = projectDir.split('/').pop();
  const seen = new Set();
  const watchers = [];

  const sessionDirs = findSessionDirs();
  if (!sessionDirs.length) {
    const msg = 'No agent session directories found. Watching for: ~/.claude/projects/*/sessions/, ~/.codex/sessions/';
    if (onError) onError(msg);
    store.close();
    return { stop: () => {} };
  }

  for (const { path: sessDir, agent } of sessionDirs) {
    try {
      const w = watch(sessDir, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.jsonl')) return;
        const fullPath = join(sessDir, filename);
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n').filter(Boolean);
          // Only process new lines
          const key = `${fullPath}:${lines.length}`;
          if (seen.has(key)) return;
          seen.add(key);

          // Process last few lines
          const recent = lines.slice(-5);
          for (const line of recent) {
            try {
              const entry = JSON.parse(line);
              const text = typeof entry.message?.content === 'string'
                ? entry.message.content
                : JSON.stringify(entry.message?.content || '');
              const memories = extractMemories(text);
              for (const m of memories) {
                const id = store.add({ ...m, tags: [agent, 'auto-watch'], source: `watch:${agent}`, project });
                if (onMemory) onMemory({ id, ...m, agent });
              }
            } catch { /* skip */ }
          }
        } catch { /* file might be locked */ }
      });
      watchers.push(w);
    } catch { /* dir might not be watchable */ }
  }

  return {
    dirs: sessionDirs.map(d => d.path),
    stop: () => {
      for (const w of watchers) w.close();
      store.close();
    },
  };
}
