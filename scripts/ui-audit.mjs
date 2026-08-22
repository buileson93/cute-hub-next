import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const TARGET_DIRS = ["src"];
const EXTENSIONS = [".tsx", ".ts"];

// Regex patterns
const REGEX_TEXT_PX = /text-\[(\d+)px\]/g;
const REGEX_TEXT_PRESET = /\btext-(xs|sm|base)\b/g;
const REGEX_TW_PALETTE = /\b(bg|text|border)-([a-z]+)-(\d+)\b/g;
const REGEX_HEX = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
const REGEX_BUTTON_VARIANT = /<Button[^>]*variant=["']([^"']+)["']/g;
const REGEX_BUTTON_ICON_NO_LABEL =
  /<Button[^>]*size=["']icon["'](?!.*aria-label)(?!.*tooltip)[^>]*>/g;
const REGEX_PAGE_HEADER = /<PageHeader/g;

function getFiles(dir) {
  let results = [];
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

export function runAuditLogic() {
  const allFiles = TARGET_DIRS.flatMap(getFiles);
  const stats = {
    textPx: { total: 0, byValue: {}, byFile: {} },
    textPresets: { xs: 0, sm: 0, base: 0 },
    paletteColors: 0,
    hexColors: 0,
    buttonVariants: {},
    iconNoLabel: 0,
    pageHeaderCount: 0,
    routeCount: 0,
    fileViolations: [],
  };

  allFiles.forEach((file) => {
    // Chỉ audit trong src/routes và src/components/mirats cho các chỉ số quan trọng
    const isCriticalPath = file.includes("src/routes") || file.includes("src/components/mirats");

    const content = fs.readFileSync(file, "utf8");
    let fileViolationCount = 0;

    // 1. text-[Npx]
    let match;
    // Reset regex state
    REGEX_TEXT_PX.lastIndex = 0;
    while ((match = REGEX_TEXT_PX.exec(content)) !== null) {
      if (!isCriticalPath) continue;
      const val = match[1] + "px";
      stats.textPx.total++;
      stats.textPx.byValue[val] = (stats.textPx.byValue[val] || 0) + 1;
      stats.textPx.byFile[file] = (stats.textPx.byFile[file] || 0) + 1;
      fileViolationCount++;
    }

    // 2. text-xs, text-sm, text-base (src/routes & src/components/mirats)
    if (isCriticalPath) {
      REGEX_TEXT_PRESET.lastIndex = 0;
      while ((match = REGEX_TEXT_PRESET.exec(content)) !== null) {
        stats.textPresets[match[1]]++;
      }
    }

    // 3. Tailwind palette colors
    REGEX_TW_PALETTE.lastIndex = 0;
    while ((match = REGEX_TW_PALETTE.exec(content)) !== null) {
      if (!isCriticalPath) continue;
      stats.paletteColors++;
      fileViolationCount++;
    }

    // 4. HEX colors
    REGEX_HEX.lastIndex = 0;
    while ((match = REGEX_HEX.exec(content)) !== null) {
      if (!isCriticalPath) continue;
      if (file.includes("scripts/") || file.includes("src/lib/mirats/ui")) continue;
      stats.hexColors++;
      fileViolationCount++;
    }

    // 5. Button variants
    REGEX_BUTTON_VARIANT.lastIndex = 0;
    while ((match = REGEX_BUTTON_VARIANT.exec(content)) !== null) {
      const variant = match[1];
      stats.buttonVariants[variant] = (stats.buttonVariants[variant] || 0) + 1;
    }

    // 6. size="icon" no label/tooltip
    if (isCriticalPath) {
      const iconMatches = content.match(REGEX_BUTTON_ICON_NO_LABEL);
      if (iconMatches) {
        stats.iconNoLabel += iconMatches.length;
        fileViolationCount += iconMatches.length;
      }
    }

    // 7. PageHeader in routes
    if (file.includes("src/routes")) {
      stats.routeCount++;
      REGEX_PAGE_HEADER.lastIndex = 0;
      if (REGEX_PAGE_HEADER.test(content)) {
        stats.pageHeaderCount++;
      }
    }

    // 8. Icon-only button without label (A11y)
    if (isCriticalPath) {
      REGEX_BUTTON_ICON_NO_LABEL.lastIndex = 0;
      const iconMatches = content.match(REGEX_BUTTON_ICON_NO_LABEL);
      if (iconMatches) {
        stats.iconNoLabel += iconMatches.length;
        fileViolationCount += iconMatches.length;
      }
    }

    if (fileViolationCount > 0) {
      stats.fileViolations.push({ file, count: fileViolationCount });
    }
  });

  return stats;
}

function audit() {
  const stats = runAuditLogic();

  // Sort top 20 files
  stats.fileViolations.sort((a, b) => b.count - a.count);
  const top20 = stats.fileViolations.slice(0, 20);

  // Commit Hash
  let commitHash = "unknown";
  try {
    commitHash = execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {}

  const result = {
    date: new Date().toISOString(),
    commitHash,
    summary: {
      textPxTotal: stats.textPx.total,
      textPxByValue: stats.textPx.byValue,
      textPresets: stats.textPresets,
      paletteColors: stats.paletteColors,
      hexColors: stats.hexColors,
      buttonVariants: stats.buttonVariants,
      iconNoLabel: stats.iconNoLabel,
      pageHeaderRatio: `${stats.pageHeaderCount}/${stats.routeCount}`,
    },
    top20Files: top20,
  };

  // Log to console
  console.log("=== UI AUDIT REPORT ===");
  console.table({
    "text-[Npx] Total": stats.textPx.total,
    "text-xs": stats.textPresets.xs,
    "text-sm": stats.textPresets.sm,
    "text-base": stats.textPresets.base,
    "Palette Colors": stats.paletteColors,
    "HEX Colors": stats.hexColors,
    "Icon no Label": stats.iconNoLabel,
    "PageHeader Ratio": `${stats.pageHeaderCount}/${stats.routeCount}`,
  });
  console.log("\n--- Button Variants ---");
  console.table(stats.buttonVariants);
  console.log("\n--- Top 20 Violation Files ---");
  console.table(top20);

  // Write to file
  const docsDir = path.join(process.cwd(), "docs", "ui");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(docsDir, "u4-baseline.json"), JSON.stringify(result, null, 2));
  console.log(`\nResults written to docs/ui/u4-baseline.json`);
}

// Only run audit if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  audit();
}
