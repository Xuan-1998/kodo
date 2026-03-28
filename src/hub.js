import { createServer, createConnection } from 'net';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SOCK = join(homedir(), '.kodo', 'hub.sock');

// --- Hub daemon: broadcasts events to all connected terminals ---

export function startHub() {
  const dir = join(homedir(), '.kodo');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (existsSync(SOCK)) unlinkSync(SOCK);

  const clients = new Set();

  const server = createServer((conn) => {
    let buf = '';
    clients.add(conn);
    conn.on('data', (chunk) => {
      buf += chunk;
      let i;
      while ((i = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line) continue;
        // Broadcast to all OTHER clients
        for (const c of clients) {
          if (c !== conn && !c.destroyed) {
            try { c.write(line + '\n'); } catch {}
          }
        }
      }
    });
    conn.on('end', () => clients.delete(conn));
    conn.on('error', () => clients.delete(conn));
  });

  server.listen(SOCK);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      unlinkSync(SOCK);
      server.listen(SOCK);
    }
  });

  return { server, stop: () => { server.close(); if (existsSync(SOCK)) unlinkSync(SOCK); } };
}

// --- Client: connect to hub, publish/subscribe ---

export class HubClient {
  constructor() {
    this.listeners = [];
    this.conn = null;
    this.buf = '';
    this.sessionId = `${process.pid}-${Date.now()}`;
  }

  connect() {
    if (!existsSync(SOCK)) return false;
    try {
      this.conn = createConnection(SOCK);
      this.conn.setEncoding('utf-8');
      this.conn.on('data', (chunk) => {
        this.buf += chunk;
        let i;
        while ((i = this.buf.indexOf('\n')) !== -1) {
          const line = this.buf.slice(0, i);
          this.buf = this.buf.slice(i + 1);
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            for (const fn of this.listeners) fn(evt);
          } catch {}
        }
      });
      this.conn.on('error', () => { this.conn = null; });
      return true;
    } catch { return false; }
  }

  publish(event) {
    if (!this.conn || this.conn.destroyed) this.connect();
    if (!this.conn) return;
    try {
      this.conn.write(JSON.stringify({ ...event, from: this.sessionId, ts: Date.now() }) + '\n');
    } catch {}
  }

  onEvent(fn) {
    this.listeners.push(fn);
  }

  close() {
    if (this.conn) this.conn.destroy();
  }
}
