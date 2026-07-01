import { describe, expect, it } from 'vitest';
import { MemoryFileSystem } from '../fs/memory.js';
import type { InitInput } from '../project.js';
import type { LlmClient, LlmCompleteOptions } from '../llm.js';
import { init } from './init.js';
import { review } from './review.js';
import { architect } from './architect.js';

const ROOT = '/repo';
const ANSWERS: InitInput = {
  name: 'acme',
  description: 'A test project.',
  type: 'service',
  languages: ['typescript'],
  adapters: ['claude'],
};

/** A fake LlmClient that records its calls and returns a canned reply. */
function fakeLlm(reply: string): {
  client: LlmClient;
  calls: LlmCompleteOptions[];
} {
  const calls: LlmCompleteOptions[] = [];
  return {
    calls,
    client: {
      async complete(options) {
        calls.push(options);
        return reply;
      },
    },
  };
}

async function freshRepo(): Promise<MemoryFileSystem> {
  const fs = new MemoryFileSystem();
  await init(fs, ANSWERS, { cwd: ROOT });
  return fs;
}

describe('review', () => {
  it('parses findings from a fenced JSON response and grounds on the constitution', async () => {
    const fs = await freshRepo();
    const { client, calls } = fakeLlm(
      'Here is my review:\n```json\n{"findings":[{"severity":"error","file":"a.ts","line":3,"message":"Untested billing math"}]}\n```',
    );
    const result = await review(fs, client, {
      cwd: ROOT,
      diff: 'diff --git ...',
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({
      severity: 'error',
      file: 'a.ts',
      line: 3,
    });
    // The governing context is passed to the model.
    expect(calls[0]?.system).toContain('Constitution');
    expect(calls[0]?.prompt).toContain('diff --git');
  });

  it('returns no findings when the model responds with an empty array', async () => {
    const fs = await freshRepo();
    const { client } = fakeLlm('{"findings":[]}');
    const result = await review(fs, client, { cwd: ROOT, diff: 'x' });
    expect(result.findings).toEqual([]);
  });

  it('tolerates a non-JSON response without throwing', async () => {
    const fs = await freshRepo();
    const { client } = fakeLlm('I could not produce JSON.');
    const result = await review(fs, client, { cwd: ROOT, diff: 'x' });
    expect(result.findings).toEqual([]);
  });

  it('errors cleanly when there is no repository', async () => {
    const { client } = fakeLlm('{"findings":[]}');
    const result = await review(new MemoryFileSystem(), client, {
      cwd: ROOT,
      diff: 'x',
    });
    expect(result.root).toBeNull();
    expect(result.findings[0]?.severity).toBe('error');
  });
});

describe('architect', () => {
  it('returns the drafted document and its target path', async () => {
    const fs = await freshRepo();
    const { client, calls } = fakeLlm('# Architecture — acme\n\nThe design.');
    const result = await architect(fs, client, {
      cwd: ROOT,
      request: 'Describe the metering pipeline.',
    });

    expect(result.draft).toContain('# Architecture — acme');
    expect(result.path).toBe(`${ROOT}/.repospec/architecture.md`);
    expect(calls[0]?.prompt).toContain('metering pipeline');
    // Drafting does not write the file.
    const onDisk = await fs.readFile(`${ROOT}/.repospec/architecture.md`);
    expect(onDisk).not.toContain('The design.');
  });
});
