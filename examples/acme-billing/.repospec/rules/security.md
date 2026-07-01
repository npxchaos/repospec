# Security rules

- No secrets in the repo, ever. Use the secret manager; reference by name.
- Never log card data, full account numbers, or tokens.
- Validate and type all external input at the boundary.
- New dependencies are reviewed; no known-critical CVEs.
- Auth and payment paths require the security role's sign-off.
