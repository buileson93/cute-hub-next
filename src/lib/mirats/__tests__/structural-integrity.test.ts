import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = process.cwd();
const COMPONENTS_DIR = path.join(PROJECT_ROOT, "src/components/mirats");
const ROUTES_DIR = path.join(PROJECT_ROOT, "src/routes");

// Danh sách component được phép mồ côi (chưa dùng hoặc là helper)
const EXEMPTED_ORPHANS = [
  "HeThongTruongEditor.tsx", // Được import động hoặc dùng trong node editor
  "ThanhPhanManager.tsx",
  "StandardTable.tsx" // Component dùng chung
];

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      results.push(fullPath);
    }
  });
  return results;
}

describe("MIRATS Integrity Guard - Automated Audit", () => {
  describe("A. Giao diện lắp sai (Tabs Mismatch)", () => {
    const allTsx = getFilesRecursively(ROUTES_DIR).concat(getFilesRecursively(COMPONENTS_DIR));
    
    allTsx.forEach(file => {
      it(`kiểm tra Tabs trong ${path.relative(PROJECT_ROOT, file)}`, () => {
        const content = fs.readFileSync(file, "utf-8");
        
        // 1. Kiểm tra lồng nhau
        const nestingMatch = content.match(/<TabsContent[^>]*>[\s\S]*?<TabsContent/g);
        expect(nestingMatch || [], `Phát hiện TabsContent lồng nhau trong ${file}`).toHaveLength(0);

        // 2. Kiểm tra TabsList vs TabsContent (nếu có TabsList thì nên có ít nhất một TabsContent trong cùng file)
        if (content.includes("<TabsList")) {
          const hasTabsContent = content.includes("<TabsContent");
          expect(hasTabsContent, `File ${file} có TabsList nhưng không thấy TabsContent trực tiếp.`).toBe(true);
        }

        // 3. Kiểm tra khớp value
        const triggerValues = Array.from(content.matchAll(/TabsTrigger[^>]*value="([^"]+)"/g)).map(m => m[1]);
        const contentValues = Array.from(content.matchAll(/TabsContent[^>]*value="([^"]+)"/g)).map(m => m[1]);
        
        if (triggerValues.length > 0 && content.includes("<TabsContent")) {
          triggerValues.forEach(val => {
            expect(contentValues, `TabsTrigger '${val}' không có TabsContent tương ứng trong ${file}`).toContain(val);
          });
        }
      });
    });
  });

  describe("D. Component mồ côi (Orphans Scan)", () => {
    it("quét các component mồ côi trong src/components/mirats", { timeout: 30000 }, () => {
      const allComponents = getFilesRecursively(COMPONENTS_DIR);
      const allFiles = getFilesRecursively(path.join(PROJECT_ROOT, "src"));
      
      const orphans: string[] = [];
      allComponents.forEach(comp => {
        const baseName = path.basename(comp, ".tsx");
        if (baseName === "index" || baseName.includes(".test") || EXEMPTED_ORPHANS.includes(baseName + ".tsx")) return;
        
        let isImported = false;
        allFiles.forEach(file => {
          if (file === comp) return;
          const content = fs.readFileSync(file, "utf-8");
          // Tìm kiếm theo tên component
          const importPattern = new RegExp(`import\\s+.*${baseName}`, 'g');
          if (importPattern.test(content) || content.includes(`<${baseName}`)) {
            isImported = true;
          }
        });
        
        if (!isImported) orphans.push(comp);
      });
      
      expect(orphans, `Phát hiện các component mồ côi: ${orphans.map(o => path.relative(PROJECT_ROOT, o))}`).toHaveLength(0);
    });
  });

  describe("H. State Consumer (Logic Reconnection)", () => {
    it("kiểm tra reorgOpen có component render tương ứng", () => {
      const routePath = path.join(ROUTES_DIR, "_app.he-thong.cay.tsx");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content.includes("reorgOpen={reorgOpen}"), "State 'reorgOpen' được khai báo nhưng chưa truyền vào CayThayDoiPanel hoặc component tương đương.").toBe(true);
    });
  });
});
