export type SourceId =
  | "homebrew-formula"
  | "homebrew-cask"
  | "npm-global"
  | "gem"
  | "pip"
  | "pipx"
  | "sdkman"
  | "claude-skill"
  | "claude-agent"
  | "claude-plugin"
  | "claude-mcp"
  | "cursor-skill"
  | "cursor-agent"
  | "cursor-mcp"
  | "vscode-extension"
  | "cursor-extension";

export type GroupName = "Package Managers" | "AI Tools & Agents";

/** One discovered, uninstallable thing. */
export interface Item {
  id: string;
  source: SourceId;
  group: GroupName;
  /** Human label shown in the list, e.g. package/skill/extension name. */
  name: string;
  version?: string;
  /** Extra context shown in the detail line, e.g. owning project path, publisher. */
  detail?: string;
  /** Byte size if known, for display only. */
  sizeBytes?: number;
  /** Filesystem path this item lives at, if any. */
  path?: string;
  /** Epoch ms this item was last modified/installed, if known — used for a relative-age hint. */
  installedAt?: number;
  /** True when this item cannot be safely automated (e.g. no editor CLI found). */
  manualOnly?: boolean;
  /** Shown in the confirm screen: the literal command or action about to run. */
  uninstallPreview: string;
  /** Arbitrary source-specific data needed at uninstall time. */
  payload?: unknown;
}

export interface UninstallResult {
  item: Item;
  ok: boolean;
  message: string;
}

export interface Source {
  id: SourceId;
  label: string;
  group: GroupName;
  scan(): Promise<Item[]>;
  uninstall(item: Item): Promise<UninstallResult>;
}
