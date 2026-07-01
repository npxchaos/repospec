# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately**. Do not open a public
issue.

- Use [GitHub Security Advisories](https://github.com/npxchaos/repospec/security/advisories/new)
  to report privately, or
- email **security@repospec.dev**.

We will acknowledge your report, investigate, and keep you informed of progress.
Please give us a reasonable window to release a fix before any public
disclosure.

## Supported versions

While the project is pre-1.0, security fixes target the latest release on the
`main` branch.

## Security-sensitive areas

Repospec writes files into a developer's repository. Two areas warrant particular
care:

1. **File generation and sync** — Repospec must never overwrite human-authored
   content without consent (ADR-0004). A bug that does is treated as a security
   issue.
2. **Plugins (Phase 8)** — plugins are an arbitrary-code-execution surface and
   are therefore **declarative-only** until a dedicated plugin-security ADR
   defines a trust/sandbox model. No third-party plugin code is executed before
   that review lands (roadmap Milestone 6).

## Network behavior

Core operations (Phases 1–8) are offline and deterministic (ADR-0006). The only
network-bound feature is the opt-in AI bootstrap (Phase 9), which must obtain
explicit consent before sending any repository content externally.
