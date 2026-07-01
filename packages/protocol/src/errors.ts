import type { ZodError } from 'zod';

/**
 * A validation failure with human-first, path-prefixed messages.
 *
 * The protocol requires errors to read as `path: expectation`, not as raw
 * schema dumps (see `spec/configuration.md` §5).
 */
export class RepospecValidationError extends Error {
  /** One human-readable message per problem found. */
  readonly issues: string[];

  /**
   * @param message - A short summary of what failed.
   * @param issues - Individual, path-prefixed problem descriptions.
   */
  constructor(message: string, issues: string[]) {
    super(
      issues.length > 0 ? `${message}\n  - ${issues.join('\n  - ')}` : message,
    );
    this.name = 'RepospecValidationError';
    this.issues = issues;
  }
}

/**
 * Convert a {@link ZodError} into human-first, path-prefixed messages.
 *
 * @param error - The error produced by a failed schema parse.
 * @returns One message per issue, e.g. `project.type: Invalid enum value`.
 */
export function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.') || '(root)';
    return `${path}: ${issue.message}`;
  });
}
