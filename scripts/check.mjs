import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await check(file);
    else if (/\.(js|mjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      if (result.status !== 0)
        throw new Error(result.stderr || `检查失败：${file}`);
    }
  }
}

for (const directory of ["src", "scripts", "tests"]) await check(directory);
console.log("JavaScript 语法检查通过。");
