# AGENTS — working agreements for humans and coding agents on this repo

## Rule: describe user-facing behavior in FEATURES.md

Every user-facing behavior — new feature, changed interaction, or removed behavior —
must be described in [FEATURES.md](FEATURES.md) before (or in the same commit as) the
code that implements it.

- Format: one block per feature — short description, the workflow as Given/When
  bullets, then the expected observation. Reference the mapping F-ID from
  [REQUIREMENTS.md](REQUIREMENTS.md) when one exists (new features may precede an ID).
- Behavior changes that touch an existing block update it in place; removed behavior
  gets its block removed with the code.
- Acceptance tests, whether Playwright specs under `tests/e2e/` or manual checklists,
  trace to these blocks.

## Git workflow

- **Never start working on `main`.** Always branch: one feature = one branch.
- Branch names: `feat/<slug>` for features, `fix/<slug>` for fixes, `chore/<slug>`
  for chores.
- Always open a PR, even when working solo — the PR is the review checkpoint: the
  branch holds the work, `main` stays releasable, one click merges.
- Merging locally without a PR is acceptable only for trivial docs/typo/lockfile
  bumps; keep them out of user-facing code.
- Squash-merge feature branches into `main` (linear history, no merge bubbles).
- Never force-push shared branches (`main`, shared feature branches). If history
  must be rewritten, pick a new branch name (e.g. `feat/<slug>-v2`) to make that
  explicit.

## Git workflow

- **Never start working on `main`.** Always branch: one feature = one branch.
- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Always open a PR, even when working solo — the PR is the review checkpoint:
  the branch holds the work, `main` stays releasable, one click merges.
- Merging locally without a PR is acceptable only for trivial docs/typo/lockfile
  bumps; keep them out of user-facing code.
- Squash-merge feature branches into `main` (linear history, no merge bubbles).
- Never force-push shared branches (main, shared feature branches). If history must
  be rewritten, pick a new branch name (e.g. `feat/<slug>-v2`) to make that explicit.

