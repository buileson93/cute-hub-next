import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Helper đơn giản thay thế glob để tránh lỗi type/import
function getFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const res = path.resolve(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursively(res) : res;
  });
  return files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
}

const PROJECT_ROOT = process.cwd();
const ROUTES_DIR = path.join(PROJECT_ROOT, "src/routes");
const COMPONENTS_DIR = path.join(PROJECT_ROOT, "src/components/mirats");
const QUICK_FORMS_DIR = path.join(PROJECT_ROOT, "src/components/mirats/quick");

describe("MIRATS Integrity Guard - Automated Audit", () => {
  
  describe("A. Giao diện lắp sai (Tabs Mismatch)", () => {
    const allTsx = [...getFilesRecursively(ROUTES_DIR), ...getFilesRecursively(COMPONENTS_DIR)];
    
    allTsx.forEach((file: string) => {
      const relPath = path.relative(PROJECT_ROOT, file);
      it(`kiểm tra Tabs trong ${relPath}`, () => {
        const content = fs.readFileSync(file, "utf-8");
        if (!content.includes("<Tabs")) return;
        if (content.includes("integrity-ignore: tabs-managed-externally")) return;

        const triggerCount = (content.match(/<TabsTrigger/g) || []).length;
        const contentCount = (content.match(/<TabsContent/g) || []).length;

        if (triggerCount > 0) {
          expect(contentCount, `Tệp ${relPath} có ${triggerCount} TabsTrigger nhưng 0 TabsContent. Cấu trúc Tabs có thể bị hỏng.`).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("B. Handler rỗng (Silent Failure)", () => {
    if (fs.existsSync(QUICK_FORMS_DIR)) {
      const forms = getFilesRecursively(QUICK_FORMS_DIR);
      
      forms.forEach((file: string) => {
        const relPath = path.relative(PROJECT_ROOT, file);
        it(`kiểm tra handler rỗng trong ${relPath}`, () => {
          const content = fs.readFileSync(file, "utf-8");
          const criticalHandlers = ["onDone", "onSuccess", "onSave", "onConfirm", "onApplyDescription"];
          
          criticalHandlers.forEach(handler => {
            const regex = new RegExp(`${handler}=\\{\\(\\)\\s*=>\\s*\\{\\s*\\}\\}`, "g");
            const match = content.match(regex);
            
            if (match && !content.includes(`integrity-ignore: optional-handler`)) {
              expect(match, `Tệp ${relPath} chứa handler rỗng cho '${handler}'. Đây có thể là tính năng bị mất sau refactor.`).toBeNull();
            }
          });
        });
      });
    }
  });

  describe("C. Trường nhập liệu bị rụng (Form Payload Consistency)", () => {
    const forms = [
      { 
        path: "src/components/mirats/quick/SuCoMoiForm.tsx", 
        payloadFields: ["hien_tuong", "thoi_gian_bat_dau", "phan_loai", "nguyen_nhan", "bien_phap_xu_ly", "tinh_hinh_hien_tai", "ket_qua_khac_phuc"]
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
          const hasState = content.includes(`[${stateName},`) || content.includes(`set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}(`);
          
          expect(hasState, `Trường '${field}' có trong payload nhưng không thấy state '${stateName}' tương ứng trong UI của ${form.path}.`).toBe(true);
        });
      });
    });
  });

  describe("D. Component mồ côi (Orphans Scan)", () => {
    it("quét các component mồ côi trong src/components/mirats", () => {
      const allComponents = getFilesRecursively(COMPONENTS_DIR);
      const allSourceFiles = [
        ...getFilesRecursively(ROUTES_DIR),
        ...getFilesRecursively(COMPONENTS_DIR),
        ...getFilesRecursively(path.join(PROJECT_ROOT, "src/lib"))
      ];
      
      const importedPaths: Set<string> = new Set();
      allSourceFiles.forEach((file: string) => {
        const content = fs.readFileSync(file, "utf-8");
        const matches = content.match(/from\s+["']@\/components\/mirats\/([^"']+)["']/g);
        if (matches) {
          matches.forEach(m => {
            const rel = m.match(/@\/components\/mirats\/([^"']+)/)?.[1];
            if (rel) importedPaths.add(rel);
          });
        }
      });

      const orphans = allComponents.filter((comp: string) => {
        const fileName = path.basename(comp, ".tsx");
        const dirRel = path.relative(COMPONENTS_DIR, path.dirname(comp));
        const searchKey = dirRel === "" ? fileName : `${dirRel}/${fileName}`;
        
        if (fileName === "index" || fileName.startsWith("__")) return false;
        return !importedPaths.has(searchKey);
      });

      if (orphans.length > 0) {
        console.warn("CẢNH BÁO: Phát hiện các component mồ côi:", orphans.map(o => path.relative(PROJECT_ROOT, o)));
      }
    });
  });

  describe("E. Sổ lý lịch (SolyLich Entry Points)", () => {
    it("kiểm tra LyLichHeThongPanel có ít nhất một đường import/render từ UI chính", () => {
      const allTsx = [...getFilesRecursively(ROUTES_DIR), ...getFilesRecursively(COMPONENTS_DIR)];
      let found = false;
      allTsx.forEach((file: string) => {
        if (file.includes("LyLichLayerPanel.tsx")) return; // Bản thân file chứa component
        const content = fs.readFileSync(file, "utf-8");
        if (content.includes("LyLichHeThongPanel")) {
          found = true;
        }
      });
      expect(found, "LyLichHeThongPanel không được sử dụng ở bất kỳ đâu trong UI chính.").toBe(true);
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
