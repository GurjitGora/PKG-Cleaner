import { homebrewFormulaSource, homebrewCaskSource } from "./homebrew.js";
import { npmGlobalSource } from "./npmGlobal.js";
import { gemSource } from "./gem.js";
import { pipSource } from "./pip.js";
import { pipxSource } from "./pipx.js";
import { sdkmanSource } from "./sdkman.js";
import { claudeSkillsSource } from "./claude-skills.js";
import { claudeAgentsSource } from "./claude-agents.js";
import { claudeMcpSource } from "./claude-mcp.js";
import { cursorSkillsSource } from "./cursor-skills.js";
import { cursorAgentsSource } from "./cursor-agents.js";
import { cursorMcpSource } from "./cursor-mcp.js";
import { vscodeExtensionsSource, cursorExtensionsSource } from "./extensions.js";
import type { Source } from "../lib/types.js";

export const ALL_SOURCES: Source[] = [
  homebrewFormulaSource,
  homebrewCaskSource,
  npmGlobalSource,
  gemSource,
  pipSource,
  pipxSource,
  sdkmanSource,
  claudeSkillsSource,
  claudeAgentsSource,
  claudeMcpSource,
  cursorSkillsSource,
  cursorAgentsSource,
  cursorMcpSource,
  vscodeExtensionsSource,
  cursorExtensionsSource,
];
