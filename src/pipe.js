import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';

const INBOX = join(homedir(), '.kodo', 'inbox');

export function pipe(prompt, content) {
  if (!existsSync(INBOX)) mkdirSync(INBOX, { recursive: true });
  const id = Date.now() + '-' + randomBytes(4).toString('hex');
  writeFileSync(join(INBOX, `${id}.json`), JSON.stringify({ prompt, content, ts: Date.now() }));
  return id;
}

export function checkInbox() {
  if (!existsSync(INBOX)) return [];
  const files = readdirSync(INBOX).filter(f => f.endsWith('.json')).sort();
  return files.map(f => {
    const data = JSON.parse(readFileSync(join(INBOX, f), 'utf-8'));
    return { file: f, ...data };
  });
}

export function consumeInbox(file) {
  const p = join(INBOX, file);
  if (existsSync(p)) unlinkSync(p);
}
