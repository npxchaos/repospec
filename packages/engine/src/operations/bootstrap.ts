import { basename, join } from 'node:path';
import type { RepospecFileSystem } from '@repospec/protocol';
import type { InitInput } from '../project.js';
import type { LlmClient } from '../llm.js';
import { planInit, type InitOptions, type InitPlan } from './init.js';

/** The result of inferring init answers from an existing repository. */
export interface BootstrapInference {
  /** The inferred interview answers, ready for {@link planInit}. */
  input: InitInput;
  /** Human-readable notes on what was detected and from where. */
  evidence: string[];
}

/** A planned bootstrap: an {@link InitPlan} plus the inference evidence. */
export interface BootstrapPlan extends InitPlan {
  /** What the inference detected, for the human review step. */
  evidence: string[];
}

/** Options for {@link planBootstrap}. */
export interface BootstrapOptions extends InitOptions {
  /**
   * Opt-in AI assist. When provided, the detected facts (metadata only — no
   * source code) are sent to the model to refine the project description
   * (`spec/lifecycle.md` §2.6). The result is still a draft for human approval.
   */
  llm?: LlmClient;
}

/**
 * Ask the model for a one-sentence description from the detected facts. Only the
 * inferred name and the human-readable evidence are sent — never file contents.
 */
async function refineDescription(
  input: InitInput,
  evidence: string[],
  llm: LlmClient,
): Promise<string> {
  const system =
    'You write one-sentence descriptions of software projects. Given detected ' +
    'facts about a repository, output ONE concise sentence describing what the ' +
    'project is. Output only the sentence, no preamble.';
  const prompt = [
    `Project name: ${input.name}`,
    `Current description: ${input.description}`,
    'Detected facts:',
    ...evidence.map((e) => `- ${e}`),
  ].join('\n');
  const reply = await llm.complete({ system, prompt });
  return reply.trim().split('\n')[0]?.trim() ?? '';
}

interface PackageJson {
  name?: string;
  description?: string;
  bin?: unknown;
  main?: unknown;
  exports?: unknown;
  private?: boolean;
  workspaces?: unknown;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

async function readJson(
  fs: RepospecFileSystem,
  path: string,
): Promise<PackageJson | null> {
  try {
    return JSON.parse(await fs.readFile(path)) as PackageJson;
  } catch {
    return null;
  }
}

// Dependency name -> framework label.
const FRAMEWORKS: Record<string, string> = {
  next: 'nextjs',
  react: 'react',
  vue: 'vue',
  svelte: 'svelte',
  '@angular/core': 'angular',
  '@nestjs/core': 'nestjs',
  express: 'express',
  fastify: 'fastify',
  koa: 'koa',
  '@remix-run/react': 'remix',
  astro: 'astro',
  'solid-js': 'solid',
};

// Dependency name -> testing tool label.
const TESTING: Record<string, string> = {
  vitest: 'vitest',
  jest: 'jest',
  mocha: 'mocha',
  ava: 'ava',
  '@playwright/test': 'playwright',
  cypress: 'cypress',
  jasmine: 'jasmine',
};

// Frameworks that imply a user-facing application.
const APP_FRAMEWORKS = new Set([
  'nextjs',
  'react',
  'vue',
  'svelte',
  'angular',
  'remix',
  'astro',
  'solid',
]);

/**
 * Infer {@link InitInput} from an existing repository using offline heuristics
 * only — manifest files, lockfiles, and dependency lists. No network, no AI
 * (`spec/lifecycle.md` §2.6). The result is a *draft* for human review.
 *
 * @param fs - The repository filesystem.
 * @param cwd - The repository root.
 * @returns The inferred answers plus evidence describing each detection.
 */
export async function inferProjectInput(
  fs: RepospecFileSystem,
  cwd: string,
): Promise<BootstrapInference> {
  const evidence: string[] = [];
  const pkg = await readJson(fs, join(cwd, 'package.json'));

  const deps = new Set<string>([
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.devDependencies ?? {}),
    ...Object.keys(pkg?.peerDependencies ?? {}),
  ]);
  const has = (path: string) => fs.exists(join(cwd, path));

  // --- name / description ------------------------------------------------
  const name = pkg?.name?.replace(/^@[^/]+\//, '') ?? basename(cwd);
  evidence.push(
    pkg?.name
      ? `name "${name}" from package.json`
      : `name "${name}" from directory`,
  );

  // --- languages ---------------------------------------------------------
  const languages: string[] = [];
  const addLang = (lang: string, why: string) => {
    if (!languages.includes(lang)) {
      languages.push(lang);
      evidence.push(`language ${lang} (${why})`);
    }
  };
  if (await has('tsconfig.json')) addLang('typescript', 'tsconfig.json');
  else if (pkg) addLang('javascript', 'package.json');
  if (await has('go.mod')) addLang('go', 'go.mod');
  if (await has('Cargo.toml')) addLang('rust', 'Cargo.toml');
  if (
    (await has('pyproject.toml')) ||
    (await has('requirements.txt')) ||
    (await has('setup.py'))
  )
    addLang('python', 'python manifest');
  if ((await has('pom.xml')) || (await has('build.gradle')))
    addLang('java', 'jvm build file');
  if (await has('Gemfile')) addLang('ruby', 'Gemfile');
  if (await has('composer.json')) addLang('php', 'composer.json');
  if (languages.length === 0) {
    languages.push('typescript');
    evidence.push('language typescript (default — nothing detected)');
  }

  // --- package manager ---------------------------------------------------
  let packageManager: string | undefined;
  const pmByLock: [string, string][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
    ['bun.lockb', 'bun'],
  ];
  for (const [lock, pm] of pmByLock) {
    if (await has(lock)) {
      packageManager = pm;
      evidence.push(`packageManager ${pm} (${lock})`);
      break;
    }
  }

  // --- runtimes ----------------------------------------------------------
  const runtimes: string[] = [];
  if (pkg) {
    const nodeMajor = /(\d+)/.exec(pkg.engines?.node ?? '')?.[1];
    const runtime = nodeMajor ? `node${nodeMajor}` : 'node';
    runtimes.push(runtime);
    evidence.push(
      nodeMajor
        ? `runtime ${runtime} (package.json engines.node)`
        : 'runtime node (package.json)',
    );
  }

  // --- frameworks / testing ---------------------------------------------
  const frameworks: string[] = [];
  for (const [dep, label] of Object.entries(FRAMEWORKS)) {
    if (deps.has(dep) && !frameworks.includes(label)) {
      frameworks.push(label);
      evidence.push(`framework ${label} (${dep})`);
    }
  }
  const testing: string[] = [];
  for (const [dep, label] of Object.entries(TESTING)) {
    if (deps.has(dep) && !testing.includes(label)) {
      testing.push(label);
      evidence.push(`testing ${label} (${dep})`);
    }
  }

  // --- conventions -------------------------------------------------------
  let formatter: string | undefined;
  if (deps.has('prettier') || (await has('.prettierrc'))) {
    formatter = 'prettier';
    evidence.push('formatter prettier');
  }
  let linter: string | undefined;
  if (
    deps.has('eslint') ||
    (await has('eslint.config.js')) ||
    (await has('.eslintrc.json'))
  ) {
    linter = 'eslint';
    evidence.push('linter eslint');
  }

  // --- type --------------------------------------------------------------
  let type: InitInput['type'];
  if (pkg?.bin) {
    type = 'cli';
  } else if (frameworks.some((f) => APP_FRAMEWORKS.has(f))) {
    type = 'application';
  } else if (pkg?.workspaces || (await has('pnpm-workspace.yaml'))) {
    type = 'monorepo';
  } else if (pkg && (pkg.main || pkg.exports) && pkg.private !== true) {
    type = 'library';
  } else {
    type = 'service';
  }
  evidence.push(`type ${type} (inferred)`);

  const input: InitInput = {
    name,
    description: pkg?.description ?? `A ${type} project.`,
    type,
    languages,
    ...(runtimes.length ? { runtimes } : {}),
    ...(packageManager ? { packageManager } : {}),
    ...(frameworks.length ? { frameworks } : {}),
    ...(testing.length ? { testing } : {}),
    ...(formatter ? { formatter } : {}),
    ...(linter ? { linter } : {}),
    repository: undefined,
    adapters: ['agents', 'claude'],
  };

  return { input, evidence };
}

/**
 * Plan a `repospec bootstrap`: infer a draft `.repospec/` from the existing repo,
 * then produce the same file plan `repospec init` would. Nothing is written —
 * the caller presents the plan for approval (human decisions win).
 *
 * @param fs - The repository filesystem.
 * @param options - Init options plus an optional {@link LlmClient} for
 *   AI-assisted refinement (opt-in; `spec/lifecycle.md` §2.6).
 * @returns The planned writes plus the inference evidence.
 */
export async function planBootstrap(
  fs: RepospecFileSystem,
  options: BootstrapOptions = {},
): Promise<BootstrapPlan> {
  const cwd = options.cwd ?? process.cwd();
  const { input, evidence } = await inferProjectInput(fs, cwd);

  let finalInput = input;
  const finalEvidence = [...evidence];
  if (options.llm) {
    const description = await refineDescription(input, evidence, options.llm);
    if (description && description !== input.description) {
      finalInput = { ...input, description };
      finalEvidence.push('description refined by AI (opt-in)');
    }
  }

  const plan = await planInit(fs, finalInput, options);
  return { ...plan, evidence: finalEvidence };
}
