import { MemoryStore } from './store.js';
import { execSync } from 'child_process';

export function learnFromGit(projectDir, { limit = 50 } = {}) {
  const store = new MemoryStore(projectDir);
  const project = projectDir.split('/').pop();
  let added = 0;

  // Extract conventions from recent commit messages
  try {
    const log = execSync(
      `git log --oneline --no-merges -${limit} --format="%s"`,
      { cwd: projectDir, encoding: 'utf-8', timeout: 10000 }
    ).trim();

    if (!log) return { added: 0 };

    const messages = log.split('\n').filter(Boolean);

    // Detect commit message convention
    const conventionalCount = messages.filter(m => /^(feat|fix|chore|docs|style|refactor|test|ci|perf|build)(\(.+\))?:/.test(m)).length;
    if (conventionalCount > messages.length * 0.5) {
      store.add({
        type: 'convention',
        content: 'This project uses Conventional Commits (feat:, fix:, chore:, etc.).',
        tags: ['git', 'commits'],
        source: 'git-learn',
        project,
      });
      added++;
    }

    // Detect common fix patterns (repeated mistakes)
    const fixMessages = messages.filter(m => /^fix/i.test(m));
    const fixPatterns = {};
    for (const m of fixMessages) {
      const scope = m.match(/^fix\(([^)]+)\)/i)?.[1] || 'general';
      fixPatterns[scope] = (fixPatterns[scope] || 0) + 1;
    }
    for (const [scope, count] of Object.entries(fixPatterns)) {
      if (count >= 3) {
        store.add({
          type: 'mistake',
          content: `Frequent fixes in "${scope}" (${count} fix commits). This area may need extra attention or refactoring.`,
          tags: ['git', 'hotspot', scope],
          source: 'git-learn',
          project,
        });
        added++;
      }
    }
  } catch { /* not a git repo or git not available */ }

  // Detect language/framework from files
  try {
    const files = execSync('git ls-files', { cwd: projectDir, encoding: 'utf-8', timeout: 10000 }).trim().split('\n');
    const exts = {};
    for (const f of files) {
      const ext = f.split('.').pop();
      exts[ext] = (exts[ext] || 0) + 1;
    }
    const sorted = Object.entries(exts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length) {
      store.add({
        type: 'note',
        content: `Primary languages by file count: ${sorted.map(([e, c]) => `.${e} (${c})`).join(', ')}.`,
        tags: ['languages', 'project-info'],
        source: 'git-learn',
        project,
      });
      added++;
    }

    // Detect config files for framework hints
    const configHints = {
      'tsconfig.json': 'TypeScript project',
      'pyproject.toml': 'Python project (pyproject.toml)',
      'Cargo.toml': 'Rust project',
      'go.mod': 'Go module',
      'package.json': 'Node.js/JavaScript project',
      '.eslintrc': 'Uses ESLint',
      '.prettierrc': 'Uses Prettier',
      'Dockerfile': 'Uses Docker',
      'docker-compose.yml': 'Uses Docker Compose',
    };
    for (const [file, hint] of Object.entries(configHints)) {
      if (files.some(f => f.endsWith(file))) {
        store.add({
          type: 'note',
          content: hint,
          tags: ['tooling', 'project-info'],
          source: 'git-learn',
          project,
        });
        added++;
      }
    }
  } catch { /* ignore */ }

  store.close();
  return { added };
}
