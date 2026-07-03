import type { ReactElement } from "react";
import { Box, Text } from "ink";
import type { GroupName } from "../lib/types.js";

export function CategoryTabs({
  groups,
  active,
  counts,
}: {
  groups: GroupName[];
  active: GroupName;
  counts: Record<string, number>;
}): ReactElement {
  return (
    <Box gap={2}>
      {groups.map((g) => {
        const isActive = g === active;
        return (
          <Text key={g} color={isActive ? "black" : "gray"} backgroundColor={isActive ? "cyan" : undefined}>
            {" "}
            {g} ({counts[g] ?? 0}){" "}
          </Text>
        );
      })}
    </Box>
  );
}
