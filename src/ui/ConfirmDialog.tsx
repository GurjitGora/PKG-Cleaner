import type { ReactElement } from "react";
import { Box, Text } from "ink";
import type { Item } from "../lib/types.js";

export function ConfirmDialog({ items }: { items: Item[] }): ReactElement {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">
        Confirm: about to run {items.length} action{items.length === 1 ? "" : "s"}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {items.slice(0, 20).map((item) => (
          <Text key={item.id}>
            • {item.name} — <Text dimColor>{item.uninstallPreview}</Text>
          </Text>
        ))}
        {items.length > 20 && <Text dimColor>...and {items.length - 20} more</Text>}
      </Box>
      <Box marginTop={1}>
        <Text>
          Press <Text bold color="green">y</Text> / Enter to proceed, <Text bold color="red">n</Text> / Esc to cancel.
        </Text>
      </Box>
    </Box>
  );
}
