import os from "node:os";
import path from "node:path";
import { makeDirSkillSource } from "./foldersBase.js";

export const claudeSkillsSource = makeDirSkillSource({
  id: "claude-skill",
  label: "Claude Code Skills",
  group: "AI Tools & Agents",
  rootDir: path.join(os.homedir(), ".claude", "skills"),
  entryFile: "SKILL.md",
  detailPrefix: "Claude Code skill (user-level)",
});
