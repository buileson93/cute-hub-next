import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, textResult } from "./_shared";

/**
 * Skill card cho AI agent bên ngoài (Claude/ChatGPT/Codex...).
 * Giúp agent hiểu ngữ cảnh nghiệp vụ MIRATS mà không cần đoán.
 * Cập nhật đồng bộ với AI_RULES của template AllInOne XLSX.
 */
const SKILLS = {
  overview: `# MIRATS – Trợ lý dữ liệu vận hành khai thác

MIRATS là hệ thống quản lý tài sản kỹ thuật của Công ty Quản lý bay miền Trung (VATM).
Nghiệp vụ chính: quản lý hệ thống kỹ thuật, tài sản, giấy phép khai thác, bảo dưỡng định kỳ, sự cố, hỏng hóc, dự án.

## Vai trò (app_role)
- **admin** – toàn quyền hệ thống
- **phong_kt** – Phòng Kỹ thuật (thiết lập chuẩn, phê duyệt)
- **phu_trach_dv** – Phụ trách đơn vị (duyệt phiếu, ký biên bản)
- **to_truong** – Tổ trưởng
- **ktv** – Kỹ thuật viên (tác nghiệp trực tiếp)
- **quan_ly_du_an** – Quản lý dự án
- **readonly** – chỉ xem

## Đơn vị (dm_don_vi.ma)
CRA (Cam Ranh), CLA (Chu Lai), THO (Thọ Xuân), PCA (Phù Cát), PBA (Pleiku), PLK (Phòng Kỹ thuật).

## Nguyên tắc trả lời
- Luôn tiếng Việt.
- Chỉ dùng dữ liệu tool trả về, không đoán số liệu.
- Có id ⇒ hiển thị kèm mã (\`ma_thiet_bi\`, \`ma_he_thong\`, \`so_giay_phep\`).
- Trước khi ghi (create_*), TÓM TẮT lại cho user duyệt.
`,

  data_model: `# Bản đồ dữ liệu MIRATS

## Cây 4 lớp
\`\`\`
dm_he_thong (Hệ thống kỹ thuật – VD: ILS/DME/AWOS)
  └─ he_thong_thanh_phan (Thành phần – vị trí chức năng, VD: Transmitter, Antenna)
      └─ thiet_bi (Tài sản vật lý – có S/N, model)
          └─ linh_kien (Linh kiện gắn trong tài sản)
\`\`\`

**Quan trọng**: "Thành phần hệ thống" ≠ "Tài sản". Thành phần là chỗ trống chức năng; tài sản được **gắn vào** thành phần và có thể tháo/thay bằng tài sản khác. Xem \`_shared\` API \`thiet_bi_cap_phat\`, \`thiet_bi_vong_doi\` cho lịch sử gắn-tháo.

## Nghiệp vụ ngang
- **giay_phep_khai_thac (GPKT)** – gắn với **dm_he_thong** (không phải tài sản). Có \`ngay_het_han\`; sinh cảnh báo qua \`canh_bao_het_han_log\`.
- **giay_phep** – giấy phép cấp cho **tài sản** (khác GPKT).
- **bao_tri** – phiếu bảo dưỡng đơn lẻ.
- **dot_bao_duong** – **đợt bảo dưỡng lớn** (2 đợt/năm/đơn vị), gồm nhiều \`dot_bao_duong_hang_muc\` → sinh phiếu bảo dưỡng con.
- **su_co** → có thể mở **van_de** (vấn đề tồn đọng cần giải quyết).
- **hong_hoc** – hỏng hóc tài sản, có thể thay thế bằng tài sản khác.
- **form_template** + **form_submission** + **form_submission_item_result** – hệ thống biểu mẫu động (biên bản, checklist). \`form_check_item\` có \`metric_key\` để rút chỉ số về **v_metric_timeseries** phục vụ Dashboard.

## Enums thường dùng
- \`app_role\`: admin, phong_kt, phu_trach_dv, ktv, readonly, quan_ly_du_an, to_truong
- \`dot_bao_duong_trang_thai\`: nhap → mo → dang_thuc_hien → dong (hoặc huy)
- \`dot_bao_duong_hm_ket_qua\`: dat / khong_dat / khac
- \`cong_viec_trang_thai\`: chua_bat_dau / dang_lam / cho_duyet / hoan_thanh / qua_han
- \`form_submission_status\`: draft / submitted / approved / returned
- \`ticket_trang_thai\`: moi / dang_xu_ly / cho_phan_hoi / hoan_thanh / tu_choi / dong

## Truy vấn nâng cao
- \`run_select_query\` – SELECT tuỳ ý (RLS áp dụng, ≤500 dòng).
- \`describe_schema\` – lấy schema chi tiết trước khi viết SQL.
- \`get_row\` / \`list_table\` / \`count_by\` – helper cho các bảng phổ biến.
`,

  workflows: `# Luồng nghiệp vụ MIRATS

## 1. Bảo dưỡng đơn lẻ
1. \`form_template\` (mẫu PL-BD-*) → user tạo \`form_submission\`.
2. Ghi kết quả từng mục vào \`form_submission_item_result\` (kèm \`metric_key\`, \`dat/khong_dat\`).
3. Trigger \`fsir_enrich\` chấm tự động → cập nhật \`v_metric_timeseries\`.
4. Kết quả đồng bộ về **Nhật ký khai thác hệ thống** (realtime).

## 2. Đợt bảo dưỡng lớn (2 đợt/năm)
1. \`dot_bao_duong\` (nhap → mo).
2. Thêm \`dot_bao_duong_hang_muc\` từng hệ thống × đơn vị.
3. Đơn vị thực hiện → nộp biên bản (\`dot_bao_duong_bien_ban\`).
4. Phòng KT phê duyệt (\`dot_hm_approve\`) hoặc trả lại (\`dot_hm_reject\`).
5. Đóng đợt → sinh báo cáo tổng hợp (\`dot_bao_cao_tong_hop\`).

## 3. Sự cố → Vấn đề
1. \`agent_add_su_co\` (RPC) tạo bản ghi \`su_co\` – yêu cầu tên hệ thống + hiện tượng.
2. Có thể liên kết \`hong_hoc\` nếu do tài sản hỏng.
3. Sự cố lặp/tồn đọng → mở \`van_de\` (dùng \`dong_van_de\` để đóng).

## 4. Giấy phép khai thác (GPKT)
1. Nhập PDF: regex parser trước, AI fallback (GpktImportDialog).
2. Dedup theo (\`so_giay_phep\`, \`co_quan_cap\`) – cảnh báo trùng.
3. Gán \`giay_phep_khai_thac.he_thong_id\`.
4. \`canh_bao_het_han_log\` sinh cảnh báo T-90/T-30/T-7 → gửi email/telegram.

## 5. Tháo/lắp tài sản vào thành phần
- \`_mo_gan_va_vong_doi\` (lắp), \`_dong_gan_va_vong_doi\` (tháo) – luôn giữ lịch sử ở \`thiet_bi_vong_doi\`.
- Xem lịch sử qua RPC \`thanh_phan_tai_san_history(_tp_id)\`.

## 6. Kiểm kê
- \`ghi_kiem_ke\` cập nhật tình trạng tài sản kèm GPS + ảnh; chu kỳ mặc định 365 ngày.
`,

  glossary: `# Từ điển MIRATS

| Từ | Ý nghĩa |
|---|---|
| GPKT | Giấy phép khai thác hệ thống (gắn dm_he_thong) |
| TPHT | Thành phần hệ thống (he_thong_thanh_phan) – vị trí chức năng |
| Tài sản | thiet_bi – vật lý có S/N |
| Model | dm_model – tên mẫu + P/N |
| MTBF | Mean Time Between Failures (giờ) – tính từ v_metric_timeseries |
| MTTR | Mean Time To Repair (giờ) |
| Uptime | Tỉ lệ vận hành = 1 - downtime/total |
| HP | Health Points – điểm sức khoẻ hệ thống (0–100) từ chỉ số vận hành |
| Đợt BD | Đợt bảo dưỡng lớn – 2 đợt/năm/đơn vị |
| Hạng mục | dot_bao_duong_hang_muc – 1 hệ thống trong 1 đợt |
| Biên bản | form_submission đã submit + ký (form_submission_signature) |
| PL-BD-* | Mẫu phiếu bảo dưỡng định kỳ |
| PL-KT-* | Mẫu phiếu kiểm tra kỹ thuật |
`,

  anomaly_rules: `# Luật cảnh báo bất hợp lý khi nhập liệu
(Đồng bộ với AI_RULES của template AllInOne)

- **sn_dup** (warn) – Trùng S/N với tài sản khác → cảnh báo mềm, KHÔNG chặn.
- **year_out_of_range** (block) – nam_san_xuat < 1990 hoặc > năm hiện tại.
- **year_vs_ngay_dua_vao** (block) – nam_san_xuat > YEAR(ngay_dua_vao_su_dung).
- **model_mismatch** (warn) – model.nha_san_xuat_id ≠ tài sản.nha_san_xuat_id.
- **price_outlier** (warn) – giá lệch > 3× median cùng loại_thiet_bi.
- **hs_trung_gpkt** (warn) – Hệ thống đã có GPKT còn hạn – cảnh báo trùng khi thêm mới.
- **ngay_het_han_qua_khu** (block) – ngay_het_han < today khi tạo mới GPKT.
- **gpkt_khong_thuoc_ht** (block) – Gán GPKT cho tài sản/thành phần (phải gán hệ thống).
- **bd_ngoai_dot** (info) – Phiếu BD tạo ngoài kỳ đợt đang mở → gợi ý gộp vào đợt.
- **su_co_thieu_hs** (block) – Tạo sự cố thiếu tên hệ thống.
- **kiem_ke_gps_thieu** (warn) – Kiểm kê thiếu tọa độ GPS.

Agent phải:
1. Kiểm tra ANOMALY trước khi gọi create_*.
2. Nếu **block** → không gọi, báo user lý do.
3. Nếu **warn** → hỏi user xác nhận trước.
`,

  tools_index: `# Bản đồ tool MIRATS-MCP

## Tra cứu
- \`search_global\` – full-text nhanh (tài sản, giấy phép, biểu mẫu).
- \`describe_schema\` – schema đầy đủ.
- \`run_select_query\` – SELECT tuỳ ý (≤500 dòng, RLS).
- \`list_table\`, \`get_row\`, \`count_by\` – helper các bảng phổ biến.
- \`dashboard_stats\` – KPI tổng quan.

## Hệ thống & thành phần
- \`get_he_thong_ly_lich(id)\` – sổ lý lịch hệ thống snapshot.
- \`get_thanh_phan_ly_lich(tp_id)\` – KPI + lịch sử gắn-tháo tài sản.
- \`list_thanh_phan_by_he_thong(he_thong_id)\`.
- \`metric_timeseries(he_thong_id, metric_key, from, to)\`.

## Tài sản
- \`list_thiet_bi\`, \`get_thiet_bi\`, \`count_thiet_bi_by_trang_thai\`.
- \`list_thiet_bi_cap_phat\` – lịch sử cấp phát.

## Bảo trì & Đợt lớn
- \`list_bao_tri\`, \`list_dot_bao_duong\`, \`get_dot_bao_duong\`.
- \`list_form_submissions\`.

## Sự cố & Hỏng hóc
- \`list_su_co\`, \`list_hong_hoc\`, \`list_van_de\`.

## Giấy phép
- \`list_giay_phep_sap_het_han\`, \`list_giay_phep_by_he_thong\`.

## Vận hành khác
- \`list_tickets\`, \`list_du_an\`, \`list_danh_muc\`, \`list_notifications\`.

## Ghi tác nghiệp (cần user duyệt qua MCP client)
- \`create_su_co\`, \`create_bao_tri\`, \`create_hong_hoc\`.
- \`create_kiem_ke_ghi\`, \`close_van_de\`.
`,

  su_co_import: `# Nhập liệu Sự cố kỹ thuật (7 mục chuẩn TTBDKT)

## Cấu trúc gốc (báo cáo TTBDKT)
1. **Đơn vị báo cáo** (VD: Trung tâm BĐKT ...)
2. **Hệ thống/thiết bị/đường truyền** → \`he_thong_goi_y\`
3. **Mô tả sự cố** (thời gian UTC + hiện tượng) → \`tom_tat\` + \`thoi_gian_bat_dau\`
4. **Nguyên nhân** → \`nguyen_nhan\`
5. **Thiết bị/đường truyền thay thế** → \`tinh_hinh_hien_tai\`
6. **Xử lý** → \`bien_phap_xu_ly\`
7. **Đánh giá ảnh hưởng** → \`anh_huong_dhb\`
8. **Đề xuất** (tuỳ chọn) → nối vào \`ket_qua_khac_phuc\`

## INVARIANTS
- Thời gian trong báo cáo mặc định giờ **Z (UTC)**. Lưu nguyên số giờ vào ISO local, KHÔNG cộng offset.
- "Mất số liệu > 5 phút" hoặc "báo mất nguồn" = sự cố thật (không phải cảnh báo).
- Sự cố PHẢI gắn với ít nhất 1 **thành phần hệ thống** (không gắn trực tiếp tài sản).
- Nếu văn bản nói "Không ảnh hưởng đến điều hành bay" → \`phan_loai\` không được vượt C.

## Suy luận mức độ
| Từ khoá | anh_huong_dhb | phan_loai |
|---|---|---|
| "không ảnh hưởng ĐHB" | Không ảnh hưởng | D-E |
| "hoạt động dự phòng bình thường" | Không ảnh hưởng | D |
| "ảnh hưởng một phần / gián đoạn ngắn" | Ảnh hưởng một phần | C |
| "dừng điều hành bay / mất an toàn" | Có gián đoạn ĐHB | A-B |

## ANOMALY_RULES (agent tự cảnh báo)
- \`end_before_start\` – thời gian kết thúc trước bắt đầu.
- \`impact_mismatch\` – mô tả nói "ảnh hưởng" nhưng chọn "Không ảnh hưởng".
- \`no_component\` – không match được thành phần → yêu cầu user chọn thủ công.
- \`downtime_gt_24h\` – downtime > 24h nhưng phân loại D/E → cảnh báo nâng cấp.
- \`replacement_but_no_bien_phap\` – có thiết bị dự phòng mà biện pháp xử lý rỗng.

## Ví dụ (gold-standard)
**Input:**
\`\`\`
2. Sensor trần mây trạm 35
3. Lúc 04h00-04:05 UTC ngày 21/07/2026 Quan trắc phản ánh mất số liệu trần mây trạm 35.
4. Treo port COM converter Moxa trạm trần mây 35.
5. Số liệu trần mây trạm 17 hoạt động bình thường.
6. Ca trực tiến hành reset converter Moxa trạm trần mây 35.
7. Không ảnh hưởng đến điều hành bay.
\`\`\`
**Kỳ vọng:**
- \`he_thong_goi_y\` = "Sensor trần mây trạm 35"
- \`thoi_gian_bat_dau\` = "2026-07-21T04:00"
- \`nguyen_nhan\` = "Treo port COM converter Moxa trạm trần mây 35"
- \`bien_phap_xu_ly\` = "Ca trực tiến hành reset converter Moxa..."
- \`anh_huong_dhb\` = "Không ảnh hưởng", \`phan_loai\` = "D" hoặc "E"
`,
};

type SkillTopic = keyof typeof SKILLS;

export const getSkillCard = defineTool({
  name: "get_skill_card",
  title: "Sổ tay kỹ năng MIRATS",
  description:
    "Trả về skill card (markdown) giúp agent hiểu nghiệp vụ, cấu trúc dữ liệu, luồng làm việc và luật cảnh báo MIRATS. Gọi TRƯỚC khi tra cứu/ghi để tránh nhầm khái niệm.",
  inputSchema: {
    topic: z
      .enum(["overview", "data_model", "workflows", "glossary", "anomaly_rules", "tools_index"])
      .default("overview")
      .describe("Chủ đề skill card"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ topic }) => {
    const key = (topic ?? "overview") as SkillTopic;
    const md = SKILLS[key];
    if (!md) return errResult(`Không có skill topic: ${topic}`);
    return {
      content: [{ type: "text" as const, text: md }],
      structuredContent: { topic: key, markdown: md },
    };
  },
});

export const listSkillTopics = defineTool({
  name: "list_skill_topics",
  title: "Danh sách chủ đề skill",
  description: "Trả về danh sách các topic có thể truyền vào get_skill_card.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => textResult({ topics: Object.keys(SKILLS) }),
});