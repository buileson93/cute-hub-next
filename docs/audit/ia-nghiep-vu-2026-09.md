# Audit Kiến trúc thông tin & nghiệp vụ — 09/2026

Phạm vi: sidebar/menu, route, liên kết dữ liệu giữa các module quản lý tài sản.
Giai đoạn: **audit, không refactor**. Mọi kết luận đều kèm bằng chứng file:line.

## 1. Hiện trạng đã kiểm chứng

### 1.1 Nguồn menu
- `src/lib/mirats/nav-contract.ts` là nguồn duy nhất (workspaces → groups → items).
- `src/lib/mirats/nav/nav-config.ts` dẫn xuất, **trải phẳng children lên cùng cấp**
  (`navGroups()`), tức mọi phân cấp menu con trong contract đều bị mất khi render.
- `src/components/mirats/app-shell/Sidebar.tsx` render phẳng, **không xử lý `divider`
  và `hideOnMobile`**.

### 1.2 Đối chiếu menu ↔ route
- 100% mục menu trỏ tới route có thật (không có link 404).
- Một mục menu **không phải route**: `{ to: "#so-ly-lich-xem", label: "Xem & thống kê" }`
  (`nav-contract.ts:145`) — vốn chỉ là nhãn phân cách, nhưng do sidebar bỏ qua `divider`
  nên nó hiển thị như một mục bấm được và dẫn tới hash rỗng.
- 5 màn hình **hoàn chỉnh nhưng không có bất kỳ lối vào nào** trong UI:

| Route | Số dòng | Tham chiếu trong UI |
|---|---|---|
| `/bao-cao/do-tin-cay` | 949 | 0 |
| `/tep-tin` | 681 | 0 |
| `/topology` | 503 | 0 (chỉ text) |
| `/tai-lieu` | 427 | 0 |
| `/tuan-thu` | 201 | 0 |
| `/thiet-bi/danh-sach` | 72 | 0 |

- Route đã cố ý gộp và chỉ giữ redirect: `/sap-het-han`, `/nhap-lieu` — hợp lý, giữ nguyên.

### 1.3 Liên kết dữ liệu xuyên module

| Quan hệ | Kết luận | Bằng chứng |
|---|---|---|
| `su_co.thiet_bi_id` → tài sản, hai chiều | LINKED | schema `su_co`; `_app.su-co.$maSuCo.tsx:264`; `TabVanHanh.tsx:61` |
| `su_co.van_de_id` → RCA | LINKED | schema `su_co`; view `v_van_de` |
| `hong_hoc` ↔ `su_co` | **MISSING FK** — chỉ có cột text `hong_hoc.su_co` | schema `hong_hoc`; `_app.hong-hoc.$maHongHoc.tsx:123` khớp bằng chuỗi |
| `cong_viec_bao_tri` → su_co / van_de / bao_tri / thiet_bi | LINKED | schema `cong_viec_bao_tri` |
| `dot_bao_duong` ↔ phiếu công việc | PARTIAL — chỉ qua `dot_bao_duong_su_co`, không có FK trực tiếp | schema junction |
| Vật tư cấp phát → phiếu công việc | LINKED | `kho_giao_dich.lien_ket_cong_viec_id`; `_app.bao-tri.cong-viec.tsx:540` |
| Kiểm định/Hiệu chuẩn → tài sản | LINKED | `chung_chi_thiet_bi`; `TabHoSoPhapLy.tsx:64` |
| Bảng `giay_phep` (per-asset, có `thiet_bi_id NOT NULL`) | **ORPHAN** — `/giay-phep` không hề truy vấn `thiet_bi`; tab hồ sơ chỉ đọc `giay_phep_khai_thac` cấp hệ thống | grep `_app.giay-phep.tsx` = 0 kết quả `thiet_bi` |
| Biên bản (`form_submission.thiet_bi_id`, junction `form_submission_thiet_bi`) | PARTIAL — biên bản thấy tài sản, tài sản **không** thấy biên bản | `_app.forms.submissions.$id.tsx:133`; `ThietBiTepDinhKem.tsx:107` chỉ đọc tệp đính kèm |
| Bàn giao → sổ lý lịch | LINKED | `record-timeline.ts` kind `bg` |
| Kiểm kê → sổ lý lịch | **MISSING** — `TimelineKind` không có `kk`, chỉ ghi `thiet_bi.ngay_kiem_ke_ke_tiep` | `record-timeline.ts`; `kiem-ke.ts:86` |
| Kho hồ sơ dự án / Sổ công văn | LINKED, dữ liệu thật (`project_dossiers`, `du_an_cong_van`) | `_app.kho-ho-so.tsx:44`; `_app.so-cong-van.tsx:64` |

### 1.4 Thực thể trung tâm
`_app.thiet-bi.$maThietBi.tsx` **đã** là hub đúng nghĩa: 5 tab (Tổng quan, Vận hành,
Cấu hình, Hồ sơ, Nâng cao) với sub-tab Timeline / Bảo dưỡng / Sự cố / Thay thế /
Bàn giao / Linh kiện / Phần mềm / Kiểm định / Tệp. Đây là điểm mạnh nhất của hệ thống
và là lý do nhiều menu cấp 1 hiện tại bị dư thừa.

## 2. Danh sách vấn đề theo mức độ ưu tiên

| Mức | Module | Hiện trạng | Vấn đề | Tác động | Nguyên nhân | Đề xuất |
|---|---|---|---|---|---|---|
| P0 | Hỏng hóc ↔ Sự cố | `hong_hoc.su_co` là text tự do | Không truy ngược được sự cố gốc; thống kê MTTR/KPI sai | Bảng cũ nhập tay trước khi có `su_co` | Thêm `hong_hoc.su_co_id uuid` + backfill theo mã, giữ cột text làm legacy |
| P0 | Kiểm kê | Không ghi vào timeline tài sản | Sổ lý lịch thiếu hẳn một loại sự kiện bắt buộc; không chứng minh được đã kiểm kê | `TimelineKind` chưa có `kk` | Bổ sung kind `kk` vào `record-timeline.ts`, đọc từ `kiem_ke` |
| P0 | Giấy phép per-asset | Bảng `giay_phep` có `thiet_bi_id NOT NULL` nhưng không màn hình nào đọc | Dữ liệu ghi vào rồi biến mất khỏi UI; rủi ro hết hạn giấy phép không ai thấy | `/giay-phep` được xây trên `giay_phep_khai_thac` cấp hệ thống | Hiển thị `giay_phep` trong tab Hồ sơ của tài sản + tách rõ 2 loại giấy phép trong `/giay-phep` |
| P1 | Sidebar | Mục `#so-ly-lich-xem` render như link bấm được | Người dùng bấm vào không có gì xảy ra | `nav-config.toItem` bỏ `divider`, Sidebar không xử lý | Truyền `divider` qua nav-config và render thành nhãn nhóm, không phải link |
| P1 | 5 màn hình mồ côi | `/bao-cao/do-tin-cay` (949 dòng), `/tep-tin`, `/topology`, `/tai-lieu`, `/tuan-thu` | Công sức đã bỏ ra không ai truy cập được | Menu bị cắt gọt nhưng route giữ lại | Đưa vào menu hoặc gắn làm tab: xem mục 3 |
| P1 | Biên bản ↔ Tài sản | Một chiều | Từ tài sản không xem được biên bản nghiệm thu/bàn giao đã lập | `ThietBiTepDinhKem` chỉ đọc bảng tệp | Thêm mục "Biên bản liên quan" trong tab Hồ sơ, đọc `form_submission_thiet_bi` |
| P1 | Bảo dưỡng | 4 menu cấp 1: Bảo dưỡng, Phiếu công việc & KPI, PM, Đợt bảo dưỡng lớn | Người dùng không biết bắt đầu ở đâu; 3/4 là view của cùng vòng đời công việc | Menu phản ánh bảng dữ liệu, không phản ánh quy trình | Gộp thành 1 menu "Bảo dưỡng" với tab: Phiếu công việc / Kế hoạch PM / Đợt lớn / Lịch sử |
| P1 | Sự cố / Hỏng hóc / RCA | 3 menu ngang hàng | Không rõ khi nào ghi "sự cố" khi nào ghi "hỏng hóc" | Hai bảng có lịch sử khác nhau | Gộp thành "Sự cố & Hỏng hóc" (2 tab) + RCA là tab thứ 3, hoặc tối thiểu đổi tên rõ: "Sự cố vận hành" vs "Hỏng hóc vật tư/linh kiện" |
| P2 | Overview vs Xem & thống kê vs Độ tin cậy | 3 nơi thống kê, 1 nơi chết | Phân tán chỉ số | Thiếu chủ đích cho "trang báo cáo" | Một menu "Báo cáo" gom Độ tin cậy + KPI + Thống kê máy tính |
| P2 | Bản vẽ sơ đồ vs Topology | `/so-do` trong menu, `/topology` ẩn, chức năng chồng nhau | Trùng lặp công cụ | Hai thế hệ tính năng | Xác định 1 cái là chuẩn, cái kia redirect |
| P2 | `Biên bản` vs `Mẫu biên bản` | Đặt cạnh nhau ở menu cấp 1 | "Mẫu" là cấu hình quản trị, không phải việc hằng ngày | | Chuyển "Mẫu biên bản" xuống Quản trị hệ thống |
| P2 | `/thiet-bi` nhãn "Sổ lý lịch" nằm trong workspace tên "Sổ lý lịch" | Trùng tên 2 cấp | Breadcrumb đọc "Sổ lý lịch › Sổ lý lịch" | | Đổi nhãn workspace thành "Vận hành & Bảo dưỡng", item giữ "Sổ lý lịch tài sản" |
| P2 | `/danh-muc/thiet-bi` (Tài sản) vs `/thiet-bi` (Sổ lý lịch) vs `/thiet-bi/danh-sach` | 3 danh sách tài sản | Nhầm lẫn đâu là nguồn chuẩn | | Giữ `/danh-muc/thiet-bi` là quản trị danh mục, `/thiet-bi` là tra cứu vận hành, xoá/redirect `/thiet-bi/danh-sach` |
| P3 | `hideOnMobile` | Khai báo trong contract nhưng sidebar không dùng | Mobile hiển thị mục nặng (In nhãn QR, Bản vẽ) | | Cho nav-config truyền cờ này xuống |
| P3 | Quản trị hệ thống | 20 mục phẳng | Khó quét | Children bị trải phẳng | Cho phép nhóm con collapse trong sidebar |

## 3. Kiến trúc menu mục tiêu đề xuất

| Menu hiện tại | Hành động | Đích |
|---|---|---|
| Overview | giữ nguyên | `/` |
| Hệ thống, Liên kết | giữ nguyên | |
| Bản vẽ sơ đồ | gộp | với `/topology`, chọn 1 |
| Giấy phép, Kiểm định & Hiệu chuẩn | gộp | 1 menu "Tuân thủ & Chứng chỉ" (tận dụng `/tuan-thu` đang mồ côi), 2 tab |
| Bản quyền phần mềm, Thống kê Máy tính | chuyển thành menu con | dưới "Tuân thủ & Chứng chỉ" hoặc "Báo cáo" |
| Sổ lý lịch | đổi tên | "Sổ lý lịch tài sản" |
| Sự cố kỹ thuật, Hỏng hóc, Vấn đề (RCA) | gộp | "Sự cố" + 3 tab |
| Bảo dưỡng, Phiếu công việc & KPI, PM, Đợt bảo dưỡng lớn | gộp | "Bảo dưỡng" + 4 tab |
| Xem & thống kê (`#`) | loại bỏ | thay bằng nhãn phân cách thật |
| Bàn giao, Kiểm kê, In nhãn QR, Tuổi thọ | giữ nguyên | |
| Vật tư & Kho | giữ nguyên | |
| Biên bản | giữ nguyên | |
| Mẫu biên bản | chuyển | sang Quản trị hệ thống |
| Kho hồ sơ dự án, Sổ công văn | chuyển | sang workspace "Quản lý dự án" (đúng ngữ cảnh dữ liệu: cả hai đều khoá theo `du_an`) |
| — (mới hiện) | thêm vào menu | `/bao-cao/do-tin-cay`, `/tep-tin`, `/tai-lieu` |

Không đề xuất tạo module mới; toàn bộ là tổ chức lại menu + bổ sung 3 liên kết dữ liệu.

## 4. Roadmap

**Đợt 1 — P0, liên kết dữ liệu (backend + UI)**
1. `hong_hoc.su_co_id`: migration thêm cột + index + backfill; sửa `_app.hong-hoc.*` để chọn sự cố bằng combobox thay vì text. Ảnh hưởng: schema, RLS không đổi, 2 route, cần test backfill.
2. Kiểm kê vào timeline: chỉ sửa `record-timeline.ts` + `TabVanHanh`. Không đổi schema.
3. Giấy phép per-asset: thêm truy vấn `giay_phep` vào `TabHoSoPhapLy`; tách tab trong `/giay-phep`. Không đổi schema.

**Đợt 2 — P1, điều hướng (chỉ UI/menu)**
4. Sửa `nav-config` + `Sidebar` để hỗ trợ `divider` và `hideOnMobile`; bỏ mục `#`.
5. Đưa 5 route mồ côi vào IA mới.
6. Gộp nhóm Bảo dưỡng và nhóm Sự cố thành route có tab (giữ route cũ redirect để không hỏng bookmark/deep-link).
7. Thêm panel "Biên bản liên quan" trên tab Hồ sơ tài sản.

**Đợt 3 — P2/P3, tinh chỉnh**
8. Gom trang báo cáo; đổi nhãn workspace; chuyển Mẫu biên bản sang Quản trị; nhóm con collapse cho Quản trị hệ thống.

Kiểm thử bắt buộc mỗi đợt: `src/lib/mirats/__tests__/nav-contract.test.ts`,
`route-smoke.test.ts`, và Playwright điều hướng toàn menu.
