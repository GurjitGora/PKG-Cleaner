import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".config", "pkg-cleaner");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export interface Config {
  /** Item ids (Item.id) pinned to never show up in the default list view. */
  ignore: string[];
}

const DEFAULT_CONFIG: Config = { ignore: [] };

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.ignore)) return DEFAULT_CONFIG;
    return { ignore: parsed.ignore.filter((x: unknown): x is string => typeof x === "string") };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}
