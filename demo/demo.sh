#!/usr/bin/env bash
# Demo script: shows the "aha moment" of kodo
# Run this in a temp directory to see the full flow

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KODO="node ${SCRIPT_DIR}/../bin/kodo.js"
DEMO_DIR=$(mktemp -d)
cd "$DEMO_DIR"
git init -q && git commit --allow-empty -m "init" -q

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  kōdo demo — Your AI coding agent has amnesia. Let's fix that."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 1
echo "📍 Session 1: You're working with an AI agent on a Node.js project."
echo "   The agent uses require() — but your team uses ESM imports."
echo "   You correct it. But next session... it forgets."
echo ""
sleep 1

echo "💡 With kōdo, you teach it once:"
echo ""
sleep 0.5

$KODO init 2>/dev/null
echo ""

$KODO add -t convention -c "Always use ESM imports (import/export), never require()" --tags "javascript,imports"
$KODO add -t convention -c "Use Conventional Commits: feat:, fix:, chore:, docs:" --tags "git,commits"
$KODO add -t mistake -c "Never use process.exit() in library code — throw errors instead" --tags "nodejs,error-handling"
$KODO add -t preference -c "Prefer early returns over deeply nested if/else blocks" --tags "style"
$KODO add -t decision -c "We chose SQLite over Postgres for local-first zero-config storage" --tags "architecture,database"
$KODO add -t pattern -c "All API handlers follow: validate → execute → respond. No business logic in route files." --tags "api,architecture"

echo ""
sleep 1
echo "📍 Session 2: New day, new session. The agent starts fresh..."
echo "   But kōdo remembers everything."
echo ""
sleep 0.5

echo "🔍 Agent searches for relevant context:"
echo ""
$KODO search "import style"
echo ""
sleep 0.5

$KODO search "error handling"
echo ""
sleep 0.5

$KODO search "architecture"
echo ""
sleep 1

echo "📊 Memory stats:"
echo ""
$KODO stats
echo ""
sleep 1

echo "🚀 Export to every agent you use — one command:"
echo ""
$KODO export
echo ""
sleep 0.5

echo "📄 Generated Kiro steering file:"
echo "─────────────────────────────────"
cat .kiro/steering/kodo-memory.md
echo "─────────────────────────────────"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ 6 memories stored. 4 agent configs generated. Zero cloud. Zero accounts."
echo "  Your AI agent will never forget your conventions again."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup
rm -rf "$DEMO_DIR"
