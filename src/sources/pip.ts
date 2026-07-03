import { commandExists, run } from "../lib/exec.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

interface PipEntry {
  name: string;
  version: string;
}

const CORE_TOOLS = new Set(["pip", "setuptools", "wheel"]);

export const pipSource: Source = {
  id: "pip",
  label: "pip (system)",
  group: "Package Managers",
  async scan(): Promise<Item[]> {
    const bin = (await commandExists("pip3")) ? "pip3" : (await commandExists("pip")) ? "pip" : undefined;
    if (!bin) return [];
    const res = await run(bin, ["list", "--format=json"], { timeoutMs: 20_000 });
    if (!res.ok) return [];
    let entries: PipEntry[];
    try {
      entries = JSON.parse(res.stdout);
    } catch {
      return [];
    }
    return entries.map((e) => ({
      id: `pip:${e.name}`,
      source: "pip" as const,
      group: "Package Managers" as const,
      name: e.name,
      version: e.version,
      detail: CORE_TOOLS.has(e.name.toLowerCase())
        ? "system pip — core tool, removing can break pip itself"
        : "system pip (no virtualenv)",
      uninstallPreview: `${bin} uninstall -y ${e.name}`,
    }));
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const bin = (await commandExists("pip3")) ? "pip3" : "pip";
    const res = await run(bin, ["uninstall", "-y", item.name], { timeoutMs: 60_000 });
    return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
  },
};
