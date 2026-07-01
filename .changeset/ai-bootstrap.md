---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Add opt-in AI assist to `repospec bootstrap` (`--ai`). When enabled, the detected
facts (project name + the inference evidence — metadata only, never source code)
are sent to the model to refine the project description; the result is still a
draft for human approval. `planBootstrap` gains an optional `llm` (the engine's
injectable `LlmClient` port), so the assist is provider-agnostic and unit-tested
with a fake. Offline inference remains the default. Closes roadmap 7.2.
