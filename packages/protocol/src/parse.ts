import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { RepospecValidationError, formatZodError } from './errors.js';
import { parseFrontmatter } from './frontmatter.js';
import {
  AgentSchema,
  ProjectSchema,
  RuleSchema,
  type AgentFrontmatter,
  type Project,
  type RuleFrontmatter,
} from './schemas.js';

/** A parsed agent artifact: validated frontmatter plus its Markdown body. */
export interface Agent {
  /** Validated frontmatter. */
  meta: AgentFrontmatter;
  /** Instruction body. */
  body: string;
}

/** A parsed rule artifact: validated frontmatter plus its Markdown body. */
export interface Rule {
  /** Validated frontmatter. */
  meta: RuleFrontmatter;
  /** Rule body. */
  body: string;
}

/**
 * Parse and validate `project.yaml`.
 *
 * @param text - The raw file contents.
 * @returns The validated project configuration.
 * @throws {RepospecValidationError} On invalid YAML or schema violations.
 */
export function parseProject(text: string): Project {
  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (error) {
    throw new RepospecValidationError(
      `project.yaml is not valid YAML: ${(error as Error).message}`,
      [],
    );
  }
  const result = ProjectSchema.safeParse(raw);
  if (!result.success) {
    throw new RepospecValidationError(
      'project.yaml failed validation:',
      formatZodError(result.error),
    );
  }
  return result.data;
}

/**
 * Serialize a project configuration to `project.yaml` text, including the
 * editor `$schema` association.
 *
 * @param project - The configuration to serialize.
 * @returns YAML text suitable for writing to `.repospec/project.yaml`.
 */
export function serializeProject(project: Project): string {
  const schemaUrl = `https://raw.githubusercontent.com/npxchaos/repospec/main/schemas/${project.repospecProtocol}/project.schema.json`;
  const header = `# yaml-language-server: $schema=${schemaUrl}\n`;
  return header + stringifyYaml(project);
}

/**
 * Parse and validate an `agents/<id>.md` artifact.
 *
 * @param text - The full file contents (frontmatter + body).
 * @returns The validated agent.
 * @throws {RepospecValidationError} On missing/invalid frontmatter.
 */
export function parseAgent(text: string): Agent {
  const { data, body } = parseFrontmatter(text);
  const result = AgentSchema.safeParse(data);
  if (!result.success) {
    throw new RepospecValidationError(
      'agent frontmatter failed validation:',
      formatZodError(result.error),
    );
  }
  return { meta: result.data, body };
}

/**
 * Parse and validate a `rules/<id>.md` artifact.
 *
 * @param text - The full file contents (frontmatter + body).
 * @returns The validated rule.
 * @throws {RepospecValidationError} On missing/invalid frontmatter.
 */
export function parseRule(text: string): Rule {
  const { data, body } = parseFrontmatter(text);
  const result = RuleSchema.safeParse(data);
  if (!result.success) {
    throw new RepospecValidationError(
      'rule frontmatter failed validation:',
      formatZodError(result.error),
    );
  }
  return { meta: result.data, body };
}
