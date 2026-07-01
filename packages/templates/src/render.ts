/**
 * Template rendering primitives: `{{ dotted.path }}` variable interpolation and
 * a small set of reusable partials. The built-in seed content uses these so
 * templates stay DRY, and they are exported so future user-authored templates
 * share one substitution engine (roadmap Milestone 4).
 */

/** Reusable snippets shared across seed documents. */
export const partials = {
  /** The notice at the top of every seeded, human-owned document. */
  seededNote:
    '> Seeded by `repospec init`. Replace the placeholders below with the real shape of\n' +
    '> this project, then keep it current as the project evolves.',
} as const;

/**
 * Substitute `{{ path }}` placeholders in a template with values from `vars`,
 * resolving dotted paths (e.g. `{{ project.name }}`). Whitespace inside the
 * braces is ignored.
 *
 * @param template - The template string.
 * @param vars - The variable tree to resolve paths against.
 * @returns The rendered string.
 * @throws {Error} If a referenced variable is missing or nullish — a silent
 *   blank in a generated document is worse than a loud failure.
 */
export function interpolate(
  template: string,
  vars: Record<string, unknown>,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = path
      .split('.')
      .reduce<unknown>(
        (acc, key) =>
          acc && typeof acc === 'object'
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        vars,
      );
    if (value === undefined || value === null) {
      throw new Error(`Unknown template variable: {{${path}}}`);
    }
    return String(value);
  });
}
