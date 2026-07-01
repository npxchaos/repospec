import Anthropic from '@anthropic-ai/sdk';
import type { LlmClient } from '@repospec/engine';

const DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * A {@link LlmClient} backed by Claude via the Anthropic SDK. Credentials are
 * resolved by the SDK (ANTHROPIC_API_KEY, or an `ant auth login` profile); the
 * model can be overridden with REPOSPEC_MODEL. Auth failures surface at call
 * time and are translated to actionable messages by the command layer.
 */
export function createLlmClient(): LlmClient {
  const client = new Anthropic();
  const model = process.env.REPOSPEC_MODEL ?? DEFAULT_MODEL;

  return {
    async complete({ system, prompt }) {
      const response = await client.messages.create({
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        ...(system ? { system } : {}),
        messages: [{ role: 'user', content: prompt }],
      });
      return response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();
    },
  };
}

/** Map an SDK auth error to a short, actionable message; else rethrow. */
export function describeLlmError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'Claude authentication failed. Set ANTHROPIC_API_KEY or run `ant auth login`.';
  }
  if (err instanceof Anthropic.APIError) {
    return `Claude API error (${err.status ?? '?'}): ${err.message}`;
  }
  return (err as Error).message;
}
