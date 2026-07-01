import type { DoctorIssue } from '@repospec/engine';

/** Print an informational line. */
export function info(message: string): void {
  console.log(message);
}

/** Print a warning line to stderr. */
export function warn(message: string): void {
  console.warn(`! ${message}`);
}

/** Print an error line to stderr. */
export function error(message: string): void {
  console.error(`✖ ${message}`);
}

/** Format a doctor issue for display. */
export function formatIssue(issue: DoctorIssue): string {
  const mark = issue.level === 'error' ? '✖' : '!';
  return `  ${mark} ${issue.message}`;
}
