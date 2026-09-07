---
name: summarize-changes
description: Use when the user asks to "summarize changes", "summarize my diff", "write a PR description", or "describe these changes" for this repo. Detects the current diff, reviews it with the project's code-reviewer agent, drafts a PR title/description, and offers to open the PR — pausing for confirmation before any mutating git/gh command.
version: 1.0.0
---

# Summarize Changes

Turn pending changes in this repo into a reviewed, described pull request: detect
the diff, review it with the `code-reviewer` agent, draft a PR title/description,
and offer to open the PR — pausing for confirmation before any mutating `git`/`gh`
command.

## 1. Determine scope

If the user gave an explicit target (a branch name, PR number, or commit range),
use that directly. Otherwise fall back through, in order, stopping at the first
one that produces output:

1. `git diff` — unstaged working-tree changes
2. `git diff --staged` — staged changes
3. `git show HEAD` (i.e. the diff of `HEAD~1..HEAD`) — the last commit

If all three are empty, report that there is nothing to summarize and stop. Do not
fabricate a summary from an empty diff.

## 2. Review

Invoke the `code-reviewer` agent (Agent tool, `subagent_type: code-reviewer`) scoped
to the same target determined in step 1. It is read-only — it reports findings
grouped as **Bug**, **Convention violation**, **Style nit**, and it already knows
this repo's conventions (see `CLAUDE.md`) and runs `pnpm lint` / `pnpm build`.

- For findings you're confident about, fix them directly in the working tree
  yourself (the agent cannot).
- For anything uncertain or stylistic, leave it and note it as a caveat in the PR
  description instead of guessing at a fix.
- If the agent reports no issues, continue straight to drafting — this is not an
  error.

## 3. Re-diff

If step 2 changed any files, re-run the same diff command from step 1 to capture
the post-fix state. This is the diff the PR description is drafted from.

## 4. Draft PR title + description

From the re-diffed changes, write:

- A concise, imperative-mood title matching this repo's existing commit style
  (short, e.g. "Add client-side WebP image upload with 10MB limit" — check
  `git log --oneline -10` if unsure).
- A body with a `## Summary` (bullet points, what changed and why) and a
  `## Test plan` checklist, matching this repo's existing PR convention. Base
  this only on what is actually present in the diff — do not invent motivation
  or detail that isn't evidenced by the changes or by conversation context.
- If step 2 left any caveats, call them out explicitly in the body rather than
  silently dropping them.

## 5. Present, then confirm before side effects

Show the drafted title/description to the user first. Only after explicit
confirmation:

- Check whether a PR already exists for the current branch (`gh pr view`) to
  decide between `gh pr create` and `gh pr edit`.
- This repo has no remote branch named after the local `feat/skill` branch — PRs
  from feature worktrees land on `main`. Confirm the intended base with the
  user if it isn't obvious.
- If `gh auth status` fails or there's no configured remote, say so and fall back
  to leaving the drafted text for the user to use manually.

Never push, force-push, commit, or create/edit a PR without that explicit
confirmation, even if earlier steps in this skill required no confirmation.

## Edge cases

- **Nothing to summarize** (all three diffs in step 1 are empty): say so plainly,
  don't error, don't guess.
- **Nothing to fix**: skip the working-tree edits in step 2, proceed to drafting
  from the original diff.
- **No PR host access**: print the draft instead of failing.
