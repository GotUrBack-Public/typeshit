import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });

export async function ask(question: string): Promise<string> {
  return (await rl.question(question)).trim();
}

export function closePrompt(): void {
  rl.close();
}