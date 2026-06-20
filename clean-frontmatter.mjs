import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BLOG_DIR = "content/blog";
const KEYS_TO_REMOVE = new Set(["slug"]);
const APPLY = process.argv.includes("--apply");

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

const changed = [];
for (const path of walk(BLOG_DIR)) {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/(?<=\n)/);
  if (lines.length === 0 || lines[0].trim() !== "---") continue;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { end = i; break; }
  }
  if (end === -1) continue;

  const kept = [];
  const removed = [];
  lines.forEach((line, i) => {
    if (i >= 1 && i < end) {
      const key = line.split(":")[0].trim();
      if (KEYS_TO_REMOVE.has(key)) { removed.push(line.replace(/\n$/, "")); return; }
    }
    kept.push(line);
  });

  if (removed.length > 0) {
    changed.push({ path, removed });
    if (APPLY) writeFileSync(path, kept.join(""), "utf8");
  }
}

const mode = APPLY ? "APLICAT" : "PREVIZUALIZARE (nimic nu s-a modificat)";
console.log("[" + mode + "] Fisiere afectate: " + changed.length);
for (const item of changed) {
  console.log("  " + item.path);
  for (const r of item.removed) console.log("      sters: " + r);
}
if (!APPLY && changed.length > 0) {
  console.log("\nRuleaza din nou cu  node clean-frontmatter.mjs --apply  ca sa faci modificarile.");
}