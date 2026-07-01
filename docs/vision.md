# Repospec — Vision

> This is not a technical document. It is the product argument for why Repospec
> should exist. If it cannot convince a working developer in five minutes, no
> amount of architecture will save it.

Repospec is a standard for teaching a repository to explain itself — so that any AI
coding assistant, and any human, can build and evolve the project correctly
without being re-briefed every time.

It answers four questions.

## 1. Why does Repospec exist?

Today, the knowledge of *how a project should be built* lives in the wrong
places: in a senior engineer's head, in a Slack thread, in a half-remembered PR
comment, and — increasingly — in a thousand one-off prompts typed into AI
assistants. None of it is versioned with the code. None of it is portable
between tools. None of it survives the person who wrote it.

AI assistants have made this worse, not better. Each developer hand-feeds the
same context ("we use pnpm", "don't add a class component", "tests go here")
into a different tool, every session, forever. The context is real and valuable,
but it evaporates the moment the chat window closes.

Repospec exists to move that knowledge **into the repository, as a versioned,
tool-agnostic standard** — the `.repospec/` directory. Written once, reviewed like
code, read by every assistant. The repository becomes the source of truth about
itself.

## 2. Why now?

Three things became true at the same time:

- **AI assistants are everywhere and incompatible.** Claude, Cursor, Copilot,
  Aider, Windsurf — each reads a different file in a different format. Teams use
  several at once. There is no shared way to tell all of them the same thing.
- **The cost of *not* having shared context is now paid every day,** by every
  developer, in every session — not just at onboarding.
- **The patterns have stabilized enough to standardize.** Engineering
  conventions, review workflows, and architectural rules are well understood.
  What's missing is a *format* and a *protocol*, not more opinions.

Standards emerge exactly at this moment: when a practice is common, valuable,
and fragmented. Git standardized version control. Docker standardized packaging.
Repospec standardizes how a repository describes the way it should be built.

## 3. Why is the repository the source of truth?

Because everything else is too fragile.

- A **prompt** is lost when the session ends and differs per person and per
  tool.
- A **wiki** drifts from the code and is never read by the assistant doing the
  work.
- An **AI's memory** is opaque, unversioned, and unreviewable — you cannot
  diff it, you cannot approve it, and you cannot trust it across tools.

The repository is the one artifact that is already versioned, already reviewed,
already shared by the whole team, and already present wherever the work happens.
Putting the engineering contract *in the repository* means it is diffable,
reviewable, and authoritative. **Human decisions are committed; AI follows what
is committed.** When the protocol and the AI disagree, the protocol wins —
because a human approved it in a pull request.

## 4. Why will developers adopt it instead of writing prompts?

Because it is strictly less work and strictly more durable.

- **Write it once.** `repospec init` runs a short interview and generates the
  `.repospec/` standard plus the native entrypoint each assistant already reads
  (`CLAUDE.md`, Cursor rules, Copilot instructions). Stop re-explaining your
  project to every tool, every day.
- **It travels with the code.** New teammate, new laptop, new AI tool — the
  context is already there, already correct, already reviewed.
- **It is reviewable.** Changing how the project is built becomes a pull
  request, not a private prompt. The team controls its own conventions.
- **It is tool-agnostic.** Switch or combine assistants without re-teaching any
  of them. No lock-in.
- **It feels like tools they already trust** — `git`, `npm`, `create-next-app`:
  simple, predictable, discoverable.

The pitch in one sentence: **stop prompting your AI about your project — commit
the answer once, and every tool reads it.**

## The shape of the thing

Repospec is an umbrella, and the specification is its center:

```
Repospec
├── Repospec Specification   the standard — language-neutral, versioned  ← the heart
├── Repospec Engine          reference implementation of the spec
├── Repospec CLI             the human entrypoint to the engine
├── Repospec Templates       default content the spec is seeded from
├── Repospec Adapters        project the spec into each assistant's format
└── Repospec Plugins         community extensions (declarative-first)
```

The CLI is *one* implementation of the specification. If the CLI vanished
tomorrow, the specification — and any other tool built against it — would still
stand. That is the test of a standard, and it is the principle the architecture
is organized around.
