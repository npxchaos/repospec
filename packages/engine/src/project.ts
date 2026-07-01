import {
  PROTOCOL_VERSION,
  ProjectSchema,
  type Project,
  type ProjectInfo,
} from '@repospec/protocol';

/** The answers gathered from the `repospec init` interview. */
export interface InitInput {
  name: string;
  description: string;
  type: ProjectInfo['type'];
  languages: string[];
  runtimes?: string[];
  packageManager?: string;
  frameworks?: string[];
  testing?: string[];
  formatter?: string;
  linter?: string;
  commitStyle?: 'conventional' | 'freeform';
  branching?: 'trunk' | 'github-flow' | 'gitflow';
  repository?: string;
  /** Adapter ids to enable; defaults to `['claude']`. */
  adapters?: string[];
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Build and validate a {@link Project} from interview answers. Defaults
 * (document paths, agent/rule dirs) are filled by the schema.
 *
 * @param input - The interview answers.
 * @returns A validated project configuration.
 * @throws {import('@repospec/protocol').RepospecValidationError} If invalid.
 */
export function buildProject(input: InitInput): Project {
  const raw = {
    repospecProtocol: PROTOCOL_VERSION,
    project: compact({
      name: input.name,
      description: input.description,
      type: input.type,
      repository: input.repository,
    }),
    stack: compact({
      languages: input.languages,
      runtimes: input.runtimes,
      packageManager: input.packageManager,
      frameworks: input.frameworks,
      testing: input.testing,
    }),
    conventions: compact({
      formatter: input.formatter,
      linter: input.linter,
      commitStyle: input.commitStyle,
      branching: input.branching,
    }),
    adapters: input.adapters ?? ['claude'],
  };
  return ProjectSchema.parse(raw);
}
