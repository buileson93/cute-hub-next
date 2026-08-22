import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project();
const componentsDir = path.join(process.cwd(), "src/components/mirats");
const EXEMPT_LIST = [
  "AppShell.tsx",
  "StandardTable.tsx",
  "DataState.tsx",
  "PageHeader.tsx",
  "PageBody.tsx",
  "TopBar.tsx",
  "Sidebar.tsx",
  "MobileNav.tsx",
  "NotificationBell.tsx",
  "QrScanButton.tsx",
  "TzClock.tsx",
  "RecentPinnedRailButton.tsx",
];

function checkOrphaned() {
  const allFiles = project.addSourceFilesAtPaths(path.join(componentsDir, "**/*.tsx"));
  const orphaned: string[] = [];

  for (const sourceFile of allFiles) {
    const fileName = sourceFile.getBaseName();
    if (EXEMPT_LIST.includes(fileName)) continue;

    const references = sourceFile.getReferencingSourceFiles();
    if (references.length === 0) {
      orphaned.push(sourceFile.getFilePath());
    }
  }

  if (orphaned.length > 0) {
    console.error("LỖI: Phát hiện các component mồ côi (không được import ở đâu):");
    orphaned.forEach((p) => console.error(` - ${path.relative(process.cwd(), p)}`));
    process.exit(1);
  } else {
    console.log("Tất cả component đều đang được sử dụng.");
  }
}

checkOrphaned();
