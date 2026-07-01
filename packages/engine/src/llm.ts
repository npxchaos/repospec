/**
 * A minimal, injectable large-language-model port. The engine's AI-assisted
 * operations (`review`, `architect`) depend only on this interface, never on a
 * concrete provider — keeping the engine UI- and vendor-agnostic (ADR-0007) and
 * unit-testable with a fake. The CLI supplies a real implementation (Claude via
 * `@anthropic-ai/sdk`).
 */
export interface LlmCompleteOptions {
  /** Optional system prompt establishing the role and rules. */
  system?: string;
  /** The user prompt. */
  prompt: string;
}

/** A text-in, text-out completion client. */
export interface LlmClient {
  /**
   * Produce a completion for a prompt.
   *
   * @param options - The system + user prompt.
   * @returns The model's text response.
   */
  complete(options: LlmCompleteOptions): Promise<string>;
}
