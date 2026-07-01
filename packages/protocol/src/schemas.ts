import { z } from 'zod';

/**
 * zod schemas for the Repospec protocol artifacts. These are the internal source
 * of truth for validation; the published JSON Schema is generated from them
 * (ADR-0005). The prose in `spec/` is authoritative where they disagree.
 */

/** Kind of project a repository represents. */
export const ProjectType = z.enum([
  'application',
  'library',
  'service',
  'cli',
  'monorepo',
]);

/** Commit message convention. */
export const CommitStyle = z.enum(['conventional', 'freeform']);

/** Branching model. */
export const Branching = z.enum(['trunk', 'github-flow', 'gitflow']);

/** Rule severity. */
export const Severity = z.enum(['error', 'warning', 'info']);

/** `project` block — project identity. */
export const ProjectInfoSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: ProjectType,
  repository: z.string().url().optional(),
});

/** `stack` block — languages, runtimes, tooling. */
export const StackSchema = z.object({
  languages: z.array(z.string().min(1)).min(1),
  runtimes: z.array(z.string()).optional(),
  packageManager: z.string().optional(),
  frameworks: z.array(z.string()).optional(),
  testing: z.array(z.string()).optional(),
});

/** `conventions` block — formatter, linter, commit/branch style. */
export const ConventionsSchema = z
  .object({
    formatter: z.string().optional(),
    linter: z.string().optional(),
    commitStyle: CommitStyle.optional(),
    branching: Branching.optional(),
  })
  .default({});

/** `documents` block — overrides for prose-document paths. */
export const DocumentsSchema = z
  .object({
    constitution: z.string().default('constitution.md'),
    architecture: z.string().default('architecture.md'),
    workflow: z.string().default('workflow.md'),
  })
  .default({});

/** `agents` / `rules` block — where the respective artifacts live. */
const dirConfig = (dir: string) =>
  z.object({ dir: z.string().default(dir) }).default({ dir });

/** A reference to an enabled adapter, normalized to an object. */
export const AdapterRefSchema = z
  .union([
    z.string().min(1),
    z.object({
      id: z.string().min(1),
      options: z.record(z.unknown()).optional(),
    }),
  ])
  .transform((value) => (typeof value === 'string' ? { id: value } : value));

/** A declarative plugin reference (declarative-only until Milestone 6). */
export const PluginRefSchema = z.object({
  id: z.string().min(1),
  version: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});

/** The root artifact: `.repospec/project.yaml`. */
export const ProjectSchema = z.object({
  repospecProtocol: z.string().min(1),
  project: ProjectInfoSchema,
  stack: StackSchema,
  conventions: ConventionsSchema,
  documents: DocumentsSchema,
  agents: dirConfig('agents'),
  rules: dirConfig('rules'),
  adapters: z.array(AdapterRefSchema).default([]),
  plugins: z.array(PluginRefSchema).default([]),
});

/** Frontmatter for an `agents/<id>.md` artifact (see `spec/agent.md`). */
export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  responsibilities: z.array(z.string()).optional(),
  boundaries: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  model: z.string().optional(),
});

/** Frontmatter for a `rules/<id>.md` artifact (see `spec/agent.md`). */
export const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: Severity,
  appliesTo: z.array(z.string()).optional(),
  rationale: z.string().optional(),
});

/** Validated `project.yaml`. */
export type Project = z.infer<typeof ProjectSchema>;
/** Validated `project` block. */
export type ProjectInfo = z.infer<typeof ProjectInfoSchema>;
/** Validated `stack` block. */
export type Stack = z.infer<typeof StackSchema>;
/** A normalized adapter reference. */
export type AdapterRef = z.infer<typeof AdapterRefSchema>;
/** Agent frontmatter. */
export type AgentFrontmatter = z.infer<typeof AgentSchema>;
/** Rule frontmatter. */
export type RuleFrontmatter = z.infer<typeof RuleSchema>;
