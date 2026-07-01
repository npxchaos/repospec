/**
 * `@repospec/protocol` — the executable form of the Repospec Specification.
 *
 * Types, zod schemas, parsing/serialization, and version helpers for the
 * `.repospec/` protocol. No I/O side effects: all filesystem access goes through
 * the injectable {@link RepospecFileSystem} port.
 *
 * @packageDocumentation
 */

export {
  PROTOCOL_VERSION,
  supports,
  parseProtocolVersion,
  compareProtocolVersions,
  type ProtocolVersion,
} from './version.js';
export { RepospecValidationError, formatZodError } from './errors.js';
export type { RepospecFileSystem } from './fs.js';
export {
  parseFrontmatter,
  stringifyFrontmatter,
  type Frontmatter,
} from './frontmatter.js';
export {
  parseProject,
  serializeProject,
  parseAgent,
  parseRule,
  type Agent,
  type Rule,
} from './parse.js';
export {
  readRepospec,
  REPOSPEC_DIR,
  type RepospecRepository,
} from './repository.js';
export {
  ProjectSchema,
  ProjectInfoSchema,
  StackSchema,
  ConventionsSchema,
  DocumentsSchema,
  AdapterRefSchema,
  PluginRefSchema,
  AgentSchema,
  RuleSchema,
  ProjectType,
  CommitStyle,
  Branching,
  Severity,
  type Project,
  type ProjectInfo,
  type Stack,
  type AdapterRef,
  type AgentFrontmatter,
  type RuleFrontmatter,
} from './schemas.js';
