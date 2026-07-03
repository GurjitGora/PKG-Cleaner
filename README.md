# pkg-cleaner

A terminal UI (TUI) for auditing and uninstalling clutter on **macOS**:

- **Package managers**: Homebrew (formulae + casks), npm (global), RubyGems, pip (system), pipx, SDKMAN!
- **AI tooling**: Claude Code skills, subagents, and MCP servers; Cursor skills, subagents, and MCP servers; VS Code / Cursor extensions (flags GitHub Copilot specially)

Everything is scanned read-only up front. Nothing is uninstalled until you explicitly select items and confirm.

## Requirements

- macOS (this tool shells out to `osascript`/Finder for Trash support and is not cross-platform)
- Node.js >= 18

## Install

Clone or copy this directory, then from inside it:

```bash
npm install
npm run build
```

This produces `dist/cli.js`. Install it as a global command with either:

```bash
# Option A: npm link (symlinks the package into your global npm bin)
npm link

# Option B: install directly from the local folder
npm install -g .
```

Either way you get a `pkg-cleaner` command on your PATH. Run it with:

```bash
pkg-cleaner
```

To uninstall the CLI itself later: `npm uninstall -g pkg-cleaner` (or `npm unlink` if you used `npm link`).

#### If `npm link` / `npm install -g .` fails with `EACCES`

This happens when your npm global prefix (check with `npm config get prefix`) is a
root-owned directory — common on Macs where Node was installed via the official
`.pkg` installer (prefix defaults to `/usr/local`). This tool deliberately never
runs `sudo` on your behalf, so pick one of:

- **Recommended**: point npm at a user-owned prefix instead, e.g.
  `npm config set prefix ~/.npm-global`, add `~/.npm-global/bin` to your `PATH`,
  then re-run `npm install -g .`. This fixes the issue for all future global
  npm installs, not just this one.
- Skip the global install entirely and run the built file directly:
  `node "$(pwd)/dist/cli.js"`, or add a shell alias
  `alias pkg-cleaner='node /absolute/path/to/dist/cli.js'` to your `~/.zshrc`.

### Development

```bash
npm run dev        # run directly from TypeScript source via tsx, no build step
npm run typecheck   # tsc --noEmit
```

## Using the TUI

- **↑ / ↓** — move the cursor
- **← / →** — switch between the "Package Managers" and "AI Tools & Agents" tabs
- **Space** — toggle selection on the highlighted item
- **a** — select all items currently visible (respects any active search filter)
- **c** — clear the selection
- **/** — search/filter the current tab by name or description; **Esc** clears it, **Enter** stops editing
- **Enter** — go to the confirmation screen for your selection (or just the highlighted item if nothing is selected)
- **r** — rescan everything
- **q** / **Ctrl+C** — quit

The confirmation screen lists the literal command or file action about to run for every item — nothing happens silently.

## Safety model

- **Package manager items** are removed with that manager's own uninstall command (`brew uninstall`, `npm uninstall -g`, `gem uninstall`, `pip uninstall`, `pipx uninstall`, `sdk uninstall`). These are all reversible by reinstalling.
- **Claude Code / Cursor skills and subagents** are moved to the **macOS Trash** (via Finder, through `osascript`) rather than deleted outright, so a bad uninstall is recoverable from Trash.
- **MCP server entries** live inside JSON config files (`~/.claude.json`, `~/.cursor/mcp.json`). Removing one edits only that key and writes a timestamped `.bak-<timestamp>` copy of the whole file next to it first. Restart Claude Code / Cursor for the change to take effect.
- **Editor extensions** (VS Code, Cursor, including GitHub Copilot) are only uninstalled automatically if the `code` / `cursor` CLI can be found (on PATH, or at the standard `/Applications/*.app` location). If it can't be found, the item is shown as manual-only with the exact menu action to take — pkg-cleaner will not delete extension folders directly, since that can desync the editor's internal manifest and corrupt the install.

## Known limitations / deliberate scope cuts

- **Claude Code plugins/marketplaces are intentionally not included.** `~/.claude/plugins/marketplaces/*/plugins` is a *catalog* of everything available from a marketplace, not a list of what you've actually installed/enabled — there's no reliable on-disk signal to tell those apart. Rather than guess and risk deleting the wrong thing, this is left out of v1.
- **pip** only targets the `pip3`/`pip` found on PATH (your system Python). It does not detect or manage virtualenvs.
- **npm global installs**: if your npm global prefix lives under a root-owned directory (common with the Node.js installer package), uninstalling may need permissions this tool intentionally does not escalate (no `sudo` is ever run automatically).
- Only the **global** Cursor MCP config (`~/.cursor/mcp.json`) and Claude Code's **known projects** (from `~/.claude.json`) are scanned — arbitrary per-project `.mcp.json`/`.cursor/mcp.json` files elsewhere on disk are not discovered.

## Project layout

```
src/
  cli.tsx              entry point, renders the Ink app
  lib/                 exec/trash/JSON/size helpers shared by every source
  sources/             one file per data source: scan() + uninstall()
  ui/                  Ink components (tabs, list, confirm dialog, run log)
```

To add a new package manager or AI-tool source, add a file under `src/sources/` that exports a `Source` (see `src/lib/types.ts`), then register it in `src/sources/registry.ts`.
