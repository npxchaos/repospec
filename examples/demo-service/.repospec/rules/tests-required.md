---
id: tests-required
title: Changes ship with tests
severity: error
rationale: Untested behavior regresses silently.
---

Every change that alters behavior must include a test that would fail without
the change. Bug fixes start with a failing test that reproduces the bug.
