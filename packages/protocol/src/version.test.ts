import { describe, expect, it } from 'vitest';
import {
  compareProtocolVersions,
  parseProtocolVersion,
  supports,
  PROTOCOL_VERSION,
} from './version.js';

describe('protocol version helpers', () => {
  it('supports its own version exactly', () => {
    expect(supports(PROTOCOL_VERSION)).toBe(true);
    expect(supports('9.9')).toBe(false);
  });

  it('parses MAJOR.MINOR', () => {
    expect(parseProtocolVersion('1.4')).toEqual({ major: 1, minor: 4 });
    expect(() => parseProtocolVersion('1')).toThrow();
    expect(() => parseProtocolVersion('x.y')).toThrow();
  });

  it('orders versions by major then minor', () => {
    expect(compareProtocolVersions('0.1', '0.1')).toBe(0);
    expect(compareProtocolVersions('0.1', '0.2')).toBe(-1);
    expect(compareProtocolVersions('1.0', '0.9')).toBe(1);
  });
});
