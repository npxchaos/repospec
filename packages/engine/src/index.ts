/**
 * `@repospec/engine` — the UI-agnostic implementation of the Repospec
 * protocol operations defined in `spec/lifecycle.md`.
 *
 * The engine never prompts and never touches a terminal; it accepts plain data
 * and operates on an injected {@link RepospecFileSystem}. This is what makes it
 * embeddable in a CLI, an editor extension, or a CI action alike (ADR-0007).
 *
 * @packageDocumentation
 */

import { PROTOCOL_VERSION } from '@repospec/protocol';
import { defaultRegistry } from './adapters/registry.js';

export type { RepospecFileSystem } from '@repospec/protocol';

// Filesystems
export { NodeFileSystem } from './fs/node.js';
export { MemoryFileSystem } from './fs/memory.js';

// Adapters
export type { Adapter, AdapterOutput } from './adapters/types.js';
export { AdapterRegistry, defaultRegistry } from './adapters/registry.js';
export {
  builtinAdapters,
  claudeAdapter,
  agentsAdapter,
  copilotAdapter,
  cursorAdapter,
  windsurfAdapter,
  geminiAdapter,
  zedAdapter,
  clineAdapter,
  continueAdapter,
} from './adapters/builtin.js';

// Managed-file helpers (ownership model)
export {
  checksum,
  wrapManaged,
  parseManaged,
  isModified,
  type ManagedFile,
} from './managed.js';

// Planning
export {
  applyPlan,
  type FilePlan,
  type PlannedWrite,
  type ApplyResult,
  type Owner,
  type WriteAction,
} from './plan.js';
export { findRepoRoot } from './locate.js';
export { buildProject, type InitInput } from './project.js';
export {
  planAdapterWrites,
  type RenderOptions,
  type AdapterPlan,
} from './render.js';

// Operations
export {
  init,
  planInit,
  type InitOptions,
  type InitPlan,
} from './operations/init.js';
export { generate, type GenerateOptions } from './operations/generate.js';
export { sync, type SyncOptions, type SyncResult } from './operations/sync.js';
export {
  doctor,
  type DoctorOptions,
  type DoctorReport,
  type DoctorIssue,
} from './operations/doctor.js';
export {
  requireRepoRoot,
  NoRepospecRepositoryError,
} from './operations/locate-root.js';
export {
  inferProjectInput,
  planBootstrap,
  type BootstrapInference,
  type BootstrapPlan,
  type BootstrapOptions,
} from './operations/bootstrap.js';
export {
  upgrade,
  planUpgrade,
  MIGRATIONS,
  type Migration,
  type UpgradeOptions,
  type UpgradeReport,
  type UpgradeStatus,
} from './operations/upgrade.js';

// Plugins (declarative + gated runtime; ADR-0008/0009)
export { integrityOf } from './plugins/integrity.js';
export {
  runPlugins,
  resolvePlugins,
  buildApprovalLock,
  type PluginOutput,
  type PluginRunResult,
  type ResolvedPlugin,
} from './plugins/host.js';

// AI-assisted operations (require an injected LlmClient)
export type { LlmClient, LlmCompleteOptions } from './llm.js';
export {
  review,
  type ReviewOptions,
  type ReviewResult,
  type ReviewFinding,
} from './operations/review.js';
export {
  architect,
  type ArchitectOptions,
  type ArchitectResult,
} from './operations/architect.js';

/** A summary of what this engine build supports. */
export interface EngineInfo {
  /** Protocol version this engine implements. */
  readonly protocolVersion: string;
  /** Ids of the built-in adapters. */
  readonly adapters: string[];
}

/**
 * Describe this engine build.
 *
 * @returns The supported protocol version and the built-in adapter ids.
 */
export function engineInfo(): EngineInfo {
  return {
    protocolVersion: PROTOCOL_VERSION,
    adapters: defaultRegistry.all().map((a) => a.id),
  };
}
