# Codex seat

On Claude Code, every subagent the `Agent` tool spawns is a Claude model, so a panel of Claude reviewers shares one family's blind spots. The Codex seat adds a member from a different family by running one panel role through the Codex CLI. It needs `codex` on `PATH`, signed in with the user's own login.

## When it runs

The `codex seat` line in the `pstack-models.md` override sheet controls it.

- No line, or a line naming a model: the seat is on. Without a model, the seat runs `gpt-6.1-sol` at `xhigh`. A line such as `codex seat: gpt-6-astra @max` picks another Codex model and reasoning effort.
- `codex seat: off`: the seat is off, and panels run on Claude models only.

When the seat is on, it joins these roles as one extra member:

- Each `interrogate` review, as one more reviewer.
- Each `arena` run, as one more runner, and as the cross-judge whenever the parent session is a Claude model.
- The `architect` sketch, as one more runner, because `architect` runs through `arena`.
- The `show-me-your-work` cross-model review of the trail.
- An `orchestrate` verifier for a unit a Claude worker built.
- The blinded judge in the Eval playbook.

## How to run it

1. Write the seat's full prompt to a file. It is the same filled template every other member of the panel receives, word for word.
2. Run the script from this plugin, `skills/poteto-mode/scripts/codex-seat.sh`, with the Bash tool and `run_in_background: true`. A Codex run at a high effort can take many minutes.

```shell
codex-seat.sh --prompt <prompt-file> --out <result-file> --cwd <directory> [--write] [--model <slug>] [--effort <level>]
```

- `--cwd` is the directory the seat may read: the repository for a reviewer or a judge, and the candidate's own directory or worktree for a runner.
- `--write` lets the seat write inside `--cwd`. Pass it only for a runner. A reviewer and a judge stay read-only.
- `--model` and `--effort` come from the `codex seat` line when it names them.

The script prints the result file's path and exits 0 when the seat finished. Read the result file as that member's report. Any other exit code is a dropout: name the seat and the code in the report, proceed with the remaining members, as the panel skills already do for any member that returns nothing, and never retry it silently. Exit code 3 means `codex` is not installed.

## Reporting

Name the seat by its model, such as `codex gpt-6.1-sol @xhigh`, wherever the skill names a member's model. A finding that a Claude member and the Codex seat raised independently is cross-family consensus, the strongest signal a panel produces.
