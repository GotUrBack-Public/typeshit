#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(here, "../src/index.ts");
const child = spawn(process.execPath, ["--import", "tsx", entry, ...process.argv.slice(2)], {
  stdio: "inherit"
});
child.on("error", error => {
  console.error(`Naser2Shell konnte nicht gestartet werden: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", code => {
  process.exitCode = code ?? 1;
});
