import os from "node:os";
import path from "node:path";
import { makeFlatFileSource } from "./foldersBase.js";

export const cursorAgentsSource = makeFlatFileSource({
  id: "cursor-agent",
  label: "Cursor Agents",
  group: "AI Tools & Agents",
  rootDir: path.join(os.homedir(), ".cursor", "agents"),
  extension: ".md",
  detailPrefix: "Cursor subagent (user-level)",
});
