import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Locates this package's own package.json by walking up from the current
 * module's location. Written this way (rather than a hardcoded "../.." depth)
 * because the correct depth differs between `tsx src/cli.tsx` in dev (where
 * this file keeps its own path under src/lib/) and the tsup-bundled
 * dist/cli.js used in production (where every source file collapses into
 * one, so import.meta.url instead points at dist/).
 */
export function getOwnVersion(): string | undefined {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, "package.json");
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, "utf8"));
        if (pkg.name === "pkg-cleaner" && typeof pkg.version === "string") return pkg.version;
      } catch {
        // malformed package.json at this level, keep walking up
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}
