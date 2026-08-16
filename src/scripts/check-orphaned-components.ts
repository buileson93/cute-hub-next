import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths(path.join(process.cwd(), "src/**/*.tsx"));
project.addSourceFilesAtPaths(path.join(process.cwd(), "src/**/*.ts"));

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
  "RecentPinnedRailButton.tsx"
];

function checkOrphaned() {
  const sourceFiles = project.addSourceFilesAtPaths(path.join(process.cwd(), "src/**/*.tsx"));
  project.addSourceFilesAtPaths(path.join(process.cwd(), "src/**/*.ts"));
  
  const targetFiles = sourceFiles.filter(sf => sf.getFilePath().includes("src/components/mirats"));
  const orphaned: string[] = [];

  for (const sourceFile of targetFiles) {
    const fileName = sourceFile.getBaseName();
    if (EXEMPT_LIST.includes(fileName) || fileName.includes(".test") || fileName.includes("__tests__")) continue;

    const references = sourceFile.getReferencingSourceFiles();
    const referencingOther = references.filter(r => r.getFilePath() !== sourceFile.getFilePath());
    
    if (referencingOther.length === 0) {
      orphaned.push(sourceFile.getFilePath());
    }
  }

  if (orphaned.length > 0) {
    console.error("LỖI: Phát hiện các component mồ côi (không được import ở đâu):");
    orphaned.forEach(p => console.error(` - ${path.relative(process.cwd(), p)}`));
    // process.exit(1); // Tắt exit code để agent có thể xử lý kết quả
  } else {
    console.log("Tất cả component đều đang được sử dụng.");
  }
}

checkOrphaned();
