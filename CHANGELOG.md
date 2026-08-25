# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.1] - 2026-08-25

### Changed
- **Clarified LICENSE terms.** The previous "All Rights Reserved" wording
  technically prohibited even normal use ("may not be... used... without
  permission"), which was broader than intended. Now explicit: installing
  and running the software via the official npm package is free and
  permitted; copying, redistributing, modifying-and-republishing, or
  reselling the source or compiled output is not, without permission.
  `package.json`'s `license` field stays `UNLICENSED` (still the correct
  npm convention — there's no standard SPDX identifier for "free to use,
  no redistribution"; the actual terms live in the LICENSE file text).

## [0.3.0] - 2026-08-25

### Changed
- **Bumped `ink` 5→6.8.0 and `react` 18→19.2.8** (ink 6 requires React ≥19).
  No code changes needed — verified ink 6.0.0's only breaking changes are
  the Node/React version requirements, not the API; confirmed nothing in
  this codebase uses any React 19-removed APIs (PropTypes, defaultProps,
  string refs, legacy context). Deliberately did *not* go to ink 7.1.1,
  which requires Node ≥22 — 6.8.0 gets React 19 and bug fixes without
  raising the floor that far. Full interactive testing (navigation, tab
  switching, selection, search/backspace/escape, ignore-list toggle) via
  a driven pty confirmed no regressions.
- **`engines.node` raised from `>=18` to `>=20`** to match ink 6's actual
  requirement (was already silently required by the dependency; now
  declared honestly). `tsup` build target bumped from `node18` to
  `node20` to match. CI matrix updated from `[18, 20]` to `[20, 22]`.
- **Bumped `typescript` 5.9.3→6.0.3** (not 7.0.2/"typescript-go" — the
  TypeScript team's own release notes recommend 6.0 as the pragmatic
  intermediate step for projects with build tooling like `tsup`/`tsx`,
  since 7.0 ships without a programmatic API yet). This surfaced a real
  config gap: newer TypeScript no longer auto-discovers `@types/node`
  globals by default, which broke every file using `process`, `console`,
  Node builtins, etc. until `"types": ["node"]` was added to
  `tsconfig.json`.
- Bumped `tsx` to latest (routine, same major).
- Kept `@types/node` on the 20.x line (matching the actual `engines.node`
  floor) rather than jumping to 26.x, to avoid TypeScript allowing Node
  APIs that don't exist on the minimum supported runtime.

## [0.2.2] - 2026-07-13

### Fixed
- **esbuild CVE** (GHSA-g7r4-m6w7-qqqr, low severity, arbitrary file read
  via esbuild's dev server on Windows). Not actually reachable by
  pkg-cleaner users — esbuild is a transitive build-time tool via
  `tsup`/`tsx`, never shipped in the published package — but fixed via
  an `overrides` entry (root cause: `tsup` pins `esbuild@^0.27.0`,
  capping below the patched `0.28.1` even though it's compatible).
  `npm audit` now reports 0 vulnerabilities.

### Added
- Enabled GitHub Dependabot (vulnerability alerts + automated security
  fixes, both were off) and added `dependabot.yml` for weekly npm and
  GitHub Actions update checks, so future CVEs surface automatically.

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
