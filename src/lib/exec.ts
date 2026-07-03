import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFileCb);

export interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Run a binary directly (no shell), so package/skill names never get
 * interpreted by a shell. Never throws — failures come back as ok:false
 * so callers (scanners especially) can degrade gracefully.
 */
export async function run(
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout: opts.timeoutMs ?? 30_000,
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      maxBuffer: 64 * 1024 * 1024,
    });
    return { ok: true, stdout, stderr };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? String(err),
    };
  }
}

/**
 * Some tools (sdkman's `sdk`) only exist as bash functions sourced from an
 * init script, so they must run through an interactive-less login shell.
 * Kept separate from `run` because it goes through /bin/bash -lc.
 */
export async function runShell(
  script: string,
  opts: { timeoutMs?: number } = {}
): Promise<ExecResult> {
  return run("/bin/bash", ["-lc", script], opts);
}

export async function commandExists(cmd: string): Promise<boolean> {
  const res = await run("/usr/bin/which", [cmd]);
  return res.ok && res.stdout.trim().length > 0;
}
