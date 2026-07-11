import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { moveToTrash } from "../lib/trash.js";
import { extractFrontmatterDescription } from "../lib/frontmatter.js";
import { dirSizesBytes } from "../lib/fsSize.js";
import type { GroupName, Item, Source, SourceId, UninstallResult } from "../lib/types.js";

interface FolderSourceOpts {
  id: SourceId;
  label: string;
  group: GroupName;
  rootDir: string;
  /** entryFile relative to each skill dir, e.g. "SKILL.md", used to confirm it's really a skill dir. */
  entryFile: string;
  detailPrefix: string;
}

/** Skills live one-per-directory: <root>/<name>/SKILL.md */
export function makeDirSkillSource(opts: FolderSourceOpts): Source {
  return {
    id: opts.id,
    label: opts.label,
    group: opts.group,
    async scan(): Promise<Item[]> {
      if (!existsSync(opts.rootDir)) return [];
      const entries = await fs.readdir(opts.rootDir, { withFileTypes: true }).catch(() => []);

      type Pending = { name: string; dirPath: string; description?: string; installedAt?: number };
      const pending: Pending[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const dirPath = path.join(opts.rootDir, entry.name);
        const entryFilePath = path.join(dirPath, opts.entryFile);
        if (!existsSync(entryFilePath)) continue;
        let description: string | undefined;
        let installedAt: number | undefined;
        try {
          const content = await fs.readFile(entryFilePath, "utf8");
          description = extractFrontmatterDescription(content);
          installedAt = (await fs.stat(entryFilePath)).mtimeMs;
        } catch {
          // unreadable entry file, still list the folder
        }
        pending.push({ name: entry.name, dirPath, description, installedAt });
      }

      const sizes = await dirSizesBytes(pending.map((p) => p.dirPath));
      return pending.map((p) => ({
        id: `${opts.id}:${p.name}`,
        source: opts.id,
        group: opts.group,
        name: p.name,
        detail: p.description ?? opts.detailPrefix,
        sizeBytes: sizes.get(p.dirPath),
        path: p.dirPath,
        installedAt: p.installedAt,
        uninstallPreview: `Move to Trash: ${p.dirPath}`,
      }));
    },
    async uninstall(item: Item): Promise<UninstallResult> {
      if (!item.path) return { item, ok: false, message: "No path recorded for this item" };
      const res = await moveToTrash(item.path);
      return { item, ok: res.ok, message: res.message };
    },
  };
}

interface FlatFileSourceOpts {
  id: SourceId;
  label: string;
  group: GroupName;
  rootDir: string;
  extension: string;
  detailPrefix: string;
}

/** Agents live as flat files: <root>/<name>.md */
export function makeFlatFileSource(opts: FlatFileSourceOpts): Source {
  return {
    id: opts.id,
    label: opts.label,
    group: opts.group,
    async scan(): Promise<Item[]> {
      if (!existsSync(opts.rootDir)) return [];
      const entries = await fs.readdir(opts.rootDir, { withFileTypes: true }).catch(() => []);
      const items: Item[] = [];
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(opts.extension)) continue;
        const filePath = path.join(opts.rootDir, entry.name);
        const name = entry.name.slice(0, -opts.extension.length);
        let description: string | undefined;
        try {
          const content = await fs.readFile(filePath, "utf8");
          description = extractFrontmatterDescription(content);
        } catch {
          // unreadable, still list it
        }
        const stat = await fs.stat(filePath).catch(() => undefined);
        items.push({
          id: `${opts.id}:${name}`,
          source: opts.id,
          group: opts.group,
          name,
          detail: description ?? opts.detailPrefix,
          sizeBytes: stat?.size,
          path: filePath,
          installedAt: stat?.mtimeMs,
          uninstallPreview: `Move to Trash: ${filePath}`,
        });
      }
      return items;
    },
    async uninstall(item: Item): Promise<UninstallResult> {
      if (!item.path) return { item, ok: false, message: "No path recorded for this item" };
      const res = await moveToTrash(item.path);
      return { item, ok: res.ok, message: res.message };
    },
  };
}
