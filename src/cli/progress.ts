import type { Status } from "../types.js";

const BUG = [
  "   .==.",
  "  /-^^-\\\\",
  " ( o  o )",
  "  \\\\_==_/"
];

function paint(code: string, value: string): string {
  return process.stdout.isTTY ? `\\u001b[${code}m${value}\\u001b[0m` : value;
}

export function createProgress(total: number): (finding: string, title: string, status: Status) => void {
  const completedFindings = new Set<string>();
  const width = 28;
  return (finding, title, status) => {
    completedFindings.add(finding);
    const completed = Math.min(completedFindings.size, total);
    const ratio = Math.min(1, completed / Math.max(total, 1));
    const filled = Math.round(ratio * width);
    const track = "█".repeat(filled) + "░".repeat(width - filled);
    const stage = ratio < 0.34 ? "90" : ratio < 0.67 ? "31" : "31;1";
    const bug = BUG.map(line => [...line].map(char => {
      if (char === "o") return paint("97;1", char);
      return paint(stage, char);
    }).join(""));
    const percent = `${Math.round(ratio * 100).toString().padStart(3)}%`;
    if (process.stdout.isTTY) {
      process.stdout.write("\\u001b[6A\\u001b[0J");
      process.stdout.write(`${bug.join("\\n")}\\n`);
      process.stdout.write(`[${paint(stage, track)}] ${percent}  ${completed}/${total}\\n`);
      process.stdout.write(`${paint(status === "CONFIRMED" ? "31;1" : "90", `[${status}]`)} ${finding} ${title}\\n`);
    } else {
      console.log(`[${completed}/${total}] [${status}] ${finding} ${title}`);
    }
  };
}
