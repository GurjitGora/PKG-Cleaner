import os from "node:os";
import path from "node:path";
import { makeDirSkillSource } from "./foldersBase.js";

export const cursorSkillsSource = makeDirSkillSource({
  id: "cursor-skill",
  label: "Cursor Skills",
  group: "AI Tools & Agents",
  rootDir: path.join(os.homedir(), ".cursor", "skills"),
  entryFile: "SKILL.md",
  detailPrefix: "Cursor skill (user-level)",
});
