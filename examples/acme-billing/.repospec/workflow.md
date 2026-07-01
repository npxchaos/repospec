# Workflow — acme-billing

Work moves through these steps in order. A step can't be skipped, and a human gate
can't be auto-cleared.

| Step | Owner | Human gate |
| ---- | ----- | ---------- |
| Plan | architect | yes |
| Design | architect | no |
| Implement | builder | no |
| Review | reviewer | no |
| Validate | tester | no |
| Security check | security | no |
| Release | release | yes |

- **Plan** and **Release** are human gates: a person signs off before work proceeds.
- Each step hands off to the next only when its exit criteria are met.
- Changes to `deploy/` or `migrations/` require explicit human approval regardless
  of step (see the constitution).
