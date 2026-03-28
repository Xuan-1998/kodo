# kōdo demo — record with: vhs demo/demo.tape
Output assets/demo.gif
Set FontSize 14
Set Width 900
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20

Type "# kōdo — Your AI coding agent has amnesia. Let's fix it."
Enter
Sleep 1.5s

Type "cd /tmp/kodo-demo && kodo init"
Enter
Sleep 1.5s

Type 'kodo add -t convention -c "Always use ESM imports, never require()"'
Enter
Sleep 0.8s

Type 'kodo add -t mistake -c "Never use process.exit() in library code"'
Enter
Sleep 0.8s

Type 'kodo add -t preference -c "Prefer early returns over nested if/else"'
Enter
Sleep 0.8s

Type 'kodo add -t decision -c "Chose SQLite over Postgres for zero-config"'
Enter
Sleep 1.2s

Type "# New session — agent starts fresh, but kōdo remembers"
Enter
Sleep 1.5s

Type 'kodo search "import style"'
Enter
Sleep 1.5s

Type 'kodo search "error"'
Enter
Sleep 1.5s

Type "kodo stats"
Enter
Sleep 1.5s

Type "# Export to every agent — one command"
Enter
Sleep 1s

Type "kodo export"
Enter
Sleep 2s

Type "# ✓ Done. Your AI agent will never forget again."
Enter
Sleep 3s
