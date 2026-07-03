/** Pulls `description:` out of a `---` YAML frontmatter block, if present. Best-effort, no YAML dependency. */
export function extractFrontmatterDescription(content: string): string | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return undefined;
  const block = match[1];
  const line = block.split("\n").find((l) => /^description:/i.test(l.trim()));
  if (!line) return undefined;
  return line.replace(/^description:\s*/i, "").trim().replace(/^["']|["']$/g, "");
}
