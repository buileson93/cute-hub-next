import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = process.cwd();
const COMPONENTS_DIR = path.join(PROJECT_ROOT, "src/components/mirats");
const ROUTES_DIR = path.join(PROJECT_ROOT, "src/routes");

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
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
        if (content.includes("<Tabs") && content.includes("<TabsList")) {
          const hasTabsContent = content.includes("<TabsContent") || content.includes("TabsContent");
          expect(hasTabsContent, `File ${file} có TabsList nhưng không thấy TabsContent. Có thể các tab đang hiện cùng lúc.`).toBe(true);
        }
      });
    });
  });

  describe("B. Handler rỗng (Silent Failure)", () => {
    const criticalForms = [
      "src/components/mirats/quick/SuCoMoiForm.tsx",
      "src/components/mirats/quick/BaoTriMoiForm.tsx",
      "src/components/mirats/quick/HongHocMoiForm.tsx"
    ];

    criticalForms.forEach(formPath => {
      it(`kiểm tra handler rỗng trong ${formPath}`, () => {
        const fullPath = path.join(PROJECT_ROOT, formPath);
        if (!fs.existsSync(fullPath)) return;
        const content = fs.readFileSync(fullPath, "utf-8");
        
        // Bắt các handler dạng onSomething={() => {}} hoặc onSomething={() => undefined}
        const emptyHandlerRegex = /on[A-Z][a-zA-Z]+\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g;
        const matches = content.match(emptyHandlerRegex);
        expect(matches || [], `Phát hiện handler rỗng trong ${formPath}: ${matches}`).toHaveLength(0);
      });
    });
  });

  describe("C. Trường nhập liệu bị rụng (Form Payload Consistency)", () => {
    const forms = [
      {
        path: "src/components/mirats/quick/SuCoMoiForm.tsx",
        payloadFields: ["hien_tuong", "he_thong_id", "phan_loai", "anh_huong_dhb", "nguyen_nhan", "bien_phap_xu_ly"]
      },
      {
        path: "src/components/mirats/quick/BaoTriMoiForm.tsx",
        payloadFields: ["template_id", "he_thong_id", "loai_bao_tri", "ngay_bat_dau", "ngay_hoan_thanh", "ket_qua"]
      }
    ];

    forms.forEach(form => {
      it(`kiểm tra tính đầy đủ của trường nhập liệu trong ${form.path}`, () => {
        const fullPath = path.join(PROJECT_ROOT, form.path);
        if (!fs.existsSync(fullPath)) return;
        const content = fs.readFileSync(fullPath, "utf-8");
        
        form.payloadFields.forEach(field => {
          const stateName = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          // Check for variable usage or setter usage
          const hasState = content.includes(stateName) || content.includes(`set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}`);
          
          expect(hasState, `Trường '${field}' có trong payload nhưng không thấy state '${stateName}' tương ứng trong UI của ${form.path}.`).toBe(true);
        });
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
        if (baseName === "index" || baseName.includes(".test")) return;
        
        let isImported = false;
        allFiles.forEach(file => {
          if (file === comp) return;
          const content = fs.readFileSync(file, "utf-8");
          if (content.includes(baseName)) {
            isImported = true;
          }
        });
        
        if (!isImported) orphans.push(comp);
      });
      
      if (orphans.length > 0) {
        console.warn("CẢNH BÁO: Phát hiện các component mồ côi:", orphans.map(o => path.relative(PROJECT_ROOT, o)));
      }
    });
  });

  describe("E. Sổ lý lịch (SolyLich Entry Points)", () => {
    it("kiểm tra LyLichHeThongPanel có ít nhất một đường render từ UI chính", () => {
      const allTsx = [...getFilesRecursively(ROUTES_DIR), ...getFilesRecursively(COMPONENTS_DIR)];
      let found = false;
      allTsx.forEach((file: string) => {
        if (file.includes("LyLichLayerPanel.tsx")) return; 
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("<LyLichHeThongPanel") || content.includes("LyLichHeThongPanel")) {
          found = true;
        }
      });
      expect(found, "LyLichHeThongPanel không được sử dụng ở bất kỳ đâu trong UI chính.").toBe(true);
    });

    it("kiểm tra LyLichThanhPhanPanel có đường dẫn render từ UI chính", () => {
      const allTsx = [...getFilesRecursively(ROUTES_DIR), ...getFilesRecursively(COMPONENTS_DIR)];
      let found = false;
      allTsx.forEach((file: string) => {
        if (file.includes("LyLichLayerPanel.tsx")) return; 
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("<LyLichThanhPhanPanel") || content.includes("LyLichThanhPhanPanel")) {
          found = true;
        }
      });
      expect(found, "LyLichThanhPhanPanel không được sử dụng ở bất kỳ đâu trong UI chính.").toBe(true);
    });
  });

  describe("F. Chi tiết tài sản (Device Detail Tabs)", () => {
    it("kiểm tra sự tồn tại của các tab nghiệp vụ trọng yếu trong route chi tiết tài sản", () => {
      const detailRoute = path.join(ROUTES_DIR, "_app.thiet-bi.$maThietBi.tsx");
      if (!fs.existsSync(detailRoute)) return;
      const content = fs.readFileSync(detailRoute, "utf-8");
      
      const essentialTabs = ["tong-quan", "ly-lich", "van-hanh", "cau-hinh", "phap-ly", "nang-cao"];
      essentialTabs.forEach(tab => {
        expect(content.includes(`value="${tab}"`), `Tab '${tab}' bị thiếu trong trang chi tiết tài sản.`).toBe(true);
      });
    });
  });

  describe("G. Lỗi truyền null (Null Props Audit)", () => {
    it("quét các component con không được truyền null cho các prop chức năng", () => {
      const detailRoute = path.join(ROUTES_DIR, "_app.thiet-bi.$maThietBi.tsx");
      if (!fs.existsSync(detailRoute)) return;
      const content = fs.readFileSync(detailRoute, "utf-8");
      
      const nullProps = ["TelemetryPanel={null}", "AllocationPanel={null}", "LifecyclePanel={null}"];
      nullProps.forEach(pattern => {
        expect(content.includes(pattern), `Phát hiện lỗi truyền null: '${pattern}' trong route chi tiết tài sản.`).toBe(false);
      });
    });
  });
});
