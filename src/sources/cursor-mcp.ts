import os from "node:os";
import path from "node:path";
import { readJsonIfExists, writeJsonWithBackup } from "../lib/jsonFile.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

const CONFIG_PATH = path.join(os.homedir(), ".cursor", "mcp.json");

interface CursorMcpConfig {
  mcpServers?: Record<string, { command?: unknown }>;
}

export const cursorMcpSource: Source = {
  id: "cursor-mcp",
  label: "Cursor MCP Servers",
  group: "AI Tools & Agents",
  async scan(): Promise<Item[]> {
    const config = await readJsonIfExists<CursorMcpConfig>(CONFIG_PATH);
    if (!config?.mcpServers) return [];
    return Object.entries(config.mcpServers).map(([serverName, entry]) => ({
      id: `cursor-mcp:${serverName}`,
      source: "cursor-mcp" as const,
      group: "AI Tools & Agents" as const,
      name: serverName,
      version: typeof entry.command === "string" ? entry.command : undefined,
      detail: "Cursor MCP server — global",
      uninstallPreview: `Remove "${serverName}" entry from ${CONFIG_PATH}`,
      payload: { serverName },
    }));
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const payload = item.payload as { serverName: string } | undefined;
    if (!payload) return { item, ok: false, message: "Missing MCP server payload" };
    const config = await readJsonIfExists<CursorMcpConfig>(CONFIG_PATH);
    if (!config?.mcpServers || !(payload.serverName in config.mcpServers)) {
      return { item, ok: false, message: "Server entry no longer present (already removed?)" };
    }
    delete config.mcpServers[payload.serverName];
    await writeJsonWithBackup(CONFIG_PATH, config);
    return {
      item,
      ok: true,
      message: `Removed "${payload.serverName}" from ${CONFIG_PATH} (backup saved). Restart Cursor to apply.`,
    };
  },
};
