import fs from "fs";
import path from "path";

const TARGET_DIRS = ["src/routes", "src/components/mirats"];
const EXTENSIONS = [".tsx"];
const REGEX_BUTTON_ICON_NO_LABEL =
  /<Button[^>]*size=["']icon["'](?!.*aria-label)(?!.*tooltip)[^>]*>/g;

function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (EXTENSIONS.includes(path.extname(file))) {
      results.push(file);
    }
  });
  return results;
}

const allFiles = TARGET_DIRS.flatMap(getFiles);
let found = 0;
const limit = 30;

for (const file of allFiles) {
  if (found >= limit) break;
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    // Reset regex state for each line to avoid global flag issues if searching line by line
    // but the regex itself is complex. Let's just use matchAll on the whole content if possible,
    // but we need the line number.

    // Simpler: search the whole content and map indices to line numbers
    const matches = [...content.matchAll(REGEX_BUTTON_ICON_NO_LABEL)];
    for (const m of matches) {
      if (found >= limit) break;
      const index = m.index;
      const lineNumber = content.substring(0, index).split("\n").length;
      console.log(`${file}:${lineNumber} - ${m[0]}`);
      found++;
    }
    if (found >= limit) break;
    break; // We already processed all matches in this file via matchAll
  }
}
