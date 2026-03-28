import { MemoryStore } from './store.js';

// Minimal MCP server over stdio (JSON-RPC 2.0)
const store = new MemoryStore(process.cwd());

const TOOLS = [
  {
    name: 'kodo_remember',
    description: 'Store a memory — a convention, mistake, decision, preference, pattern, or note learned during this session. Use this whenever you discover something worth remembering for future sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['convention', 'mistake', 'decision', 'preference', 'pattern', 'note'], description: 'Memory type' },
        content: { type: 'string', description: 'What to remember' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
      },
      required: ['type', 'content'],
    },
  },
  {
    name: 'kodo_recall',
    description: 'Search memories for relevant context. Use this at the start of a task to recall conventions, past mistakes, and decisions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', enum: ['convention', 'mistake', 'decision', 'preference', 'pattern', 'note'], description: 'Filter by type' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
    },
  },
  {
    name: 'kodo_forget',
    description: 'Delete a memory by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Memory ID to delete' } },
      required: ['id'],
    },
  },
  {
    name: 'kodo_stats',
    description: 'Get memory statistics — total count, breakdown by type and project.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function handleToolCall(name, args) {
  switch (name) {
    case 'kodo_remember': {
      const id = store.add({
        type: args.type,
        content: args.content,
        tags: args.tags || [],
        source: 'agent',
        project: process.cwd().split('/').pop(),
      });
      return { content: [{ type: 'text', text: `Remembered (id=${id}): [${args.type}] ${args.content.slice(0, 80)}...` }] };
    }
    case 'kodo_recall': {
      const results = store.search(args.query || null, { type: args.type, limit: args.limit || 10 });
      if (!results.length) return { content: [{ type: 'text', text: 'No memories found.' }] };
      const text = results.map(r => `[#${r.id} ${r.type}] ${r.content}${r.tags.length ? ` (tags: ${r.tags.join(', ')})` : ''}`).join('\n\n');
      return { content: [{ type: 'text', text }] };
    }
    case 'kodo_forget': {
      const ok = store.delete(args.id);
      return { content: [{ type: 'text', text: ok ? `Deleted memory #${args.id}.` : `Memory #${args.id} not found.` }] };
    }
    case 'kodo_stats': {
      const s = store.stats();
      return { content: [{ type: 'text', text: JSON.stringify(s, null, 2) }] };
    }
    default:
      throw { code: -32601, message: `Unknown tool: ${name}` };
  }
}

// JSON-RPC stdio transport
let buffer = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let boundary;
  while ((boundary = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, boundary).trim();
    buffer = buffer.slice(boundary + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const resp = handleMessage(msg);
      if (resp) send(resp);
    } catch (e) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
  }
});

function handleMessage(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'kodo', version: '0.1.0' },
        },
      };
    case 'notifications/initialized':
      return null; // no response needed
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    case 'tools/call':
      try {
        const result = handleToolCall(params.name, params.arguments || {});
        return { jsonrpc: '2.0', id, result };
      } catch (e) {
        return { jsonrpc: '2.0', id, error: { code: e.code || -32603, message: e.message } };
      }
    default:
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

process.on('SIGINT', () => { store.close(); process.exit(0); });
process.on('SIGTERM', () => { store.close(); process.exit(0); });
