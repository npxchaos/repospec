---
id: security
title: No secrets, no card data
severity: error
rationale: A leaked secret or stored card number is an incident, not a bug.
---

Secrets never enter the repo, the logs, or an agent's output. Card data never
transits or persists in this service — it belongs to the payments provider. Error
messages and traces must not echo credentials or personal payment details.
