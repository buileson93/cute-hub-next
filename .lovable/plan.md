## Mục tiêu

Nâng cấp sheet ① Hướng dẫn của workbook All-in-one thành **"skill card" cho AI agent nhập liệu**: đủ chi tiết để một agent (Claude/Gemini/GPT) đọc xong có thể tự điền đúng thứ tự lớp, suy luận giá trị hợp lý, và tự sinh cảnh báo khi số liệu bất thường so với các thiết bị tương đương đã có trong file.

## Phạm vi thay đổi

Chỉ chỉnh `src/lib/mirats/allinone-template.ts` (hàm dựng sheet Hướng dẫn + 1 sheet phụ ẩn `③ AI_RULES`) và thêm test round-trip cho các block mới. Không đổi schema DB, không đổi các sheet lớp hiện có, giữ nguyên `META` ẩn / `SCHEMA_VERSION`.

## Cấu trúc sheet ① Hướng dẫn (viết lại theo layout "skill")

Sheet dùng 4 cột A–D, mỗi block có header nền đậm để agent dễ locate bằng string match.

1. `# ROLE` — 3 dòng: agent là "nhân viên kỹ thuật khai lý lịch thiết bị VATM", nguyên tắc: không đoán, ưu tiên trích dẫn nguồn, dừng lại hỏi khi thiếu.
2. `# INVARIANTS` — bảng bất biến (mã = khoá upsert, cha trước con sau, idempotent, mọi `ref` phải tồn tại ở sheet cha).
3. `# WORKFLOW` — 6 bước bắt buộc theo thứ tự: (1) đọc `META` + `③ AI_RULES`, (2) quét dữ liệu hiện có ở các sheet cha, (3) điền lớp 1→10, (4) tự chạy checklist ở block `# SELF_CHECK`, (5) đối chiếu với block `# ANOMALY_RULES`, (6) đánh dấu `_action` phù hợp.
4. `# LAYER_MAP` — bảng hiện có (Sheet ↔ Bảng ↔ Số dòng) giữ nguyên, thêm cột **Khoá upsert** và **Ref bắt buộc**.
5. `# FIELD_HINTS` — với mỗi entity liệt kê: field, kiểu, ví dụ hợp lệ, mẫu regex/enum nếu có (đọc từ `import-config` để không lệch nguồn sự thật).
6. `# ANOMALY_RULES` — luật cảnh báo bất hợp lý agent phải tự chạy trước khi ghi (chi tiết bên dưới).
7. `# SELF_CHECK` — checklist Đ/K agent phải trả lời trước khi coi là hoàn tất.
8. `# EXAMPLES` — 2 ví dụ: một tạo mới, một cập nhật; hiển thị dạng "input → dòng đã điền".
9. `# ERROR_RECOVERY` — hành động khi gặp lỗi phổ biến (trỏ ref chưa có, trùng serial, sai enum).

## Sheet phụ `③ AI_RULES` (ẩn, machine-readable)

JSON một dòng trong ô A1 để agent parse trực tiếp thay vì đọc prose:

```json
{
  "schema_version": "<SCHEMA_VERSION>",
  "layers": [{ "sheet": "...", "entity": "...", "key": "ma", "refs": ["phan_loai"], "required": [...] }],
  "field_hints": { "thiet_bi": { "nam_san_xuat": { "type": "int", "min": 1980, "max": <currentYear+1> } } },
  "anomaly_rules": [ { "id": "sn_dup", "scope": "thiet_bi", "when": "ma_serial trùng trong sheet", "action": "warn" }, ... ],
  "enums": { ... }
}
```

Sinh từ cùng `import-config` + `ALLINONE_LAYERS` để không double-source.

## Bộ luật cảnh báo bất hợp lý (`# ANOMALY_RULES`)

Agent tự áp trước khi ghi; mỗi luật có `id`, `severity` (info/warn/block), `explain`:

- `sn_dup`: `ma_serial` trùng trong cùng file → warn (đã có soft-warn ở UI).
- `year_out_of_range`: `nam_san_xuat` < 1980 hoặc > năm hiện tại + 1 → warn.
- `year_vs_ngay_dua_vao`: `nam_san_xuat > year(ngay_dua_vao_su_dung)` → block.
- `model_mismatch`: cùng `model` nhưng khác `nha_san_xuat`/`chung_loai` so với dòng khác trong file hoặc snapshot → warn, gợi ý dòng tham chiếu.
- `price_outlier`: `gia_tri` lệch > 3× median của cùng `model` (dữ liệu snapshot) → warn.
- `lifespan_outlier`: `nien_han_su_dung` lệch > 50% median của cùng `chung_loai` → warn.
- `ref_missing`: `phan_loai`/`he_thong`/`vi_tri`/`don_vi` không có ở sheet cha → block, kèm gợi ý mã gần đúng (Levenshtein ≤ 2).
- `enum_invalid`: trạng thái/loại không thuộc enum → block, in danh sách enum hợp lệ.
- `date_future`: `ngay_bao_hanh_den` < `ngay_dua_vao_su_dung` → block.
- `orphan_component`: thành phần hệ thống không có `he_thong` cha → block.
- `duplicate_ma`: cùng `ma` xuất hiện >1 lần trong cùng sheet → block.

Với các luật so sánh (`price_outlier`, `lifespan_outlier`, `model_mismatch`), agent được yêu cầu dùng dữ liệu snapshot đi kèm (khi `withData=true`) làm baseline; khi mẫu trống thì bỏ qua nhưng log là "no baseline".

## Test

Bổ sung vào `allinone-export.test.ts`:
- Sheet ① Hướng dẫn chứa đủ 9 header block (`# ROLE`, `# INVARIANTS`, …).
- Sheet `③ AI_RULES` tồn tại, `state=hidden`, A1 parse được JSON, `anomaly_rules.length ≥ 10`, mọi `entity` trong `field_hints` đều nằm trong `ALLINONE_LAYERS`.
- Với `withData=true`, `AI_RULES.baseline_available = true`.

## Ngoài phạm vi (đề xuất riêng nếu bạn muốn)

- Validator server-side áp `ANOMALY_RULES` tại `apply_import_batch` (hiện mới có ở client). Có thể làm ở PR sau khi luật ổn định.
- Nút "Xuất kèm dữ liệu tham chiếu" đã có; sẽ chỉ thêm chú thích ở guide rằng nên bật để agent có baseline.
