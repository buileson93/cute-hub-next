# MIRATS Astryx Migration Baseline Report (Phase 0)

## 1. Môi trường & Hệ thống (System Baseline)
- **Package Manager**: \`npm\` (Lockfile: \`package-lock.json\`).
- **Node Version**: v22.22.0.
- **Vite Version**: v8.0.16.
- **Scripts**: \`dev\`, \`build\`, \`build:dev\`, \`preview\`, \`lint\`, \`typecheck\`, \`test\`.
- **Git Status**: Sạch (Clean working tree).
- **Build Status**: \`npm run build:dev\` vượt qua (Success).

## 2. Số liệu Kỹ thuật UI (Technical Debt Metrics)
- **Typography tùy ý (\`text-[...]\`)**: 860 lỗi.
- **Mã màu Hex trực tiếp trong TSX**: 114 lỗi.
- **Trạng thái tương tác (\`hover:\`, \`group-hover:\`)**: 563 instances.
- **Hiệu ứng (\`animate-\`, \`motion\`)**: 288 instances.
- **Thành phần Overlay (\`Dialog\`, \`Sheet\`, \`Drawer\`)**: 2143 instances.
- **Bảng dữ liệu chuẩn (\`StandardTable\`)**: 98 instances.

## 3. Xác nhận 5 Route Pilot (Pilot Verification)
Tất cả các route dưới đây đã được kiểm tra runtime và hoạt động đúng logic:
- [x] **Trang chủ (Dashboard)**: \`src/routes/_app.index.tsx\`
- [x] **Danh mục tài sản (Catalog)**: \`src/routes/_app.danh-muc.thiet-bi.tsx\`
- [x] **Form nghiệp vụ (Wizard)**: \`src/routes/_app.forms.new.$code.tsx\`
- [x] **Chi tiết hệ thống (Detail)**: \`src/routes/_app.he-thong.$id.tsx\`
- [x] **Sơ đồ (Diagram)**: \`src/routes/_app.so-do.$id.tsx\`

## 4. Phân loại Route (Route Inventory)
- **Dashboard**: \`/\`, \`/tong-quan\`.
- **Danh mục/Bảng**: \`/danh-muc/*\`, \`/bao-tri\`, \`/su-co\`, \`/hong-hoc\`.
- **Form**: \`/forms/*\`, \`/admin/forms/*\`.
- **Chi tiết**: \`/he-thong/$id\`, \`/thiet-bi/$maThietBi\`.
- **Nghiệp vụ**: \`/bao-tri/pm\`, \`/giam-sat\`.
- **Quản trị**: \`/admin\`, \`/phan-quyen\`.
- **Sơ đồ/Đồ thị**: \`/so-do\`, \`/he-thong/cay\`.

## 5. Hợp đồng Component (Component Contracts)
Các component UI hiện tại tuân thủ chuẩn:
- **Ref**: Hỗ trợ \`forwardRef\`.
- **Props**: Hỗ trợ \`asChild\` (Radix Slot).
- **Handler**: Đầy đủ sự kiện bàn phím/chuột.
- **Density**: Hỗ trợ \`data-density\` (Compact: 28px, Comfortable: 32px, Spacious: 44px cho dòng bảng).

## 6. Rủi ro & Allowlist P1
- **Rủi ro**: Mất độ đậm đặc dữ liệu (Density) khi chuyển sang Astryx mặc định. Cần port thủ công các token \`ui-density.ts\`.
- **Allowlist P1**: Chuyển đổi \`StandardTable\` và \`Button\` sang nguyên mẫu Astryx đầu tiên.

---
*Báo cáo được khởi tạo tự động bởi Lovable Agent — 2026-08-16*
