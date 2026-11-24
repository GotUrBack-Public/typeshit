import type { Status } from "../types.js";

const BUG = [
  "   .==.",
  "  /-^^-\\",
  " ( o  o )",
  "  \\_==_/"
];

function paint(code: number, value: string): string {
  return process.stdout.isTTY ? `\u001b[${code}m${value}\u001b[0m` : value;
}

export function createProgress(total: number): (finding: string, title: string, status: Status) => void {
  let completed = 0;
  const width = 28;
  return (finding, title, status) => {
    completed++;
    const ratio = Math.min(1, completed / Math.max(total, 1));
    const filled = Math.round(ratio * width);
    const track = "█".repeat(filled) + "░".repeat(width - filled);
    const bugChars = BUG.reduce((sum, line) => sum + line.length, 0);\n    let seen = 0;\n    const bug = BUG.map(line => [...line].map(char => {\n      seen++;\n      return paint(seen <= ratio * bugChars ? 31 : 90, char);\n    }).join(""));
    const percent = `${Math.round(ratio * 100).toString().padStart(3)}%`;
    if (process.stdout.isTTY) {
      process.stdout.write("\u001b[6A\u001b[0J");
      process.stdout.write(`${bug.join("\n")}\n`);
      process.stdout.write(`[${paint(ratio > 0 ? 31 : 90, track)}] ${percent}  ${completed}/${total}\n`);
      process.stdout.write(`${paint(status === "CONFIRMED" ? 31 : 90, `[${status}]`)} ${finding} ${title}\n`);
    } else {
      console.log(`[${completed}/${total}] [${status}] ${finding} ${title}`);
    }
  };
}
