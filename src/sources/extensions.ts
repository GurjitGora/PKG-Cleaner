import os from "node:os";
import path from "node:path";
import { commandExists, run } from "../lib/exec.js";
import { dirSizesBytes } from "../lib/fsSize.js";
import { readJsonIfExists } from "../lib/jsonFile.js";
import type { Item, Source, SourceId, UninstallResult } from "../lib/types.js";

interface ExtensionManifestEntry {
  identifier: { id: string };
  version: string;
  location?: { path?: string };
  metadata?: { publisherDisplayName?: string };
}

interface EditorTarget {
  id: SourceId;
  label: string;
  extensionsDir: string;
  manifestPath: string;
  /** CLI binary name to look for on PATH first. */
  cliName: string;
  /** Known app-bundle install locations to probe if the CLI isn't on PATH. */
  cliCandidates: string[];
}

const home = os.homedir();

const VSCODE_TARGET: EditorTarget = {
  id: "vscode-extension",
  label: "VS Code Extensions",
  extensionsDir: path.join(home, ".vscode", "extensions"),
  manifestPath: path.join(home, ".vscode", "extensions", "extensions.json"),
  cliName: "code",
  cliCandidates: ["/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"],
};

const CURSOR_TARGET: EditorTarget = {
  id: "cursor-extension",
  label: "Cursor Extensions",
  extensionsDir: path.join(home, ".cursor", "extensions"),
  manifestPath: path.join(home, ".cursor", "extensions", "extensions.json"),
  cliName: "cursor",
  cliCandidates: ["/Applications/Cursor.app/Contents/Resources/app/bin/cursor"],
};

async function findCli(target: EditorTarget): Promise<string | undefined> {
  if (await commandExists(target.cliName)) return target.cliName;
  const { existsSync } = await import("node:fs");
  for (const candidate of target.cliCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

function isCopilot(id: string): boolean {
  return id.toLowerCase().startsWith("github.copilot");
}

function makeExtensionSource(target: EditorTarget): Source {
  return {
    id: target.id,
    label: target.label,
    group: "AI Tools & Agents",
    async scan(): Promise<Item[]> {
      const manifest = await readJsonIfExists<ExtensionManifestEntry[]>(target.manifestPath);
      if (!manifest) return [];
      const cli = await findCli(target);

      // The on-disk manifest can carry more than one version entry for the
      // same extension id (VS Code/Cursor sometimes leave stale copies behind
      // after an auto-update). Group by id so we uninstall the extension once,
      // not once per leftover version folder.
      const byId = new Map<string, ExtensionManifestEntry[]>();
      for (const entry of manifest) {
        const list = byId.get(entry.identifier.id) ?? [];
        list.push(entry);
        byId.set(entry.identifier.id, list);
      }

      const grouped = Array.from(byId.entries()).map(([id, entries]) => ({
        id,
        entries,
        paths: entries.map((e) => e.location?.path).filter((p): p is string => Boolean(p)),
      }));
      const allPaths = grouped.flatMap((g) => g.paths);
      const sizeMap = await dirSizesBytes(allPaths);

      const items = grouped.map(({ id, entries, paths }) => {
          const sizes = paths.map((p) => sizeMap.get(p));
          const sizeBytes = sizes.some((s) => s !== undefined)
            ? sizes.reduce<number>((sum, s) => sum + (s ?? 0), 0)
            : undefined;
          const versions = Array.from(new Set(entries.map((e) => e.version)));
          const copilot = isCopilot(id);
          const manualOnly = !cli;
          const uninstallPreview = cli
            ? `${cli} --uninstall-extension ${id}`
            : `Manual: open ${target.label.includes("Cursor") ? "Cursor" : "VS Code"} → Extensions → "${id}" → Uninstall`;
          const item: Item = {
            id: `${target.id}:${id}`,
            source: target.id,
            group: "AI Tools & Agents",
            name: id + (copilot ? " (GitHub Copilot)" : ""),
            version: versions.length > 1 ? `${versions.join(", ")} (${versions.length} copies on disk)` : versions[0],
            detail: entries[0].metadata?.publisherDisplayName ?? target.label,
            sizeBytes,
            path: paths[0],
            manualOnly,
            uninstallPreview,
            payload: { id, paths },
          };
          return item;
      });
      return items;
    },
    async uninstall(item: Item): Promise<UninstallResult> {
      const payload = item.payload as { id: string } | undefined;
      if (!payload) return { item, ok: false, message: "Missing extension id" };
      const cli = await findCli(target);
      if (!cli) {
        return {
          item,
          ok: false,
          message: `No ${target.label.includes("Cursor") ? "cursor" : "code"} CLI found. Uninstall manually from the Extensions panel to avoid corrupting the editor's extension manifest.`,
        };
      }
      const res = await run(cli, ["--uninstall-extension", payload.id], { timeoutMs: 60_000 });
      return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
    },
  };
}

export const vscodeExtensionsSource = makeExtensionSource(VSCODE_TARGET);
export const cursorExtensionsSource = makeExtensionSource(CURSOR_TARGET);
