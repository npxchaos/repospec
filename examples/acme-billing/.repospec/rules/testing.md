---
id: testing
title: Billing math is test-first
severity: error
rationale: Money computed without a test regresses silently and invisibly.
---

Any change under `rating/` or `invoicing/` starts with a failing test that pins the
expected amount. Bug fixes begin with a test that reproduces the wrong number. A
change to billing math without an accompanying test is rejected at review.
