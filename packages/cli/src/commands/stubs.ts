import type { Command } from 'commander';
import { info } from '../ui.js';

/** Commands defined by the spec/roadmap but not yet implemented. */
const PLANNED: { name: string; description: string; milestone: string }[] = [
  {
    name: 'upgrade',
    description: 'Migrate .repospec/ to a newer protocol version',
    milestone: '5',
  },
  {
    name: 'review',
    description: 'Review a change against the protocol',
    milestone: 'later',
  },
  {
    name: 'bootstrap',
    description: 'Infer a draft .repospec/ from an existing repo',
    milestone: '7',
  },
  {
    name: 'architect',
    description: 'AI-assisted architecture drafting',
    milestone: '7',
  },
];

/** Register placeholder commands so `repospec --help` advertises the roadmap. */
export function registerStubs(program: Command): void {
  for (const cmd of PLANNED) {
    program
      .command(cmd.name)
      .description(`${cmd.description} (planned — Milestone ${cmd.milestone})`)
      .action(() => {
        info(
          `\`repospec ${cmd.name}\` is planned for Milestone ${cmd.milestone} and is not implemented yet.`,
        );
        process.exitCode = 1;
      });
  }
}
