# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.1] - 2026-07-13

### Changed
- **License changed from MIT to a proprietary "All Rights Reserved" license.**
  Versions `0.1.0`–`0.2.0` remain available under MIT for anyone who already
  obtained them under those terms — that grant is not retroactive. `0.2.1`
  onward: no copying, redistribution, or resale without permission.

## [0.2.0] - 2026-07-12

### Added
- Ignore list: press `i` to pin/hide any item from the default view (persisted to
  `~/.config/pkg-cleaner/config.json`), `I` to reveal hidden items again.
- Relative "last touched" age column for Claude Code / Cursor skills, subagents,
  and VS Code / Cursor extensions, to help judge what's actually stale.
- GitHub Actions CI: typecheck + build + startup smoke test on macOS runners
  (Node 18 and 20) for every push/PR to `main`.
- Startup update check: if a newer version is published on npm, a small banner
  shows it. Fails silently offline, never blocks or slows down scanning.
- `--version`/`-v` and `--help`/`-h` flags. Unknown flags now print an error
  and usage instead of silently launching the TUI as if nothing was passed.

### Fixed
- Ctrl+C now force-quits from every screen, including mid-uninstall. Previously
  the `"running"` screen had no key handler at all, so a hung uninstall command
  left no way to regain control of the terminal (Ink's raw mode intercepts
  Ctrl+C as a normal keypress, not a real `SIGINT`).

## [0.1.1] - 2026-07-03

### Fixed
- Added `repository`/`bugs`/`homepage` fields to `package.json` so the npm
  registry page links back to the GitHub repo (was missing on initial publish).
- README install instructions now lead with `npm install -g pkg-cleaner`
  instead of the old clone-and-build-locally flow, now that the package is
  actually published.

## [0.1.0] - 2026-07-03

Initial release. Terminal UI for auditing and uninstalling:

- **Package managers**: Homebrew (formulae + casks), npm (global), RubyGems,
  pip (system), pipx, SDKMAN!
- **AI tooling**: Claude Code skills/subagents/MCP servers, Cursor
  skills/subagents/MCP servers, VS Code/Cursor extensions (flags GitHub
  Copilot specially)

Safety model: package-manager uninstalls use each manager's own uninstall
command; skills/subagents move to the macOS Trash instead of being deleted
outright; MCP server config edits are backed up before writing; editor
extensions are only auto-uninstalled if the `code`/`cursor` CLI can be found,
otherwise shown as manual-only.
