import { run } from "./exec.js";

const TRASH_SCRIPT = `on run argv
  set thePath to POSIX file (item 1 of argv)
  tell application "Finder" to delete thePath
end run`;

/**
 * Moves a file/directory to the macOS Trash instead of unlinking it, so a
 * bad uninstall (wrong skill folder, wrong extension) is one Cmd+Z-in-Finder
 * away from recoverable. Path is passed as an argv item to osascript, never
 * interpolated into a shell string.
 */
export async function moveToTrash(absPath: string): Promise<{ ok: boolean; message: string }> {
  const res = await run("/usr/bin/osascript", ["-e", TRASH_SCRIPT, absPath]);
  if (res.ok) return { ok: true, message: `Moved to Trash: ${absPath}` };
  return { ok: false, message: res.stderr || "Finder refused to trash the item" };
}
