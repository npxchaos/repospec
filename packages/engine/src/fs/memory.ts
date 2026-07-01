import type { RepospecFileSystem } from '@repospec/protocol';

function normalize(path: string): string {
  const collapsed = path.replace(/\/+/g, '/');
  return collapsed.length > 1 ? collapsed.replace(/\/$/, '') : collapsed;
}

/**
 * An in-memory {@link RepospecFileSystem} for tests. Directories are implied by the
 * files they contain; {@link MemoryFileSystem.mkdir} is a no-op.
 */
export class MemoryFileSystem implements RepospecFileSystem {
  private readonly files = new Map<string, string>();

  /** Seed the store with initial files. */
  constructor(initial: Record<string, string> = {}) {
    for (const [path, contents] of Object.entries(initial)) {
      this.files.set(normalize(path), contents);
    }
  }

  async readFile(path: string): Promise<string> {
    const contents = this.files.get(normalize(path));
    if (contents === undefined) {
      throw new Error(`ENOENT: no such file: ${path}`);
    }
    return contents;
  }

  async writeFile(path: string, contents: string): Promise<void> {
    this.files.set(normalize(path), contents);
  }

  async exists(path: string): Promise<boolean> {
    const p = normalize(path);
    if (this.files.has(p)) return true;
    const prefix = `${p}/`;
    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) return true;
    }
    return false;
  }

  async readdir(path: string): Promise<string[]> {
    const prefix = `${normalize(path)}/`;
    const entries = new Set<string>();
    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) {
        const segment = key.slice(prefix.length).split('/')[0];
        if (segment) entries.add(segment);
      }
    }
    return [...entries].sort();
  }

  async mkdir(): Promise<void> {
    // Directories are implied by their files.
  }

  /** Return a sorted snapshot of all files, for assertions. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(
      [...this.files.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  /** List all file paths currently stored. */
  paths(): string[] {
    return [...this.files.keys()].sort();
  }
}
