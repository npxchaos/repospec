import type { Adapter } from './types.js';
import { builtinAdapters } from './builtin.js';

/** A lookup of adapters by id, seeded with the built-ins. */
export class AdapterRegistry {
  private readonly adapters = new Map<string, Adapter>();

  constructor(adapters: Adapter[] = builtinAdapters) {
    for (const adapter of adapters) this.register(adapter);
  }

  /** Register (or replace) an adapter. */
  register(adapter: Adapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /** Get an adapter by id, or `undefined` if unknown. */
  get(id: string): Adapter | undefined {
    return this.adapters.get(id);
  }

  /** Whether an adapter id is known. */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /** All registered adapters. */
  all(): Adapter[] {
    return [...this.adapters.values()];
  }
}

/** The default registry, containing the engine's built-in adapters. */
export const defaultRegistry = new AdapterRegistry();
