---
'@repospec/engine': patch
'@repospec/cli': patch
---

Slugify the `claude-agents` subagent `name` and filename to Claude Code's rule
(lowercase letters and hyphens only), so a role id like `Code_Reviewer` produces
a loadable `code-reviewer` name instead of an invalid one. Verified end to end:
generated files load in real Claude Code via `claude --agent <name>`, adopting
the role name and system prompt.
