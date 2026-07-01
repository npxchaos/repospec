import { join } from 'node:path';
import {
  REPOSPEC_DIR,
  readRepospec,
  type RepospecFileSystem,
} from '@repospec/protocol';
import { findRepoRoot } from '../locate.js';
import type { LlmClient } from '../llm.js';

/** A single issue raised by an AI review. */
export interface ReviewFinding {
  severity: 'error' | 'warning' | 'info';
  file?: string;
  line?: number;
  message: string;
}

/** The result of `review`. */
export interface ReviewResult {
  root: string | null;
  findings: ReviewFinding[];
  /** The raw model response, for debugging when parsing yields nothing. */
  raw: string;
}

/** Options for {@link review}. */
export interface ReviewOptions {
  cwd?: string;
  /** The unified diff (or change description) to review. */
  diff: string;
}

const SEVERITIES = new Set(['error', 'warning', 'info']);

/** Pull the first JSON object out of a possibly fenced/prose-wrapped response. */
function extractJson(text: string): string | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  if (!candidate) return null;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return candidate.slice(start, end + 1);
}

/** Parse and sanitize the model's findings, tolerating extra prose. */
function parseFindings(text: string): ReviewFinding[] {
  const json = extractJson(text);
  if (!json) return [];
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  const raw = (data as { findings?: unknown }).findings;
  if (!Array.isArray(raw)) return [];
  const findings: ReviewFinding[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const f = item as Record<string, unknown>;
    const severity =
      typeof f.severity === 'string' && SEVERITIES.has(f.severity)
        ? (f.severity as ReviewFinding['severity'])
        : 'warning';
    const message = typeof f.message === 'string' ? f.message.trim() : '';
    if (!message) continue;
    findings.push({
      severity,
      message,
      ...(typeof f.file === 'string' ? { file: f.file } : {}),
      ...(typeof f.line === 'number' ? { line: f.line } : {}),
    });
  }
  return findings;
}

async function readIfExists(
  fs: RepospecFileSystem,
  path: string,
): Promise<string | null> {
  return (await fs.exists(path)) ? fs.readFile(path) : null;
}

/**
 * Review a change against the repository's protocol using an LLM. Gathers the
 * constitution and rules as the governing context, asks the model to judge the
 * diff against them, and returns structured findings. Pure aside from the
 * injected filesystem and {@link LlmClient} — no terminal, no provider lock-in.
 *
 * @param fs - The repository filesystem.
 * @param llm - The completion client.
 * @param options - cwd and the diff to review.
 * @returns The findings plus the raw model response.
 */
export async function review(
  fs: RepospecFileSystem,
  llm: LlmClient,
  options: ReviewOptions,
): Promise<ReviewResult> {
  const cwd = options.cwd ?? process.cwd();
  const root = await findRepoRoot(fs, cwd);
  if (!root) {
    return {
      root: null,
      findings: [
        {
          severity: 'error',
          message: 'No .repospec/ directory found. Run `repospec init`.',
        },
      ],
      raw: '',
    };
  }

  const repospecDir = join(root, REPOSPEC_DIR);
  const repo = await readRepospec(fs, repospecDir);

  const constitution = await readIfExists(
    fs,
    join(repospecDir, repo.project.documents.constitution),
  );
  const ruleTexts: string[] = [];
  for (const rule of repo.rules) {
    const body = await readIfExists(
      fs,
      join(repospecDir, repo.project.rules.dir, `${rule.meta.id}.md`),
    );
    if (body) ruleTexts.push(body);
  }

  const system = [
    'You are the reviewer for a repository governed by the Repospec protocol.',
    'Judge the change ONLY against the constitution and rules below. Do not',
    'invent rules. Map each finding to a specific rule or constitution point.',
    '',
    '## Constitution',
    constitution ?? '(none)',
    '',
    '## Rules',
    ruleTexts.length ? ruleTexts.join('\n\n---\n\n') : '(none)',
  ].join('\n');

  const prompt = [
    'Review this change. Respond with ONLY a JSON object of the form:',
    '{"findings":[{"severity":"error|warning|info","file":"path",',
    '"line":123,"message":"what and which rule"}]}',
    'Use "error" for a rule/constitution violation, "warning" for a likely',
    'problem, "info" for a suggestion. Return an empty findings array if the',
    'change is clean. Omit file/line if not applicable.',
    '',
    '## Diff',
    options.diff.trim() || '(empty diff)',
  ].join('\n');

  const raw = await llm.complete({ system, prompt });
  return { root, findings: parseFindings(raw), raw };
}
