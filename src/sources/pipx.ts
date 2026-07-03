import { commandExists, run } from "../lib/exec.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

interface PipxListJson {
  venvs?: Record<string, { metadata?: { main_package?: { package_version?: string } } }>;
}

export const pipxSource: Source = {
  id: "pipx",
  label: "pipx",
  group: "Package Managers",
  async scan(): Promise<Item[]> {
    if (!(await commandExists("pipx"))) return [];
    const res = await run("pipx", ["list", "--json"], { timeoutMs: 20_000 });
    if (!res.ok) return [];
    let parsed: PipxListJson;
    try {
      parsed = JSON.parse(res.stdout);
    } catch {
      return [];
    }
    return Object.entries(parsed.venvs ?? {}).map(([name, info]) => ({
      id: `pipx:${name}`,
      source: "pipx" as const,
      group: "Package Managers" as const,
      name,
      version: info.metadata?.main_package?.package_version,
      detail: "pipx (isolated venv)",
      uninstallPreview: `pipx uninstall ${name}`,
    }));
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const res = await run("pipx", ["uninstall", item.name], { timeoutMs: 60_000 });
    return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
  },
};
