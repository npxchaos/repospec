import { describe, expect, it } from 'vitest';
import { RepospecValidationError } from './errors.js';
import {
  parseAgent,
  parseProject,
  parseRule,
  serializeProject,
} from './parse.js';

const VALID_PROJECT = `
repospecProtocol: "0.1"
project:
  name: acme
  description: A test project.
  type: application
stack:
  languages: [typescript]
`;

describe('parseProject', () => {
  it('parses a minimal valid project and applies defaults', () => {
    const project = parseProject(VALID_PROJECT);
    expect(project.project.name).toBe('acme');
    expect(project.documents.constitution).toBe('constitution.md');
    expect(project.agents.dir).toBe('agents');
    expect(project.adapters).toEqual([]);
  });

  it('normalizes string adapters into objects', () => {
    const project = parseProject(
      `${VALID_PROJECT}\nadapters: [claude, cursor]\n`,
    );
    expect(project.adapters).toEqual([{ id: 'claude' }, { id: 'cursor' }]);
  });

  it('reports a path-first error for an invalid type', () => {
    const bad = VALID_PROJECT.replace('application', 'webapp');
    expect(() => parseProject(bad)).toThrow(RepospecValidationError);
    try {
      parseProject(bad);
    } catch (error) {
      expect((error as RepospecValidationError).issues[0]).toMatch(
        /^project\.type:/,
      );
    }
  });

  it('requires at least one language', () => {
    const bad = VALID_PROJECT.replace('[typescript]', '[]');
    expect(() => parseProject(bad)).toThrow(/stack\.languages/);
  });

  it('round-trips through serializeProject', () => {
    const project = parseProject(VALID_PROJECT);
    const text = serializeProject(project);
    expect(text).toContain(
      '$schema=https://raw.githubusercontent.com/npxchaos/repospec/main/schemas/0.1/',
    );
    expect(parseProject(text)).toEqual(project);
  });
});

describe('parseAgent', () => {
  it('parses frontmatter and body', () => {
    const agent = parseAgent(
      `---\nid: reviewer\nname: Reviewer\ndescription: Reviews code.\n---\n\nDo the review.\n`,
    );
    expect(agent.meta.id).toBe('reviewer');
    expect(agent.body).toBe('Do the review.\n');
  });

  it('rejects a document without frontmatter', () => {
    expect(() => parseAgent('just text')).toThrow(RepospecValidationError);
  });
});

describe('parseRule', () => {
  it('parses a rule and validates severity', () => {
    const rule = parseRule(
      `---\nid: no-any\ntitle: No any\nseverity: error\n---\n\nAvoid any.\n`,
    );
    expect(rule.meta.severity).toBe('error');
  });

  it('rejects an invalid severity', () => {
    const bad = `---\nid: x\ntitle: X\nseverity: blocker\n---\nbody`;
    expect(() => parseRule(bad)).toThrow(/severity/);
  });
});
