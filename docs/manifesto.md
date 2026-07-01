# Forge Protocol

**The open engineering protocol for AI-assisted software development.**

## The problem

Every AI coding session starts from zero.

You explain what the project does. The architecture. The coding standards. The business rules. The folder structure. The testing strategy. The deploy process. Then the conversation ends, the context evaporates, and the next session you explain it all again.

Worse: every tool stores that context differently, and every repository invents its own conventions. There is no shared standard for how a project tells an AI how it works.

The result is a workflow built on prompts and tribal knowledge — fragile, inconsistent, and impossible to scale across a team.

## The idea

Stop teaching AI how your project works. Make the project describe itself.

Forge moves context out of the conversation and into the repository, where it belongs. The repo becomes the source of truth. The AI follows a protocol instead of a prompt.

Humans define the protocol. AI follows it. The protocol outlives any model.

## Principles

- Repository over prompts.
- Protocol over conversation.
- Context over memory.
- Standards over improvisation.
- Small steps over big rewrites.
- Humans always override the AI.

## How it works

Every Forge project contains a `.forge/` directory — the engineering brain of the repository:

```text
.forge/
├── project.yaml      # what this is, who it's for, the stack
├── constitution.md   # non-negotiable rules and standards
├── architecture.md   # how the system is structured
├── workflow.md       # how work moves from idea to release
├── rules/            # coding, testing, and security conventions
├── agents/           # roles and their responsibilities
├── templates/        # scaffolds for common work
├── decisions/        # architectural decisions and their rationale
└── history/          # what changed, and why
```

Open any repository and the architecture, standards, workflows, and review process are right there — explicitly defined, not guessed.

## Roles, not personas

"Act like a senior engineer" is a prompt. Forge replaces it with explicit responsibilities.

A project declares which roles it needs — Architect, Builder, Reviewer, Tester, Security, Documentation, Release Manager — and what each one owns. One role, one responsibility. The AI doesn't improvise a personality; it follows a defined job.

## A workflow, not a conversation

Every task moves through the same lifecycle:

**Plan → Design → Implement → Review → Validate → Document → Release → Sync**

Whatever assistant is driving, the engineering process is identical. The work doesn't depend on who's prompting or which model is loaded.

## Bootstrap in one command

No manual setup. No copied prompts.

```bash
forge init
```

Forge interviews you — what you're building, who it's for, your stack, your standards, your testing and compliance requirements — and generates the protocol from your answers.

## Tool-agnostic by design

Forge doesn't depend on any one assistant. It works with Cursor, Claude Code, Codex, Gemini CLI, VS Code, and whatever comes next. Swap the AI; the repository stays the same.

## The standard we're building

Git standardized version control. Docker standardized packaging. Forge standardizes how repositories communicate with AI.

This isn't another AI coding tool. It's a common language between software projects and the assistants that work on them — one that any human can read and any model can follow.

Because AI should adapt to the project. The project should never have to adapt to the AI.
