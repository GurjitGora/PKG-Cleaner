import { commandExists, run } from "../lib/exec.js";
import { dirSizesBytes } from "../lib/fsSize.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

async function listWithVersions(kind: "formula" | "cask"): Promise<{ name: string; version: string }[]> {
  const res = await run("brew", ["list", `--${kind}`, "--versions"], { timeoutMs: 20_000 });
  if (!res.ok) return [];
  return res.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...versions] = line.split(/\s+/);
      return { name, version: versions.join(", ") };
    });
}

async function rootDir(kind: "formula" | "cask"): Promise<string | undefined> {
  const res = await run("brew", ["--" + (kind === "formula" ? "cellar" : "caskroom")]);
  return res.ok ? res.stdout.trim() : undefined;
}

function makeSource(kind: "formula" | "cask"): Source {
  const label = kind === "formula" ? "Homebrew Formulae" : "Homebrew Casks";
  return {
    id: kind === "formula" ? "homebrew-formula" : "homebrew-cask",
    label,
    group: "Package Managers",
    async scan(): Promise<Item[]> {
      if (!(await commandExists("brew"))) return [];
      const [pkgs, root] = await Promise.all([listWithVersions(kind), rootDir(kind)]);
      const paths = root ? pkgs.map((p) => `${root}/${p.name}`) : [];
      const sizes = await dirSizesBytes(paths);
      const items = pkgs.map((p) => {
          const pkgPath = root ? `${root}/${p.name}` : undefined;
          const sizeBytes = pkgPath ? sizes.get(pkgPath) : undefined;
          const item: Item = {
            id: `${kind}:${p.name}`,
            source: kind === "formula" ? "homebrew-formula" : "homebrew-cask",
            group: "Package Managers",
            name: p.name,
            version: p.version,
            detail: label,
            sizeBytes,
            path: pkgPath,
            uninstallPreview:
              kind === "formula" ? `brew uninstall ${p.name}` : `brew uninstall --cask ${p.name}`,
          };
          return item;
      });
      return items;
    },
    async uninstall(item: Item): Promise<UninstallResult> {
      const args = kind === "formula" ? ["uninstall", item.name] : ["uninstall", "--cask", item.name];
      const res = await run("brew", args, { timeoutMs: 120_000 });
      return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
    },
  };
}

export const homebrewFormulaSource = makeSource("formula");
export const homebrewCaskSource = makeSource("cask");
