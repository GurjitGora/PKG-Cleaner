/** Coarse "how stale is this" label — good enough for deciding whether something looks abandoned. */
export function formatRelativeAge(ms?: number): string {
  if (ms === undefined) return "";
  const deltaMs = Date.now() - ms;
  if (deltaMs < 0) return "";
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (deltaMs < hour) return `${Math.max(1, Math.floor(deltaMs / minute))}m ago`;
  if (deltaMs < day) return `${Math.floor(deltaMs / hour)}h ago`;
  if (deltaMs < month) return `${Math.floor(deltaMs / day)}d ago`;
  if (deltaMs < year) return `${Math.floor(deltaMs / month)}mo ago`;
  return `${Math.floor(deltaMs / year)}y ago`;
}
