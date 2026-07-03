import os from "node:os";
import path from "node:path";
import { makeFlatFileSource } from "./foldersBase.js";

export const claudeAgentsSource = makeFlatFileSource({
  id: "claude-agent",
  label: "Claude Code Agents",
  group: "AI Tools & Agents",
  rootDir: path.join(os.homedir(), ".claude", "agents"),
  extension: ".md",
  detailPrefix: "Claude Code subagent (user-level)",
});
