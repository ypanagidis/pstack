# Lead Judgment Framework

## Filtering Principles

### Nitpick Gravity

Reviewers, especially adversarial ones, tend to fill their review. If they don't find critical issues, they'll inflate nits to fill the space. If a reviewer's findings are all nits and style preferences, the code is probably fine. Say so.

### Hypothetical vs. Actual

"What if someone passes null here?" is only a finding if the caller can actually pass null. Trace the call site. If the input is validated upstream or the type system prevents it, dismiss the finding. Reviewers working from a diff can't always see the full call chain. You can.

### Premature Abstraction Warnings

Reviewers often suggest extracting functions, adding interfaces, or creating abstractions. Does this code need to change in a second way? If not, the abstraction is premature. Simple inline code that works beats a clean abstraction that's overkill for the current scope.

### "I Would Have Done It Differently"

This is the most common false positive in code review. A finding that amounts to "I prefer a different approach" is not a bug, not a design flaw, and not actionable unless the reviewer shows a concrete problem with the current approach. Dismiss these, and say why.

### Missing Context Signals

Watch for findings that reveal the reviewer didn't understand the context:
- Suggesting changes to code the author didn't write or modify
- Flagging patterns that are consistent with the rest of the codebase (the reviewer just doesn't know that)
- Recommending approaches that conflict with constraints you know about

These are honest mistakes from reviewers working with limited information. Dismiss them gracefully.

## Fix Now or File

While a project's core features are still being built, a finding goes in Act On only if people will run into it in ordinary use and it does at least one of three things: it makes the product look like an unfinished pet project, it stops someone getting their work done, or it loses real work. Anything else goes in Noted and is filed as an issue for later, including a real bug that is rare, hard to reproduce, or something a developer would understand and work around while the app keeps working. That holds even when a fix would make the experience nicer and even when it looks small. A fix round costs a panel designing the fix, another attacking it and a final review, and that costs more than the fix is worth next to everything still left to build.

Before any finding goes in Act On, write down what a person does to hit it ("someone sends a message while…") and roughly how often that happens. If the trigger needs two events to land within milliseconds of each other, or was only seen in tests with fakes, it's rare: file it. Merge gates and verifiers grade their findings by this rule too. A finding that doesn't meet it is an issue to file, not a failed review. This rule overrides older rules that call a problem a blocker without asking how often people hit it. A repository's own agent instructions (AGENTS.md, CLAUDE.md) may say its core features are done and set a stricter bar; follow them.

## When Reviewers Are Right

Don't dismiss findings just because they're uncomfortable. The whole point of adversarial review is to catch things you'd miss. Signs a finding deserves attention:

- Multiple models flag the same issue independently (consensus signal)
- The finding identifies a concrete execution path, not a hypothetical
- The finding reveals a gap in your mental model of the code
- You read the finding and think "...yeah, actually"

Be especially careful about dismissing security findings and correctness bugs. These deserve more scrutiny even when they come from a single model. Scrutiny means checking the trigger: a real correctness bug that misses the bar in Fix Now or File goes in Noted and gets filed, not dismissed and not fixed now.
