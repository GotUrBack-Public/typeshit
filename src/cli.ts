import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const PROMPT = "naser2shell@𓆣 >> ";

export async function ask(question: string): Promise<string> {
  if (question) console.log(question);
  return (await rl.question(PROMPT)).trim();
}

export function closePrompt(): void {
  rl.close();
}
