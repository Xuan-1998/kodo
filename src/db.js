import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('convention','mistake','decision','preference','pattern','note')),
  content TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  source TEXT DEFAULT 'manual',
  project TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  access_count INTEGER DEFAULT 0,
  relevance_score REAL DEFAULT 1.0
);

CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content, tags, project, content=memories, content_rowid=id);

CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, content, tags, project) VALUES (new.id, new.content, new.tags, new.project);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, tags, project) VALUES ('delete', old.id, old.content, old.tags, old.project);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, content, tags, project) VALUES ('delete', old.id, old.content, old.tags, old.project);
  INSERT INTO memories_fts(rowid, content, tags, project) VALUES (new.id, new.content, new.tags, new.project);
END;
`;

export function openDb(dbPath) {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

export function resolveDbPath(projectDir) {
  return join(projectDir, '.kodo', 'memory.db');
}

export function globalDbPath() {
  return join(process.env.HOME || process.env.USERPROFILE, '.kodo', 'memory.db');
}
