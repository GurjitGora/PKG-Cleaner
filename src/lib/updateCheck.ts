/** Parses "1.2.3" into [1, 2, 3]. Returns undefined for anything non-standard (pre-release tags, etc.). */
function parseSemver(v: string): [number, number, number] | undefined {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isNewer(latest: string, current: string): boolean {
  const a = parseSemver(latest);
  const b = parseSemver(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

/**
 * Checks npm for a newer published version. Never throws and always
 * resolves within ~2s — a slow/offline network must not delay or break the
 * TUI, so any failure just means "no update notice shown."
 */
export async function checkForUpdate(currentVersion: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2_000);
    try {
      const res = await fetch("https://registry.npmjs.org/pkg-cleaner/latest", {
        signal: controller.signal,
      });
      if (!res.ok) return undefined;
      const data = (await res.json()) as { version?: string };
      if (data.version && isNewer(data.version, currentVersion)) return data.version;
      return undefined;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return undefined;
  }
}
