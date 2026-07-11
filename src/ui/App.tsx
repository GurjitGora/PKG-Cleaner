import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { ALL_SOURCES } from "../sources/registry.js";
import type { GroupName, Item, UninstallResult } from "../lib/types.js";
import { loadConfig, saveConfig } from "../lib/config.js";
import { getOwnVersion } from "../lib/version.js";
import { checkForUpdate } from "../lib/updateCheck.js";
import { Spinner } from "./Spinner.js";
import { CategoryTabs } from "./CategoryTabs.js";
import { ItemList } from "./ItemList.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { RunLog } from "./RunLog.js";

const GROUPS: GroupName[] = ["Package Managers", "AI Tools & Agents"];

type Screen = "scanning" | "browse" | "confirm" | "running" | "done";

const SOURCE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_SOURCES.map((s) => [s.id, s.label])
);

export function App(): ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const [screen, setScreen] = useState<Screen>("scanning");
  const [items, setItems] = useState<Item[]>([]);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<GroupName>(GROUPS[0]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [results, setResults] = useState<UninstallResult[]>([]);
  const [runningName, setRunningName] = useState<string | undefined>();
  const [rows, setRows] = useState(stdout?.rows ?? 24);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);
  const [configError, setConfigError] = useState<string | undefined>();
  const [updateVersion, setUpdateVersion] = useState<string | undefined>();

  useEffect(() => {
    const onResize = () => setRows(stdout?.rows ?? 24);
    stdout?.on("resize", onResize);
    return () => {
      stdout?.off("resize", onResize);
    };
  }, [stdout]);

  useEffect(() => {
    void loadConfig().then((config) => setIgnoredIds(new Set(config.ignore)));
  }, []);

  useEffect(() => {
    const current = getOwnVersion();
    if (!current) return;
    void checkForUpdate(current).then(setUpdateVersion);
  }, []);

  function toggleIgnore(item: Item) {
    setIgnoredIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      void saveConfig({ ignore: Array.from(next) }).catch((err) =>
        setConfigError(`Failed to save ignore list: ${String(err)}`)
      );
      return next;
    });
  }

  async function scan() {
    setScreen("scanning");
    const settled = await Promise.allSettled(ALL_SOURCES.map((s) => s.scan()));
    const collected: Item[] = [];
    const errors: string[] = [];
    settled.forEach((res, i) => {
      if (res.status === "fulfilled") collected.push(...res.value);
      else errors.push(`${ALL_SOURCES[i].label}: ${String(res.reason)}`);
    });
    setItems(collected);
    setScanErrors(errors);
    setCursorIndex(0);
    setScreen("browse");
  }

  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((i) => i.group === activeGroup)
      .filter((i) => showIgnored || !ignoredIds.has(i.id))
      .filter((i) => (q ? `${i.name} ${i.detail ?? ""}`.toLowerCase().includes(q) : true));
  }, [items, activeGroup, searchQuery, ignoredIds, showIgnored]);

  const hiddenInGroupCount = useMemo(
    () => items.filter((i) => i.group === activeGroup && ignoredIds.has(i.id)).length,
    [items, activeGroup, ignoredIds]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of GROUPS) c[g] = items.filter((i) => i.group === g).length;
    return c;
  }, [items]);

  useInput((input, key) => {
    // Ink's raw mode intercepts Ctrl+C as a normal keypress rather than a
    // real SIGINT, so without an unconditional handler here a hung
    // uninstall command (screen === "running", which has no key branch of
    // its own) would leave the user with no way to get their terminal back.
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (screen === "scanning") return;

    if (screen === "browse") {
      if (isSearching) {
        if (key.escape) {
          setIsSearching(false);
          setSearchQuery("");
          setCursorIndex(0);
          return;
        }
        if (key.return) {
          setIsSearching(false);
          return;
        }
        if (key.backspace || key.delete) {
          setSearchQuery((q) => q.slice(0, -1));
          setCursorIndex(0);
          return;
        }
        if (input && !key.ctrl && !key.meta) {
          setSearchQuery((q) => q + input);
          setCursorIndex(0);
        }
        return;
      }

      if (input === "q") {
        exit();
        return;
      }
      if (input === "/") {
        setIsSearching(true);
        return;
      }
      if (input === "r") {
        setSelected(new Set());
        scan();
        return;
      }
      if (key.leftArrow) {
        const idx = GROUPS.indexOf(activeGroup);
        setActiveGroup(GROUPS[(idx - 1 + GROUPS.length) % GROUPS.length]);
        setCursorIndex(0);
        setSearchQuery("");
        return;
      }
      if (key.rightArrow) {
        const idx = GROUPS.indexOf(activeGroup);
        setActiveGroup(GROUPS[(idx + 1) % GROUPS.length]);
        setCursorIndex(0);
        setSearchQuery("");
        return;
      }
      if (key.upArrow) {
        setCursorIndex((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow) {
        setCursorIndex((c) => Math.min(filteredItems.length - 1, c + 1));
        return;
      }
      if (input === " ") {
        const item = filteredItems[cursorIndex];
        if (!item) return;
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
        return;
      }
      if (input === "a") {
        setSelected((prev) => {
          const next = new Set(prev);
          for (const i of filteredItems) next.add(i.id);
          return next;
        });
        return;
      }
      if (input === "c") {
        setSelected(new Set());
        return;
      }
      if (input === "i") {
        const item = filteredItems[cursorIndex];
        if (!item) return;
        toggleIgnore(item);
        return;
      }
      if (input === "I") {
        setShowIgnored((v) => !v);
        setCursorIndex(0);
        return;
      }
      if (key.return) {
        const chosen =
          selected.size > 0
            ? items.filter((i) => selected.has(i.id))
            : filteredItems[cursorIndex]
              ? [filteredItems[cursorIndex]]
              : [];
        if (chosen.length === 0) return;
        setPendingItems(chosen);
        setScreen("confirm");
      }
      return;
    }

    if (screen === "confirm") {
      if (input === "y" || key.return) {
        void runUninstalls();
        return;
      }
      if (input === "n" || key.escape) {
        setScreen("browse");
        setPendingItems([]);
      }
      return;
    }

    if (screen === "done") {
      setSelected(new Set());
      setResults([]);
      setPendingItems([]);
      scan();
    }
  });

  async function runUninstalls() {
    setScreen("running");
    setResults([]);
    const collected: UninstallResult[] = [];
    for (const item of pendingItems) {
      setRunningName(item.name);
      const source = ALL_SOURCES.find((s) => s.id === item.source);
      let result: UninstallResult;
      if (!source) {
        result = { item, ok: false, message: "Unknown source" };
      } else {
        try {
          result = await source.uninstall(item);
        } catch (err) {
          result = { item, ok: false, message: String(err) };
        }
      }
      collected.push(result);
      setResults([...collected]);
    }
    setRunningName(undefined);
    setSelected(new Set());
    setScreen("done");
  }

  const listWindow = Math.max(5, rows - 12);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        pkg-cleaner — macOS package & AI-tooling uninstaller
      </Text>

      {updateVersion && (
        <Text color="yellow">
          Update available: v{updateVersion} — run `npm install -g pkg-cleaner` to upgrade
        </Text>
      )}

      {screen === "scanning" && (
        <Box marginTop={1}>
          <Text>
            <Spinner /> Scanning Homebrew, npm, gem, pip, pipx, SDKMAN, Claude Code, Cursor…
          </Text>
        </Box>
      )}

      {screen !== "scanning" && (
        <>
          <Box marginTop={1}>
            <CategoryTabs groups={GROUPS} active={activeGroup} counts={counts} />
          </Box>

          {(scanErrors.length > 0 || configError) && screen === "browse" && (
            <Box marginTop={1} flexDirection="column">
              {scanErrors.map((e) => (
                <Text key={e} color="red">
                  ! {e}
                </Text>
              ))}
              {configError && <Text color="red">! {configError}</Text>}
            </Box>
          )}

          {screen === "browse" && (
            <>
              <Box marginTop={1}>
                <Text dimColor>
                  {isSearching ? `Search: ${searchQuery}▌` : searchQuery ? `Filter: "${searchQuery}" (Esc to clear)` : " "}
                </Text>
              </Box>
              <Box marginTop={1}>
                <ItemList
                  items={filteredItems}
                  cursorIndex={cursorIndex}
                  selected={selected}
                  windowSize={listWindow}
                  sourceLabels={SOURCE_LABELS}
                  ignoredIds={ignoredIds}
                />
              </Box>
              {hiddenInGroupCount > 0 && (
                <Box marginTop={1}>
                  <Text dimColor>
                    {showIgnored
                      ? `Showing ${hiddenInGroupCount} ignored item${hiddenInGroupCount === 1 ? "" : "s"} in this tab (I to hide again)`
                      : `${hiddenInGroupCount} ignored item${hiddenInGroupCount === 1 ? "" : "s"} hidden in this tab (I to show)`}
                  </Text>
                </Box>
              )}
              <Box marginTop={1} flexDirection="column">
                <Text dimColor>
                  ↑↓ move · ←→ switch tab · space select · a select-all · c clear · / search · r rescan
                </Text>
                <Text dimColor>
                  i ignore/unignore · I show/hide ignored · enter uninstall selected ({selected.size}) or current
                  item · q / Ctrl+C quit
                </Text>
              </Box>
            </>
          )}

          {screen === "confirm" && <ConfirmDialog items={pendingItems} />}

          {(screen === "running" || screen === "done") && (
            <RunLog
              results={results}
              total={pendingItems.length}
              inProgressName={runningName}
              finished={screen === "done"}
            />
          )}
        </>
      )}
    </Box>
  );
}
