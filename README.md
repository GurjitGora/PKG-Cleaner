# pkg-cleaner

A terminal UI (TUI) for auditing and uninstalling clutter on **macOS**:

- **Package managers**: Homebrew (formulae + casks), npm (global), RubyGems, pip (system), pipx, SDKMAN!
- **AI tooling**: Claude Code skills, subagents, and MCP servers; Cursor skills, subagents, and MCP servers; VS Code / Cursor extensions (flags GitHub Copilot specially)

Everything is scanned read-only up front. Nothing is uninstalled until you explicitly select items and confirm.

## Requirements

- macOS (this tool shells out to `osascript`/Finder for Trash support and is not cross-platform)
- Node.js >= 18

## Install

pkg-cleaner is published on npm: **https://www.npmjs.com/package/pkg-cleaner**

```bash
npm install -g pkg-cleaner
```

That gives you a `pkg-cleaner` command on your `PATH`. Run it with:

```bash
pkg-cleaner
```

To uninstall the CLI itself later: `npm uninstall -g pkg-cleaner`.

#### If that fails with `EACCES`

This happens when your npm global prefix (check with `npm config get prefix`) is a
root-owned directory — common on Macs where Node was installed via the official
`.pkg` installer (prefix defaults to `/usr/local`). This tool's own uninstall logic
deliberately never runs `sudo` on your behalf, and neither should installing it, so
pick one of:

- **Recommended**: point npm at a user-owned prefix instead, e.g.
  `npm config set prefix ~/.npm-global`, add `~/.npm-global/bin` to your `PATH`,
  then re-run `npm install -g pkg-cleaner`. This fixes the issue for all future
  global npm installs, not just this one.
- Run it via `npx` without a global install: `npx pkg-cleaner`.

### Building from source

Only needed if you want to modify the code, not for normal use:

```bash
git clone https://github.com/GurjitGora/PKG-Cleaner.git
cd PKG-Cleaner
npm install
npm run build        # produces dist/cli.js
npm run dev          # or: run directly from TypeScript source via tsx, no build step
npm run typecheck    # tsc --noEmit
npm install -g .     # install your local build globally instead of the npm one
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
