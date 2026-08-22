import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SRC_DIR = "src";
const OUTPUT_FILE = "docs/ui/u6-baseline.json";

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(name);
    }
  });
  return fileList;
}

export function runMobileAuditLogic() {
  const allFiles = getFiles(SRC_DIR).filter(
    (f) => f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".css"),
  );
  const tsxFiles = allFiles.filter((f) => f.endsWith(".tsx"));

  function countPattern(pattern, files = allFiles) {
    let count = 0;
    files.forEach((f) => {
      try {
        const content = fs.readFileSync(f, "utf8");
        const matches = content.match(pattern);
        if (matches) count += matches.length;
      } catch (e) {}
    });
    return count;
  }

  // 1. Responsive prefixes
  const smCount = countPattern(/sm:/g);
  const mdCount = countPattern(/md:/g);
  const lgCount = countPattern(/lg:/g);
  const xlCount = countPattern(/xl:/g);
  const xxlCount = countPattern(/2xl:/g);
  const filesWithNoPrefix = tsxFiles.filter((f) => {
    try {
      const content = fs.readFileSync(f, "utf8");
      return !/(sm|md|lg|xl|2xl):/.test(content);
    } catch (e) {
      return false;
    }
  }).length;

  // 2. Hide/Show
  const mdHidden = countPattern(/md:hidden/g);
  const smHidden = countPattern(/sm:hidden/g);
  const lgHidden = countPattern(/lg:hidden/g);
  const hiddenWithPrefix = countPattern(/hidden\s+(sm|md|lg|xl|2xl):block/g);

  // 3. useIsMobile / matchMedia
  const isMobileFiles = tsxFiles.filter((f) => {
    try {
      const content = fs.readFileSync(f, "utf8");
      return /useIsMobile|matchMedia/.test(content);
    } catch (e) {
      return false;
    }
  });

  // 4. Fixed widths > 300px and overflow-x-auto
  const minWidthPx = countPattern(/min-w-\[\d{3,}px\]/g);
  const fixedWidthLarge = countPattern(/w-\[([3-9]\d{2}|\d{4,})px\]/g);
  const overflowXAuto = countPattern(/overflow-x-auto/g);

  const widthRiskFiles = tsxFiles
    .map((f) => {
      try {
        const content = fs.readFileSync(f, "utf8");
        const matches = (
          content.match(/min-w-\[\d{3,}px\]|w-\[[3-9]\d{2}px\]|overflow-x-auto/g) || []
        ).length;
        return { file: f, count: matches };
      } catch (e) {
        return { file: f, count: 0 };
      }
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // 5. Grid columns without prefix
  const gridColsNoPrefix = countPattern(/(?<!(sm|md|lg|xl|2xl):)grid-cols-[2-9]/g);

  // 6. Interactive elements with small heights (Rough count)
  const smallHeightsRaw = countPattern(/\bh-[678]\b/g, tsxFiles);

  // 7. Safe area and fixed bottom
  const safeAreaInset = countPattern(/env\(safe-area-inset/g);
  const fixedBottom = countPattern(/fixed\s+[^"]*bottom-/g);

  // 8. Large components (> 800 lines) with mobile mode
  const largeFiles = tsxFiles
    .map((f) => {
      try {
        return {
          file: f,
          lines: fs.readFileSync(f, "utf8").split("\n").length,
        };
      } catch (e) {
        return null;
      }
    })
    .filter((f) => f && f.lines >= 800);

  const largeCompMobileStatus = largeFiles.map((f) => {
    try {
      const content = fs.readFileSync(f.file, "utf8");
      const hasMobileMode = /isMobile|priority/.test(content);
      return { file: f.file, lines: f.lines, hasMobileMode };
    } catch (e) {
      return { file: f.file, lines: f.lines, hasMobileMode: false };
    }
  });

  // 9. Mobile tests
  const mobileTests = allFiles.filter((f) => {
    try {
      return f.includes(".test.") && /mobile/i.test(fs.readFileSync(f, "utf8"));
    } catch (e) {
      return false;
    }
  }).length;

  let commit = "unknown";
  try {
    commit = execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {}

  return {
    timestamp: new Date().toISOString(),
    commit,
    metrics: {
      responsivePrefixes: {
        sm: smCount,
        md: mdCount,
        lg: lgCount,
        xl: xlCount,
        "2xl": xxlCount,
        filesWithNoPrefix,
      },
      visibility: { mdHidden, smHidden, lgHidden, hiddenWithPrefix },
      mobileLogic: { count: isMobileFiles.length, files: isMobileFiles.map((f) => f) },
      widthRisks: { minWidthPx, fixedWidthLarge, overflowXAuto, topFiles: widthRiskFiles },
      gridNoPrefix: gridColsNoPrefix,
      smallTouchTargetsRaw: smallHeightsRaw,
      safeAreaAndFixed: { safeAreaInset, fixedBottom },
      largeComponentsMobileMode: largeCompMobileStatus,
      mobileTestsCount: mobileTests,
    },
  };
}

function audit() {
  const result = runMobileAuditLogic();
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log("Mobile Audit complete. Baseline saved to " + OUTPUT_FILE);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  audit();
}
