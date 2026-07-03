import type { ReactElement } from "react";
import { Box, Text } from "ink";
import type { Item } from "../lib/types.js";
import { formatBytes } from "../lib/fsSize.js";

export function ItemList({
  items,
  cursorIndex,
  selected,
  windowSize,
  sourceLabels,
}: {
  items: Item[];
  cursorIndex: number;
  selected: Set<string>;
  windowSize: number;
  sourceLabels: Record<string, string>;
}): ReactElement {
  if (items.length === 0) {
    return (
      <Box paddingLeft={1}>
        <Text dimColor>No items in this category (or none match your search).</Text>
      </Box>
    );
  }

  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, cursorIndex - half);
  const end = Math.min(items.length, start + windowSize);
  start = Math.max(0, end - windowSize);
  const visible = items.slice(start, end);

  return (
    <Box flexDirection="column">
      {start > 0 && <Text dimColor>  ↑ {start} more above</Text>}
      {visible.map((item, i) => {
        const idx = start + i;
        const isCursor = idx === cursorIndex;
        const isSelected = selected.has(item.id);
        const checkbox = isSelected ? "[x]" : "[ ]";
        const cursorMark = isCursor ? ">" : " ";
        const sizeStr = formatBytes(item.sizeBytes);
        const tag = sourceLabels[item.source] ?? item.source;
        return (
          <Box key={item.id}>
            <Text color={isCursor ? "cyan" : undefined} inverse={isCursor}>
              {cursorMark} {checkbox} {item.name.padEnd(38).slice(0, 38)}{" "}
              {(item.version ?? "").padEnd(14).slice(0, 14)} {sizeStr.padEnd(9)}{" "}
              <Text dimColor>[{tag}]{item.manualOnly ? " (manual only)" : ""}</Text>
            </Text>
          </Box>
        );
      })}
      {end < items.length && <Text dimColor>  ↓ {items.length - end} more below</Text>}
    </Box>
  );
}
