# This fork

A private fork of [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude), the Claude Code port of Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack). It is customized for Yiannis's own work, starting with Mend.

## Remotes

- `origin` is this repository, `ypanagidis/pstack`.
- `upstream` is michael-denyer's port. Pushing to it is disabled.

Take the port's updates with `git fetch upstream` and `git merge upstream/main`. Every change this fork makes to a skill file is a `policy` entry in `tools/forks.json`, so a merge conflict always lands on a change that is written down.

## Checks before each commit

```shell
bun tools/generate.mjs
bun test tests/
```

## What this fork changes

- **Codex seat.** On Claude Code every `Agent` subagent is a Claude model. The Codex seat adds one panel member from a different model family through `codex exec`, by default `gpt-6.1-sol` at `xhigh`. It joins `interrogate`, `arena` (runner and cross-judge), `architect` through `arena`, the `show-me-your-work` trail review, the `orchestrate` verifier, and the Eval judge. The sheet's `codex seat` line picks another model and effort, or turns it `off`. See `plugins/pstack/skills/poteto-mode/references/codex-seat.md` and `scripts/codex-seat.sh`.
