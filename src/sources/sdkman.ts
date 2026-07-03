import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runShell } from "../lib/exec.js";
import { dirSizesBytes } from "../lib/fsSize.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

const SDKMAN_HOME = path.join(os.homedir(), ".sdkman");
const CANDIDATES_DIR = path.join(SDKMAN_HOME, "candidates");
const INIT_SCRIPT = path.join(SDKMAN_HOME, "bin", "sdkman-init.sh");

export const sdkmanSource: Source = {
  id: "sdkman",
  label: "SDKMAN!",
  group: "Package Managers",
  async scan(): Promise<Item[]> {
    if (!existsSync(CANDIDATES_DIR)) return [];
    const candidates = await fs.readdir(CANDIDATES_DIR, { withFileTypes: true }).catch(() => []);

    type Pending = { candidate: string; version: string; versionDir: string; isCurrent: boolean };
    const pending: Pending[] = [];
    for (const candidate of candidates) {
      if (!candidate.isDirectory()) continue;
      const candidateDir = path.join(CANDIDATES_DIR, candidate.name);
      let current: string | undefined;
      try {
        const target = await fs.readlink(path.join(candidateDir, "current"));
        current = path.basename(target);
      } catch {
        // no "current" symlink set for this candidate
      }
      const versions = await fs.readdir(candidateDir, { withFileTypes: true }).catch(() => []);
      for (const v of versions) {
        if (!v.isDirectory() || v.name === "current") continue;
        pending.push({
          candidate: candidate.name,
          version: v.name,
          versionDir: path.join(candidateDir, v.name),
          isCurrent: v.name === current,
        });
      }
    }

    const sizes = await dirSizesBytes(pending.map((p) => p.versionDir));
    return pending.map((p) => ({
      id: `sdkman:${p.candidate}:${p.version}`,
      source: "sdkman",
      group: "Package Managers",
      name: `${p.candidate} ${p.version}`,
      version: p.version,
      detail: p.isCurrent ? "SDKMAN! candidate (currently active)" : "SDKMAN! candidate",
      sizeBytes: sizes.get(p.versionDir),
      path: p.versionDir,
      uninstallPreview: `sdk uninstall ${p.candidate} ${p.version}`,
      payload: { candidate: p.candidate, version: p.version },
    }));
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const payload = item.payload as { candidate: string; version: string } | undefined;
    if (!payload) return { item, ok: false, message: "Missing SDKMAN candidate/version payload" };
    if (!existsSync(INIT_SCRIPT)) {
      return { item, ok: false, message: `sdkman-init.sh not found at ${INIT_SCRIPT}` };
    }
    const safeToken = /^[\w.+-]+$/;
    if (!safeToken.test(payload.candidate) || !safeToken.test(payload.version)) {
      return { item, ok: false, message: "Unexpected characters in candidate/version name, refusing to run" };
    }
    const script = `source "${INIT_SCRIPT}" && sdk uninstall ${payload.candidate} ${payload.version}`;
    const res = await runShell(script, { timeoutMs: 60_000 });
    return { item, ok: res.ok, message: res.ok ? res.stdout.trim() || "Uninstalled" : res.stderr };
  },
};
