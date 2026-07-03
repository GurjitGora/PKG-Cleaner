import type { ReactElement } from "react";
import { Box, Text } from "ink";
import type { UninstallResult } from "../lib/types.js";
import { Spinner } from "./Spinner.js";

export function RunLog({
  results,
  total,
  inProgressName,
  finished,
}: {
  results: UninstallResult[];
  total: number;
  inProgressName?: string;
  finished: boolean;
}): ReactElement {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={finished ? "green" : "cyan"} paddingX={1}>
      <Text bold>
        {finished ? "Done" : "Running"} ({results.length}/{total})
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {results.map((r) => (
          <Text key={r.item.id} color={r.ok ? "green" : "red"}>
            {r.ok ? "✔" : "✘"} {r.item.name} — {r.message}
          </Text>
        ))}
        {!finished && inProgressName && (
          <Text>
            <Spinner /> {inProgressName}
          </Text>
        )}
      </Box>
      {finished && (
        <Box marginTop={1}>
          <Text dimColor>Press any key to return to the list (rescans affected sources).</Text>
        </Box>
      )}
    </Box>
  );
}
