import { describe, expect, it } from 'vitest';
import { createProgram } from './index.js';

describe('createProgram', () => {
  it('registers the implemented and planned commands', () => {
    const names = createProgram()
      .commands.map((c) => c.name())
      .sort();
    expect(names).toContain('init');
    expect(names).toContain('bootstrap');
    expect(names).toContain('doctor');
    expect(names).toContain('sync');
    expect(names).toContain('generate');
    expect(names).toContain('upgrade');
  });

  it('reports a version that includes the protocol version', () => {
    expect(createProgram().version()).toContain('protocol 0.1');
  });
});
