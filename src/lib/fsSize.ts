import { run } from "./exec.js";

/**
 * Sizes for many directories in a single `du` invocation. Spawning one `du`
 * process per item (as a naive Promise.all over N items would) costs ~250
 * process spawns during a full scan and was measured at 16s+ wall time;
 * batching into one call per source keeps the whole scan under a second.
 */
export async function dirSizesBytes(paths: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (paths.length === 0) return map;
  const res = await run("/usr/bin/du", ["-sk", ...paths], { timeoutMs: 30_000 });
  if (!res.ok && !res.stdout) return map;
  for (const line of res.stdout.split("\n")) {
    const m = /^(\d+)\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    map.set(m[2], parseInt(m[1], 10) * 1024);
  }
  return map;
}

/** Single-directory convenience wrapper around dirSizesBytes. */
export async function dirSizeBytes(path: string): Promise<number | undefined> {
  const map = await dirSizesBytes([path]);
  return map.get(path);
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let val = bytes / 1024;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}
