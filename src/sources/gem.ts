import { commandExists, run } from "../lib/exec.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

const LINE_RE = /^(\S+)\s+\(([^)]+)\)$/;

export const gemSource: Source = {
  id: "gem",
  label: "RubyGems",
  group: "Package Managers",
  async scan(): Promise<Item[]> {
    if (!(await commandExists("gem"))) return [];
    const res = await run("gem", ["list", "--local"], { timeoutMs: 20_000 });
    if (!res.ok) return [];
    const items: Item[] = [];
    for (const line of res.stdout.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("***") || trimmed.startsWith("Ignoring")) continue;
      const m = LINE_RE.exec(trimmed);
      if (!m) continue;
      const [, name, versions] = m;
      items.push({
        id: `gem:${name}`,
        source: "gem",
        group: "Package Managers",
        name,
        version: versions,
        detail: "RubyGems (system Ruby)",
        uninstallPreview: `gem uninstall ${name} --all --executables`,
      });
    }
    return items;
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const res = await run("gem", ["uninstall", item.name, "--all", "--executables"], {
      timeoutMs: 60_000,
    });
    return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
  },
};
