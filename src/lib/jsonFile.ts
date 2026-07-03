import { promises as fs } from "node:fs";

export async function readJsonIfExists<T = unknown>(path: string): Promise<T | undefined> {
  try {
    const raw = await fs.readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Writes JSON back with a timestamped .bak copy of the original alongside it,
 * so a bad MCP-server edit to ~/.claude.json or ~/.cursor/mcp.json can be
 * restored by hand.
 */
export async function writeJsonWithBackup(path: string, data: unknown): Promise<void> {
  const original = await fs.readFile(path, "utf8").catch(() => undefined);
  if (original !== undefined) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.writeFile(`${path}.bak-${stamp}`, original, "utf8");
  }
  await fs.writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}
