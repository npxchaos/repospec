/**
 * A minimal, injectable filesystem port.
 *
 * The protocol and engine never touch `node:fs` directly — they operate on this
 * interface so the same logic runs against a real disk, an in-memory tree (for
 * tests), or any other backing store. All paths are absolute or
 * caller-resolved; implementations do not assume a working directory.
 */
export interface RepospecFileSystem {
  /** Read a UTF-8 file. Rejects if it does not exist. */
  readFile(path: string): Promise<string>;
  /** Write a UTF-8 file, creating parent directories as needed. */
  writeFile(path: string, contents: string): Promise<void>;
  /** Report whether a path exists (file or directory). */
  exists(path: string): Promise<boolean>;
  /** List the entry names (not full paths) directly within a directory. */
  readdir(path: string): Promise<string[]>;
  /** Create a directory, including parents. A no-op if it already exists. */
  mkdir(path: string): Promise<void>;
}
