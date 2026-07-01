import { describe, expect, it } from 'vitest';
import { checksum, isModified, parseManaged, wrapManaged } from './managed.js';

const V = '0.1';

describe('managed header', () => {
  it('round-trips a plain body (classic header-first)', () => {
    const body = '# Guide\n\nHello.\n';
    const file = wrapManaged(body, V);
    expect(file.startsWith('<!-- @repospec-generated')).toBe(true);
    const parsed = parseManaged(file);
    expect(parsed?.body).toBe(body);
    expect(parsed && isModified(parsed)).toBe(false);
  });

  it('keeps YAML frontmatter first and places the header after it', () => {
    const body = '---\nname: "reviewer"\n---\n\nSystem prompt here.\n';
    const file = wrapManaged(body, V);
    // Frontmatter must be line 1 for tools that require it.
    expect(file.startsWith('---\n')).toBe(true);
    expect(file).toContain('<!-- @repospec-generated');
    // Header sits after the closing '---'.
    expect(file.indexOf('---\n---')).toBe(-1);
  });

  it('round-trips a frontmatter body without false-positive drift', () => {
    const body = '---\nname: "reviewer"\n---\n\nSystem prompt here.\n';
    const file = wrapManaged(body, V);
    const parsed = parseManaged(file);
    expect(parsed?.body).toBe(body);
    expect(parsed?.checksum).toBe(checksum(body));
    expect(parsed && isModified(parsed)).toBe(false);
  });

  it('detects a hand edit inside a frontmatter body', () => {
    const body = '---\nname: "reviewer"\n---\n\nOriginal.\n';
    const file = wrapManaged(body, V).replace('Original.', 'Tampered.');
    const parsed = parseManaged(file);
    expect(parsed && isModified(parsed)).toBe(true);
  });
});
