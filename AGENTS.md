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
