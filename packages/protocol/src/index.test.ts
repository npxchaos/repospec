import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, supports } from './index.js';

describe('protocol version', () => {
  it('declares a MAJOR.MINOR version', () => {
    expect(PROTOCOL_VERSION).toMatch(/^\d+\.\d+$/);
  });

  it('supports its own version', () => {
    expect(supports(PROTOCOL_VERSION)).toBe(true);
  });

  it('rejects an unknown version', () => {
    expect(supports('999.0')).toBe(false);
  });
});
