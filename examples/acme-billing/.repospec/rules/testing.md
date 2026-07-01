# Testing rules

- Billing math is tested first: write the failing test, then the code.
- Money is integer cents in tests too; assert exact values, never approximate.
- Every bug fix ships with a regression test that fails before the fix.
- The full suite must pass before Validate clears.
