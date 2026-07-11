import { render } from "ink";
import { App } from "./ui/App.js";
import { getOwnVersion } from "./lib/version.js";

const HELP_TEXT = `pkg-cleaner — terminal UI to audit and uninstall macOS package-manager
and AI-tooling clutter (Homebrew, npm, gem, pip, pipx, SDKMAN, Claude Code,
Cursor, VS Code/Copilot extensions).

Usage:
  pkg-cleaner            Launch the interactive TUI
  pkg-cleaner -h, --help     Show this help and exit
  pkg-cleaner -v, --version  Print the installed version and exit

pkg-cleaner has no other command-line options — everything (scanning,
selecting, filtering, uninstalling) happens inside the interactive UI.
See the full keybinding list there, or in the README:
https://github.com/GurjitGora/PKG-Cleaner#using-the-tui`;

const KNOWN_FLAGS = new Set(["--help", "-h", "--version", "-v"]);

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(getOwnVersion() ?? "unknown");
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const unknown = args.find((a) => a.startsWith("-") && !KNOWN_FLAGS.has(a));
  if (unknown) {
    console.error(`pkg-cleaner: unknown option '${unknown}'\n`);
    console.error(HELP_TEXT);
    process.exit(1);
  }

  if (process.platform !== "darwin") {
    console.error("pkg-cleaner currently only supports macOS.");
    process.exit(1);
  }

  render(<App />);
}

main();
