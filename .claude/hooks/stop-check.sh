#!/usr/bin/env bash
# Stop hook: run the project's test command; exit 2 (keep working) if it fails.
#
# The command comes from the "- Test: `...`" line in CLAUDE.md, which the
# constitution fills in. Missing, placeholder (<...>) or "none" → never blocks.
# Claude Code caps a stop hook at 8 continuations in a row, so a test that
# can't be fixed ends the turn instead of looping.

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
cmd="$(sed -n 's/^- Test: `\(.*\)`.*$/\1/p' CLAUDE.md 2>/dev/null | head -n 1)"
case "$cmd" in "" | "<"* | none | "none "*) exit 0 ;; esac

# Clean tree and nothing beyond main: a chat-only turn, nothing to test.
if [ -z "$(git status --porcelain 2>/dev/null)" ] &&
  [ "$(git rev-list --count main..HEAD 2>/dev/null || echo 1)" = 0 ]; then
  exit 0
fi

out="$(bash -c "$cmd" 2>&1)" && exit 0
{
  echo "Tests failed (\`$cmd\`). Fix them before stopping:"
  printf '%s\n' "$out" | tail -n 40
} >&2
exit 2
