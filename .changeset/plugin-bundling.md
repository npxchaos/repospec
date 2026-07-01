---
'@repospec/protocol': minor
'@repospec/engine': minor
'@repospec/cli': minor
'@repospec/templates': minor
---

Plugins are now **bundled** engine-side with esbuild before they run
([ADR-0011](https://github.com/npxchaos/repospec/blob/main/docs/adr/0011-plugin-bundling.md)),
lifting ADR-0010's single-file constraint: a plugin may span multiple files and
use dependencies (local imports and `node_modules` are inlined; `node:` builtins
stay external). The integrity hash is now computed over the **whole bundle**, so
tampering any imported file or dependency — not just the entry — fails the
approval check. The sandbox is unchanged (the self-contained bundle runs in the
zero-fs `data:`-URL child). `@repospec/engine` gains esbuild as a dependency; the
integrity hash depends on the esbuild version (re-approve after an upgrade).
