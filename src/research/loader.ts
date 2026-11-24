import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ResearchDocument } from "../types.js";

async function markdownFiles(root: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) found.push(full);
    }
  }
  await walk(root);
  return found;
}

function extractSteps(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const steps: string[] = [];
  let inCode = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const match = line.match(/^\s*(?:(\d+)[.)]|[-*])\s+(.+)$/);
    if (match) steps.push(match[2].trim());
  }
  return steps;
}

export async function loadResearch(root: string): Promise<ResearchDocument[]> {
  const files = await markdownFiles(root);
  const docs: ResearchDocument[] = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const relative = path.relative(root, file);
    const finding = relative.split(path.sep)[0] || "library";
    docs.push({ finding, file: relative, content, steps: extractSteps(content) });
  }
  return docs;
}