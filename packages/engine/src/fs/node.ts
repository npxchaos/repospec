import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RepospecFileSystem } from '@repospec/protocol';

/** A {@link RepospecFileSystem} backed by the real Node.js filesystem. */
export class NodeFileSystem implements RepospecFileSystem {
  readFile(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  async writeFile(path: string, contents: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, 'utf8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  readdir(path: string): Promise<string[]> {
    return readdir(path);
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }
}
