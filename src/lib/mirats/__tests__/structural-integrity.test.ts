import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

// Cấu hình các file và thư mục cần kiểm tra
const ROUTES_DIR = "src/routes";
const COMPONENTS_DIR = "src/components/mirats";
const QUICK_FORMS_DIR = "src/components/mirats/quick";

describe("MIRATS Integrity Guard - Automated Audit", () => {
  
  describe("A. Giao diện lắp sai (Tabs Mismatch)", () => {
    const files = globSync("{src/routes/**/*.tsx,src/components/mirats/**/*.tsx}");
    
    files.forEach((file: string) => {
      it(`kiểm tra Tabs trong ${file}`, () => {
        const content = fs.readFileSync(file, "utf-8");
        if (!content.includes("<Tabs")) return; // Bỏ qua nếu không dùng Tabs
        
        // Bỏ qua nếu có comment miễn trừ
        if (content.includes("integrity-ignore: tabs-managed-externally")) return;

        const triggerCount = (content.match(/<TabsTrigger/g) || []).length;
        const contentCount = (content.match(/<TabsContent/g) || []).length;

        if (triggerCount > 0) {
          expect(contentCount, `Tệp ${file} có ${triggerCount} TabsTrigger nhưng 0 TabsContent. Cấu trúc Tabs có thể bị hỏng.`).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("B. Handler rỗng (Silent Failure)", () => {
    const forms = globSync(`${QUICK_FORMS_DIR}/*.tsx`);
    
    forms.forEach((file: string) => {
      it(`kiểm tra handler rỗng trong ${file}`, () => {
        const content = fs.readFileSync(file, "utf-8");
        
        // Tìm các prop bắt đầu bằng on gán lambda rỗng: onSomething={() => {}} hoặc onSomething={() => { }}
        // Tập trung vào các handler quan trọng thường dùng cho callback thành công hoặc đóng form
        const criticalHandlers = ["onDone", "onSuccess", "onSave", "onConfirm", "onApplyDescription"];
        
        criticalHandlers.forEach(handler => {
          const regex = new RegExp(`${handler}=\\{\\(\\)\\s*=>\\s*\\{\\s*\\}\\}`, "g");
          const match = content.match(regex);
          
          if (match && !content.includes(`integrity-ignore: optional-handler`)) {
            // Chúng ta báo lỗi nếu handler quan trọng bị rỗng mà không có giải trình
            expect(match, `Tệp ${file} chứa handler rỗng cho '${handler}'. Đây có thể là tính năng bị mất sau refactor.`).toBeNull();
          }
        });
      });
    });
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
        if (!fs.existsSync(form.path)) return;
        const content = fs.readFileSync(form.path, "utf-8");
        
        form.payloadFields.forEach(field => {
          // Kiểm tra xem field có xuất hiện trong UI code không (Input, Select, Combobox, Textarea...)
          // Cách kiểm tra đơn giản: tìm sự hiện diện của setter hoặc biến state tương ứng (camelCase)
          const stateName = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          const hasState = content.includes(`[${stateName},`) || content.includes(`set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}(`);
          
          expect(hasState, `Trường '${field}' có trong payload nhưng không thấy state '${stateName}' tương ứng trong UI.`).toBe(true);
        });
      });
    });
  });

  describe("D. Component mồ côi (Orphans Scan)", () => {
    it("quét các component mồ côi trong src/components/mirats", () => {
      const allComponents = globSync("src/components/mirats/**/*.tsx");
      const allSourceFiles = globSync("src/{routes,components,lib}/**/*.{ts,tsx}");
      
      const importedPaths: Set<string> = new Set();
      
      allSourceFiles.forEach((file: string) => {
        const content = fs.readFileSync(file, "utf-8");
        // Tìm các import từ @/components/mirats
        const matches = content.match(/from\s+["']@\/components\/mirats\/([^"']+)["']/g);
        if (matches) {
          matches.forEach(m => {
            const relPath = m.match(/@\/components\/mirats\/([^"']+)/)?.[1];
            if (relPath) importedPaths.add(relPath);
          });
        }
      });

      const orphans = allComponents.filter((comp: string) => {
        const fileName = path.basename(comp, ".tsx");
        const dirName = path.dirname(comp).replace("src/components/mirats/", "");
        const searchPath = dirName === "src/components/mirats" ? fileName : `${dirName}/${fileName}`;
        
        // Bỏ qua các file index hoặc file ui cơ bản
        if (fileName === "index") return false;
        
        return !importedPaths.has(searchPath);
      });

      // Ở giai đoạn này chúng ta chỉ log cảnh báo chứ không fail test cho orphans
      if (orphans.length > 0) {
        console.warn("CẢNH BÁO: Phát hiện các component mồ côi (không được import ở đâu):", orphans);
      }
    });
  });
});
