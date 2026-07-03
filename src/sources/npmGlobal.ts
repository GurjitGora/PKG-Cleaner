import { commandExists, run } from "../lib/exec.js";
import { dirSizesBytes } from "../lib/fsSize.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

interface NpmListJson {
  dependencies?: Record<string, { version?: string }>;
}

export const npmGlobalSource: Source = {
  id: "npm-global",
  label: "npm (global)",
  group: "Package Managers",
  async scan(): Promise<Item[]> {
    if (!(await commandExists("npm"))) return [];
    const [listRes, rootRes] = await Promise.all([
      run("npm", ["list", "-g", "--depth=0", "--json"], { timeoutMs: 20_000 }),
      run("npm", ["root", "-g"], { timeoutMs: 10_000 }),
    ]);
    if (!listRes.ok && !listRes.stdout) return [];
    let parsed: NpmListJson;
    try {
      parsed = JSON.parse(listRes.stdout);
    } catch {
      return [];
    }
    const root = rootRes.ok ? rootRes.stdout.trim() : undefined;
    const deps = Object.entries(parsed.dependencies ?? {}).filter(([name]) => name !== "npm");
    const paths = root ? deps.map(([name]) => `${root}/${name}`) : [];
    const sizes = await dirSizesBytes(paths);
    const items = deps.map(([name, info]) => {
      const pkgPath = root ? `${root}/${name}` : undefined;
      const sizeBytes = pkgPath ? sizes.get(pkgPath) : undefined;
      const item: Item = {
        id: `npm-global:${name}`,
        source: "npm-global",
        group: "Package Managers",
        name,
        version: info.version,
        detail: "npm (global)",
        sizeBytes,
        path: pkgPath,
        uninstallPreview: `npm uninstall -g ${name}`,
      };
      return item;
    });
    return items;
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const res = await run("npm", ["uninstall", "-g", item.name], { timeoutMs: 60_000 });
    return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
  },
};
