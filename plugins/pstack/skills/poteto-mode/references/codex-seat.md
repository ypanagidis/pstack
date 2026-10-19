# Codex seat

On Claude Code, every subagent the `Agent` tool spawns is a Claude model, so a panel of Claude reviewers shares one family's blind spots. A Codex seat adds a member from a different family by running one panel role through the Codex CLI. It needs `codex` on `PATH`, signed in with the user's own login.

## When it runs

The `codex seat` line in the `pstack-models.md` override sheet controls it. The line lists one or more Codex models, separated by commas. Each entry is one seat, and each entry may carry a reasoning effort, as in `codex seat: gpt-6.1-sol @xhigh, gpt-6-astra @xhigh`.

- No line: one seat runs `gpt-6.1-sol` at `xhigh`.
- A line with one entry: one seat runs that model, as in `codex seat: gpt-6-astra @max`.
- A line with several entries: each entry is its own seat.
- `codex seat: off`: no seat runs, and panels run on Claude models only.

A panel role takes every seat, each as its own member:

- Each `interrogate` review, as one more reviewer per seat.
- Each `arena` run, as one more runner per seat.
- The `architect` sketch, as one more runner per seat, because `architect` runs through `arena`.

A role that has one member takes the first seat in the list:

- The `arena` cross-judge whenever the parent session is a Claude model.
- The `show-me-your-work` cross-model review of the trail.
- An `orchestrate` verifier for a unit a Claude worker built.
- The blinded judge in the Eval playbook.

## How to run it

1. Write the seat's full prompt to a file. It is the same filled template every other member of the panel receives, word for word. Give each seat its own copy of the file.
2. Run the script from this plugin, `skills/poteto-mode/scripts/codex-seat.sh`, with the Bash tool and `run_in_background: true`. A Codex run at a high effort can take many minutes.

```shell
codex-seat.sh --prompt <prompt-file> --out <result-file> --cwd <directory> [--write] [--model <slug>] [--effort <level>]
```

- `--cwd` is the directory the seat may read: the repository for a reviewer or a judge, and the candidate's own directory or worktree for a runner.
- `--write` lets the seat write inside `--cwd`. Pass it only for a runner. A reviewer and a judge stay read-only.
- `--model` and `--effort` come from the seat's entry in the `codex seat` line when it names them.
- `--out` is a separate result file for each seat.

With several seats, run one script call per seat, each with its own `--model`, `--effort`, prompt file and `--out`. The calls run in parallel.

The script prints the result file's path and exits 0 when the seat finished. Read the result file as that member's report. Any other exit code is a dropout: name the seat and the code in the report, proceed with the remaining members, as the panel skills already do for any member that returns nothing, and never retry it silently. Exit code 3 means `codex` is not installed.

## Reporting

Name each seat by its model, such as `codex gpt-6-astra @xhigh`, wherever the skill names a member's model. A finding that a Claude member and any Codex seat raised independently is cross-family consensus, the strongest signal a panel produces. Two Codex seats share one family, so a finding only they raised is same-family agreement, not cross-family consensus.
