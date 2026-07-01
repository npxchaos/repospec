/**
 * `@repospec/cli` — the `repospec` command-line front-end to the engine.
 *
 * The only package aware of a terminal. It maps commands to engine operations
 * and renders results; it contains no business logic (ADR-0007).
 *
 * @packageDocumentation
 */

import { Command } from 'commander';
import { engineInfo } from '@repospec/engine';
import { registerInit } from './commands/init.js';
import { registerMaintenance } from './commands/maintenance.js';
import { registerStubs } from './commands/stubs.js';

const CLI_VERSION = '0.0.0';

/**
 * Build the `repospec` command tree.
 *
 * @returns A configured commander program.
 */
export function createProgram(): Command {
  const program = new Command();
  program
    .name('repospec')
    .description(
      'Repospec — a repository-first protocol for AI-assisted software engineering.',
    )
    .version(
      `${CLI_VERSION} (protocol ${engineInfo().protocolVersion})`,
      '-v, --version',
    );

  registerInit(program);
  registerMaintenance(program);
  registerStubs(program);

  return program;
}

/**
 * Parse arguments and run the CLI.
 *
 * @param argv - Process argv (defaults to `process.argv`).
 * @returns The resulting process exit code.
 */
export async function run(argv: string[] = process.argv): Promise<number> {
  const program = createProgram();
  await program.parseAsync(argv);
  return typeof process.exitCode === 'number' ? process.exitCode : 0;
}
