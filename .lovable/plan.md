## Mục tiêu
Nâng cấp MCP server `mirats-mcp` (hiện có 16 tool đọc gộp trong 1 file) để:
1. **Phủ toàn bộ chức năng nghiệp vụ** của web (bảo trì, đợt bảo dưỡng lớn, sự cố, hỏng hóc, thành phần hệ thống, sổ lý lịch, kho, r2, thông báo email...).
2. **Cho phép ghi có kiểm soát** (create/update giới hạn) — hiện tại chỉ đọc, agent không tác nghiệp được.
3. **Giúp AI agent hiểu schema & nghiệp vụ** qua "skill card" (giống pattern đã làm cho template AllInOne XLSX).

## Phạm vi

### A. Tái cấu trúc thư mục
```
src/lib/mcp/
├── index.ts
├── _shared/            # supabase client, guards, formatters
│   ├── client.ts       # supabaseForUser(ctx) + supabaseAnon()
│   ├── guards.ts       # requireAuth, requireRole, requireDonVi
│   └── format.ts       # toMcpText, paginate, safeJson
├── skills/             # skill card đọc-được cho AI
│   ├── overview.md     # giới thiệu MIRATS, thuật ngữ
│   ├── data-model.md   # bản đồ dữ liệu 4 lớp (hệ thống → thành phần → tài sản → linh kiện)
│   ├── workflows.md    # 8 luồng nghiệp vụ chính
│   └── glossary.md     # từ điển: GPKT, đợt BD, HP, MTBF...
└── tools/
    ├── index.ts        # barrel
    ├── skill/          # get_skill_card, list_workflows
    ├── read/           # 16 tool hiện tại (tách file)
    ├── he-thong/       # list/get hệ thống, thành phần, KPI
    ├── tai-san/        # list/get tài sản, gán/tháo, lịch sử
    ├── bao-tri/        # phiếu BD, đợt BD lớn, hạng mục
    ├── su-co/          # sự cố, hỏng hóc, van_de
    ├── giay-phep/      # GPKT, giấy phép tài sản, sắp hết hạn
    ├── kho/            # nhập/xuất, cấp phát, kiểm kê
    ├── du-an/          # dự án + công việc + mốc
    ├── thong-bao/      # notifications, email queue, telegram
    └── write/          # create_su_co, create_bao_tri, create_hong_hoc,
                        # update_ket_qua_bang_kiem, close_van_de (needsApproval)
```

### B. Skill card cho AI (mới)
Bổ sung tool `get_skill_card({ topic })` trả về markdown skill để agent tra cứu trước khi thao tác:
- `overview` — MIRATS là gì, ai dùng, 6 vai trò (admin, phong_kt, phu_trach_dv, ktv, quan_ly_du_an, to_truong)
- `data_model` — Cây 4 lớp: `dm_he_thong → he_thong_thanh_phan → thiet_bi → linh_kien`. Liên kết `giay_phep_khai_thac ↔ dm_he_thong`. Ma trận enums.
- `workflows.bao_tri` — quy trình phiếu BD: `form_template → form_submission → form_submission_item_result → v_metric_timeseries`
- `workflows.dot_bao_duong` — 2 đợt/năm: `dot_bao_duong → dot_bao_duong_hang_muc → biên bản → phê duyệt`
- `workflows.su_co` — sự cố → van_de → đóng
- `workflows.gpkt` — nhập PDF → dedup → gán hệ thống → cảnh báo hết hạn
- `glossary` — từ khóa nghiệp vụ (HP, MTBF, MTTR, TPHT, GPKT, đơn vị PBA/CRA/CLA...)
- `anomaly_rules` — luật cảnh báo bất hợp lý (đồng bộ với AI_RULES của template XLSX)

Nội dung skill viết bằng tiếng Việt, tối ưu để LLM hiểu ngữ cảnh nghiệp vụ MIRATS mà không cần đoán.

### C. Tool nghiệp vụ mới (chỉ liệt kê, chi tiết trong code)

**Đọc chuyên sâu**
- `get_he_thong_ly_lich(id)` — snapshot toàn diện: thông tin, KPI 12m, GPKT hiện hành, thành phần con, sự cố 30 ngày
- `get_thanh_phan_ly_lich(tpId)` — dùng RPC `thanh_phan_kpi` + `thanh_phan_tai_san_history` đã có
- `list_dot_bao_duong({ nam, don_vi })` + `get_dot_bao_duong(id)` với tiến độ hạng mục
- `list_bao_tri`, `get_bao_tri(id)` kèm items và ảnh
- `list_su_co({ trang_thai, muc_do, tu_ngay })` + `get_su_co(id)` + `list_hong_hoc`
- `list_van_de({ trang_thai })`, `get_van_de(id)`
- `list_giay_phep_by_he_thong(he_thong_id)`
- `list_kho_giao_dich`, `list_cap_phat`, `list_kiem_ke`
- `list_du_an_cong_viec({ du_an_id })`
- `list_chung_chi_thiet_bi({ sap_het_han })`
- `metric_timeseries({ he_thong_id, metric_key, from, to })` — dùng view `v_metric_timeseries`

**Ghi có kiểm soát (needsApproval)**
- `create_su_co` — dùng RPC `agent_add_su_co`
- `create_bao_tri` — RPC `agent_add_bao_tri`
- `create_hong_hoc` — RPC `agent_add_hong_hoc`
- `create_kiem_ke_ghi` — RPC `ghi_kiem_ke`
- `close_van_de` — RPC `dong_van_de`
- `update_thong_bao_read({ ids })`

Mọi tool ghi đều gắn `annotations.destructiveHint = false, readOnlyHint = false` và `needsApproval: true`.

### D. Bảo mật & RLS
- Tool ghi bắt buộc `ctx.isAuthenticated()`, forward token qua `supabaseForUser(ctx)` (đã có pattern trong `src/lib/mcp/index.ts`).
- Tool đọc dùng cùng pattern; RLS chạy như user thật, không mở `service_role`.
- `run_select_query` giữ nguyên (đã dùng RPC `ai_run_select` chỉ SELECT).
- Không thêm tool phá dữ liệu (delete/purge).

### E. Manifest & kiểm thử
1. Sau mỗi tập tool: chạy `app_mcp_server--extract_mcp_manifest` để cập nhật `.lovable/mcp/manifest.json`.
2. Smoke: gọi `get_skill_card('overview')`, `list_dot_bao_duong`, `create_su_co` (approval) qua Claude/ChatGPT.
3. Verify không rò lộ token (`ctx.getToken()` không log).

## Kết quả kỳ vọng
- Tool count: ~35–40 (từ 16), chia theo domain nghiệp vụ.
- Agent bên ngoài (Claude/ChatGPT) đọc `get_skill_card` là hiểu ngay: cấu trúc 4 lớp dữ liệu, thuật ngữ VATM, workflow, luật cảnh báo.
- Agent có thể ghi tác nghiệp cơ bản (sự cố / bảo trì / hỏng hóc) với chốt phê duyệt từ user cuối.
- Toàn bộ đi qua RLS, không dùng service key.

## Thứ tự triển khai
1. Tách file `tools/index.ts` (388 dòng) thành thư mục domain + `_shared/`.
2. Viết skill card `.md` + tool `get_skill_card`.
3. Thêm tool đọc theo từng domain (hệ thống → tài sản → bảo trì → sự cố → giấy phép → kho → dự án → thông báo).
4. Thêm tool ghi (needsApproval) mapping vào RPC `agent_add_*`, `ghi_kiem_ke`, `dong_van_de`.
5. Extract manifest, smoke test qua Playwright vào endpoint `/mcp`.

Không thay đổi UI, không đụng `service_role`, không xóa tool cũ (giữ tương thích).
