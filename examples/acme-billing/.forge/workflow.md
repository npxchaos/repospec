# Workflow

```
Plan → Design → Implement → Review → Validate → Document → Release → Sync
```

Each step has an owning role, entry/exit criteria, and may be a human gate.

| Step      | Owner     | Entry                | Exit                                   | Human gate |
|-----------|-----------|----------------------|----------------------------------------|:----------:|
| Plan      | architect | a problem statement  | agreed scope + acceptance criteria     | yes |
| Design    | architect | agreed scope         | interfaces + affected decisions noted  | no  |
| Implement | builder   | design               | code + tests written                   | no  |
| Review    | reviewer  | implement complete   | diff approved or sent back             | no  |
| Validate  | tester    | review approved      | full suite green; acceptance met       | no  |
| Document  | builder   | validate passed      | history/ updated; ADR if architectural | no  |
| Release   | release   | document complete    | deployed + tagged                      | yes |
| Sync      | release   | release done         | AGENTS.md recompiled; branch merged    | no  |

Rules:
- A step cannot be skipped.
- A human gate cannot be auto-cleared by an agent.
- Any role may escalate to a human at any step.
