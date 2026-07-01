import { basename, join } from 'node:path';
import type { RepospecFileSystem } from '@repospec/protocol';
import { buildProject, type InitInput } from '../project.js';
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
  /**
   * Seed the prose documents (`architecture.md`, `constitution.md`,
   * `workflow.md`) from the repository's existing docs (e.g. `ARCHITECTURE.md`)
   * instead of the generic template. Offline; local files only. Default `true`.
   */
  importDocs?: boolean;
}

/**
 * A prose seed file mapped to the repository docs it can be harvested from,
 * in priority order. The first existing, non-empty source wins.
 */
interface ProseSource {
  /** Which `project.documents` entry this fills. */
  key: 'architecture' | 'constitution' | 'workflow';
  /** Title used in the generated `# <title> — <name>` heading. */
  title: string;
  /** Candidate repo-relative source paths, most specific first. */
  sources: string[];
}

const PROSE_SOURCES: ProseSource[] = [
  {
    key: 'architecture',
    title: 'Architecture',
    sources: [
      'ARCHITECTURE.md',
      'ARCHITECTURE.markdown',
      'docs/architecture.md',
      'docs/architecture/README.md',
      'docs/architecture/overview.md',
      'docs/ARCHITECTURE.md',
    ],
  },
  {
    key: 'constitution',
    title: 'Constitution',
    sources: [
      'CONSTITUTION.md',
      'PRINCIPLES.md',
      'ENGINEERING.md',
      'docs/constitution.md',
      'docs/principles.md',
      'docs/engineering-principles.md',
      'ACTION_PLAN.md',
      'PLAN.md',
    ],
  },
  {
    key: 'workflow',
    title: 'Workflow',
    sources: [
      'WORKFLOW.md',
      'docs/workflow.md',
      'docs/development.md',
      'DEVELOPMENT.md',
      'CONTRIBUTING.md',
      'docs/contributing.md',
    ],
  },
];

/** Strip a leading YAML frontmatter block and/or first H1 from a doc body. */
function stripLeadingHeading(body: string): string {
  let text = body.replace(/^\uFEFF/, '');
  // Leading YAML frontmatter.
  const fm = /^---\n[\s\S]*?\n---\n?/.exec(text);
  if (fm) text = text.slice(fm[0].length);
  // First ATX H1.
  text = text.replace(/^\s*# .*(?:\r?\n|$)/, '');
  return text.trim();
}

/**
 * Seed the prose documents from a repository's existing docs. Offline: reads
 * only local files. For each prose target, the first existing, non-empty
 * candidate is imported verbatim under a provenance note — turning a real
 * `ARCHITECTURE.md` into `.repospec/architecture.md` rather than a blank
 * template. The result is a draft the human owns and edits.
 *
 * @param fs - The repository filesystem.
 * @param cwd - The repository root.
 * @param input - The inferred project answers (for the project name + doc paths).
 * @returns Overrides keyed by `.repospec/`-relative path, plus evidence.
 */
export async function harvestProse(
  fs: RepospecFileSystem,
  cwd: string,
  input: InitInput,
): Promise<{ overrides: Record<string, string>; evidence: string[] }> {
  const project = buildProject(input);
  const overrides: Record<string, string> = {};
  const evidence: string[] = [];

  for (const spec of PROSE_SOURCES) {
    for (const rel of spec.sources) {
      let raw: string;
      try {
        if (!(await fs.exists(join(cwd, rel)))) continue;
        raw = await fs.readFile(join(cwd, rel));
      } catch {
        continue;
      }
      const body = stripLeadingHeading(raw);
      if (!body) continue;
      const target = project.documents[spec.key];
      overrides[target] = [
        `# ${spec.title} — ${project.project.name}`,
        '',
        `> Imported by \`repospec bootstrap\` from \`${rel}\`. A starting point —`,
        '> review, trim, and keep it current. You own this file.',
        '',
        body,
        '',
      ].join('\n');
      evidence.push(`${target} seeded from ${rel}`);
      break;
    }
  }

  return { overrides, evidence };
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

  let seedOverrides = options.seedOverrides;
  if (options.importDocs ?? true) {
    const harvest = await harvestProse(fs, cwd, finalInput);
    if (Object.keys(harvest.overrides).length > 0) {
      seedOverrides = { ...harvest.overrides, ...options.seedOverrides };
      finalEvidence.push(...harvest.evidence);
    }
  }

  const plan = await planInit(fs, finalInput, { ...options, seedOverrides });
  return { ...plan, evidence: finalEvidence };
}
