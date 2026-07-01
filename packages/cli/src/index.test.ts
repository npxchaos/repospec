import { describe, expect, it } from 'vitest';
import { createProgram } from './index.js';

describe('createProgram', () => {
  it('registers all implemented commands', () => {
    const names = createProgram()
      .commands.map((c) => c.name())
      .sort();
    for (const name of [
      'init',
      'bootstrap',
      'doctor',
      'sync',
      'generate',
      'upgrade',
      'review',
      'architect',
      'plugins',
    ]) {
      expect(names).toContain(name);
    }
  });

  it('reports a version that includes the protocol version', () => {
    expect(createProgram().version()).toContain('protocol 0.1');
  });
});
