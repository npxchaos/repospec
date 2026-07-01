---
'@repospec/templates': minor
---

Add template rendering primitives to `@repospec/templates`: `interpolate` (a
`{{ dotted.path }}` substitution engine that throws on a missing variable rather
than emitting a blank) and `partials` (reusable snippets). The seed
`architecture.md` now renders through them, and both are exported for future
user-authored templates (roadmap Milestone 4).
