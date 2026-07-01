import { describe, expect, it } from 'vitest';
import { engineInfo } from './index.js';

describe('engineInfo', () => {
  it('reports the supported protocol version', () => {
    expect(engineInfo().protocolVersion).toBe('0.1');
  });

  it('lists the built-in adapters', () => {
    expect(engineInfo().adapters).toContain('claude');
  });
});
