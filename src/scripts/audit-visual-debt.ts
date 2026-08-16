import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths(path.join(process.cwd(), "src/**/*.tsx"));

const routesDir = path.join(process.cwd(), "src/routes");

function checkVisualDebt() {
  const sourceFiles = project.getSourceFiles().filter(sf => sf.getFilePath().startsWith(routesDir));
  let issuesFound = 0;

  console.log("--- MIRATS Visual Debt Audit (Hardcoded Values) ---");

  for (const sourceFile of sourceFiles) {
    const content = sourceFile.getFullText();
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    
    // 1. Check for hardcoded hex colors (excluding Recharts/Flow specific configs if they are in arrays)
    const hexMatch = content.match(/#[0-9A-Fa-f]{6}/g);
    if (hexMatch) {
      hexMatch.forEach(hex => {
        // Simple heuristic: ignore hex codes that are likely in a mapping object or chart config
        // but report them if they appear in JSX strings
        if (content.includes(`"${hex}"`) || content.includes(`'${hex}'`)) {
            console.warn(`[WARN] Hardcoded Hex: ${hex} in ${filePath}`);
            issuesFound++;
        }
      });
    }

    // 2. Check for arbitrary tailwind spacing/sizing (e.g., mt-[13px])
    const arbitraryMatch = content.match(/(?:mt|mb|ml|mr|p|pt|pb|pl|pr|w|h|gap|rounded|text|bg)-\[[^\]]+\]/g);
    if (arbitraryMatch) {
      arbitraryMatch.forEach(match => {
        console.warn(`[WARN] Arbitrary Tailwind Value: ${match} in ${filePath}`);
        issuesFound++;
      });
    }

    // 3. Check for inline style usage (basic check)
    if (content.includes("style={{")) {
        console.warn(`[WARN] Inline Style Usage in ${filePath}`);
        issuesFound++;
    }
  }

  console.log(`\nAudit complete. Found ${issuesFound} potential visual debt items.`);
}

checkVisualDebt();