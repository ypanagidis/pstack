#!/usr/bin/env bash
# Run one panel seat on Codex: a reviewer, a judge, or an arena runner.
# Usage: codex-seat.sh --prompt <file> --out <file> --cwd <dir>
#                      [--write] [--model <slug>] [--effort <level>]
# Reads the prompt from --prompt, runs `codex exec` in --cwd, and writes the
# seat's final message to --out. Read-only unless --write is given, which a
# runner that produces files in its own directory needs.
# Exit codes: 0 done, 2 usage, 3 codex not installed, 4 no output written,
# anything else is codex's own exit code.
set -euo pipefail

usage() {
	printf 'usage: codex-seat.sh --prompt <file> --out <file> --cwd <dir> [--write] [--model <slug>] [--effort <level>]\n' >&2
	exit 2
}

prompt=""
out=""
cwd=""
sandbox="read-only"
model="gpt-6.1-sol"
effort="xhigh"

while [ "$#" -gt 0 ]; do
	case "$1" in
		--prompt) [ "$#" -ge 2 ] || usage; prompt="$2"; shift 2 ;;
		--out) [ "$#" -ge 2 ] || usage; out="$2"; shift 2 ;;
		--cwd) [ "$#" -ge 2 ] || usage; cwd="$2"; shift 2 ;;
		--model) [ "$#" -ge 2 ] || usage; model="$2"; shift 2 ;;
		--effort) [ "$#" -ge 2 ] || usage; effort="$2"; shift 2 ;;
		--write) sandbox="workspace-write"; shift ;;
		*) printf 'codex-seat.sh: unknown argument %s\n' "$1" >&2; usage ;;
	esac
done

[ -n "$prompt" ] && [ -n "$out" ] && [ -n "$cwd" ] || usage
[ -f "$prompt" ] || { printf 'codex-seat.sh: prompt file %s does not exist\n' "$prompt" >&2; exit 2; }
[ -d "$cwd" ] || { printf 'codex-seat.sh: directory %s does not exist\n' "$cwd" >&2; exit 2; }

if ! command -v codex >/dev/null 2>&1; then
	printf 'codex-seat.sh: codex is not on PATH; record this seat as a dropout\n' >&2
	exit 3
fi

mkdir -p "$(dirname "$out")"
rm -f "$out"

status=0
codex exec \
	--model "$model" \
	--config "model_reasoning_effort=\"$effort\"" \
	--sandbox "$sandbox" \
	--cd "$cwd" \
	--skip-git-repo-check \
	--color never \
	--output-last-message "$out" \
	- <"$prompt" >"$out.log" 2>&1 || status=$?

if [ "$status" -ne 0 ]; then
	printf 'codex-seat.sh: codex exited %s; its output is in %s.log\n' "$status" "$out" >&2
	exit "$status"
fi
if [ ! -s "$out" ]; then
	printf 'codex-seat.sh: codex wrote no final message; its output is in %s.log\n' "$out" >&2
	exit 4
fi
printf '%s\n' "$out"
