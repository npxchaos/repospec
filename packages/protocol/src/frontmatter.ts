import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { RepospecValidationError } from './errors.js';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** A document split into its frontmatter data and Markdown body. */
export interface Frontmatter {
  /** The parsed YAML frontmatter (unvalidated). */
  data: unknown;
  /** The Markdown body following the frontmatter block. */
  body: string;
}

/**
 * Split a Markdown-with-frontmatter document into data and body.
 *
 * @param text - The full file contents.
 * @returns The parsed YAML data and the trailing Markdown body.
 * @throws {RepospecValidationError} If no leading `---` frontmatter block exists.
 */
export function parseFrontmatter(text: string): Frontmatter {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) {
    throw new RepospecValidationError(
      'Missing YAML frontmatter (expected a block delimited by `---`).',
      [],
    );
  }
  let data: unknown;
  try {
    data = parseYaml(match[1] ?? '');
  } catch (error) {
    throw new RepospecValidationError(
      `Invalid YAML frontmatter: ${(error as Error).message}`,
      [],
    );
  }
  return { data, body: (match[2] ?? '').replace(/^\n+/, '') };
}

/**
 * Compose a Markdown-with-frontmatter document from data and body.
 *
 * @param data - The frontmatter object to serialize as YAML.
 * @param body - The Markdown body.
 * @returns A document beginning with a `---` frontmatter block.
 */
export function stringifyFrontmatter(data: unknown, body: string): string {
  const yaml = stringifyYaml(data).trimEnd();
  return `---\n${yaml}\n---\n\n${body.replace(/^\n+/, '')}`;
}
