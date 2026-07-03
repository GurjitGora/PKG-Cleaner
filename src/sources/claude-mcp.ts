import os from "node:os";
import path from "node:path";
import { readJsonIfExists, writeJsonWithBackup } from "../lib/jsonFile.js";
import type { Item, Source, UninstallResult } from "../lib/types.js";

const CONFIG_PATH = path.join(os.homedir(), ".claude.json");

interface McpServerEntry {
  [key: string]: unknown;
}

interface ClaudeConfig {
  mcpServers?: Record<string, McpServerEntry>;
  projects?: Record<string, { mcpServers?: Record<string, McpServerEntry> }>;
}

interface McpPayload {
  scope: "global" | "project";
  projectPath?: string;
  serverName: string;
}

export const claudeMcpSource: Source = {
  id: "claude-mcp",
  label: "Claude Code MCP Servers",
  group: "AI Tools & Agents",
  async scan(): Promise<Item[]> {
    const config = await readJsonIfExists<ClaudeConfig>(CONFIG_PATH);
    if (!config) return [];
    const items: Item[] = [];

    for (const [serverName, entry] of Object.entries(config.mcpServers ?? {})) {
      items.push(mcpItem(serverName, entry, { scope: "global", serverName }));
    }

    for (const [projectPath, project] of Object.entries(config.projects ?? {})) {
      for (const [serverName, entry] of Object.entries(project.mcpServers ?? {})) {
        items.push(
          mcpItem(serverName, entry, { scope: "project", projectPath, serverName }, projectPath)
        );
      }
    }
    return items;
  },
  async uninstall(item: Item): Promise<UninstallResult> {
    const payload = item.payload as McpPayload | undefined;
    if (!payload) return { item, ok: false, message: "Missing MCP server payload" };
    const config = await readJsonIfExists<ClaudeConfig>(CONFIG_PATH);
    if (!config) return { item, ok: false, message: `${CONFIG_PATH} not found` };

    if (payload.scope === "global") {
      if (!config.mcpServers || !(payload.serverName in config.mcpServers)) {
        return { item, ok: false, message: "Server entry no longer present (already removed?)" };
      }
      delete config.mcpServers[payload.serverName];
    } else {
      const project = config.projects?.[payload.projectPath!];
      if (!project?.mcpServers || !(payload.serverName in project.mcpServers)) {
        return { item, ok: false, message: "Server entry no longer present (already removed?)" };
      }
      delete project.mcpServers[payload.serverName];
    }

    await writeJsonWithBackup(CONFIG_PATH, config);
    return {
      item,
      ok: true,
      message: `Removed "${payload.serverName}" from ${CONFIG_PATH} (backup saved). Restart Claude Code to apply.`,
    };
  },
};

function mcpItem(
  serverName: string,
  entry: McpServerEntry,
  payload: McpPayload,
  projectPath?: string
): Item {
  const command = typeof entry.command === "string" ? entry.command : undefined;
  return {
    id: `claude-mcp:${payload.scope}:${projectPath ?? "global"}:${serverName}`,
    source: "claude-mcp",
    group: "AI Tools & Agents",
    name: serverName,
    detail: projectPath
      ? `Claude Code MCP server — project: ${projectPath}`
      : "Claude Code MCP server — global",
    version: command,
    uninstallPreview: `Remove "${serverName}" entry from ${CONFIG_PATH}`,
    payload,
  };
}
