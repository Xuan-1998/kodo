import { MemoryStore } from './store.js';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

// Import from claude-mem SQLite database
function importClaudeMem(store, cmDir) {
  const dbPath = join(cmDir, 'claude-mem.db');
  if (!existsSync(dbPath)) {
    // Try alternate locations
    const altPaths = [
      join(cmDir, 'data', 'claude-mem.db'),
      join(cmDir, 'memory.db'),
    ];
    const found = altPaths.find(p => existsSync(p));
    if (!found) throw new Error(`claude-mem database not found in ${cmDir}. Tried: ${dbPath}, ${altPaths.join(', ')}`);
    return importClaudeMemDb(store, found);
  }
  return importClaudeMemDb(store, dbPath);
}

function importClaudeMemDb(store, dbPath) {
  const cmDb = new Database(dbPath, { readonly: true });
  let added = 0;

  // claude-mem stores observations and summaries
  try {
    const observations = cmDb.prepare(
      "SELECT content, type, created_at FROM observations ORDER BY created_at DESC LIMIT 200"
    ).all();
    for (const obs of observations) {
      const type = mapClaudeMemType(obs.type);
      store.add({ type, content: obs.content.slice(0, 2000), tags: ['claude-mem', 'imported'], source: 'import:claude-mem' });
      added++;
    }
  } catch {
    // Try summaries table instead
    try {
      const summaries = cmDb.prepare(
        "SELECT content FROM summaries ORDER BY created_at DESC LIMIT 100"
      ).all();
      for (const s of summaries) {
        store.add({ type: 'note', content: s.content.slice(0, 2000), tags: ['claude-mem', 'imported'], source: 'import:claude-mem' });
        added++;
      }
    } catch { /* table doesn't exist */ }
  }

  cmDb.close();
  return added;
}

function mapClaudeMemType(cmType) {
  const map = { bugfix: 'mistake', decision: 'decision', implementation: 'pattern', observation: 'note', error: 'mistake', config: 'convention' };
  return map[cmType] || 'note';
}

// Import from mem0 JSON export or SQLite
function importMem0(store, m0Path) {
  if (m0Path.endsWith('.json')) {
    return importMem0Json(store, m0Path);
  }
  if (m0Path.endsWith('.db')) {
    return importMem0Db(store, m0Path);
  }
  // Try to find files in directory
  if (existsSync(join(m0Path, 'memories.json'))) return importMem0Json(store, join(m0Path, 'memories.json'));
  if (existsSync(join(m0Path, 'mem0.db'))) return importMem0Db(store, join(m0Path, 'mem0.db'));
  throw new Error(`No mem0 data found at ${m0Path}. Expected memories.json or mem0.db`);
}

function importMem0Json(store, jsonPath) {
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  const memories = Array.isArray(data) ? data : data.memories || data.results || [];
  let added = 0;
  for (const m of memories) {
    const content = m.memory || m.content || m.text || JSON.stringify(m);
    store.add({ type: 'note', content: content.slice(0, 2000), tags: ['mem0', 'imported'], source: 'import:mem0' });
    added++;
  }
  return added;
}

function importMem0Db(store, dbPath) {
  const m0Db = new Database(dbPath, { readonly: true });
  let added = 0;
  try {
    const rows = m0Db.prepare("SELECT memory, metadata FROM memories ORDER BY created_at DESC LIMIT 200").all();
    for (const r of rows) {
      store.add({ type: 'note', content: (r.memory || '').slice(0, 2000), tags: ['mem0', 'imported'], source: 'import:mem0' });
      added++;
    }
  } catch { /* different schema */ }
  m0Db.close();
  return added;
}

// Import from JSONL session logs (Claude Code / Codex)
function importJsonl(store, jsonlPath) {
  const content = readFileSync(jsonlPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  let added = 0;
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      // Look for assistant messages with tool use results or interesting content
      if (entry.type === 'assistant' && entry.message?.content) {
        const text = typeof entry.message.content === 'string' ? entry.message.content : JSON.stringify(entry.message.content);
        if (text.length > 50 && text.length < 2000) {
          store.add({ type: 'note', content: text.slice(0, 2000), tags: ['session-log', 'imported'], source: 'import:jsonl' });
          added++;
        }
      }
    } catch { /* skip malformed lines */ }
    if (added >= 100) break; // cap imports
  }
  return added;
}

export function importMemories(projectDir, source, sourcePath) {
  const store = new MemoryStore(projectDir);
  let added = 0;
  try {
    switch (source) {
      case 'claude-mem': added = importClaudeMem(store, sourcePath); break;
      case 'mem0': added = importMem0(store, sourcePath); break;
      case 'jsonl': added = importJsonl(store, sourcePath); break;
      default: throw new Error(`Unknown source: ${source}. Supported: claude-mem, mem0, jsonl`);
    }
  } finally {
    store.close();
  }
  return { added, source };
}
