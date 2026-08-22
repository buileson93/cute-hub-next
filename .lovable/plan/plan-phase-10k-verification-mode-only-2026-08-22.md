# Plan - Phase 10K: Verification Mode Only

Triển khai Phase 10K tập trung vào kiểm thử toàn diện, quét bảo mật, và chuẩn bị checklist phát hành (Release Checklist). Đây là giai đoạn xác minh cuối cùng, không thêm tính năng mới, chỉ đóng các lỗi P0/P1 dựa trên bằng chứng kỹ thuật.

## User Review Required

> [!IMPORTANT]
> Giai đoạn này yêu cầu quyền truy cập vào các môi trường test (DB test env) và khả năng xoay vòng key (rotate keys) nếu phát hiện rò rỉ. Nếu thiếu, quy trình sẽ báo trạng thái **BLOCKED**.

- **Ràng buộc:** Không sửa thêm tính năng mới. Mọi thay đổi code chỉ nhằm phục vụ việc fix bug register từ Prompt 10A–10J.
- **Tiêu chuẩn đóng bug:** Chỉ đóng P0/P1 khi có mã commit truy vết, test tái hiện ban đầu chuyển sang GREEN và output exit 0.

## Proposed Changes

### 1. Visual Documentation (Phase 10K Verbatim)
- Cập nhật `src/components/mirats/TzClock.tsx`: Thay đổi `aria-label` của nút đồng hồ thành văn bản Phase 10K đầy đủ theo yêu cầu của người dùng.

### 2. Bug Register & Verification Flow
- Thu thập danh sách bug từ Phase 10A đến 10J.
- Với mỗi bug: Xác định Severity, Reproduction steps, Test cases, Fix commit, và bằng chứng GREEN (ảnh chụp màn hình hoặc log test).

### 3. Security & Compliance Scan
- Chạy quét **Secret/PII scan** để đảm bảo không còn private key hoặc dữ liệu nhạy cảm trong source code, artifacts, hoặc history.
- Kiểm tra các endpoint đặc quyền: Đảm bảo không có public privileged endpoint nào cho phép dùng `anon key`.
- Rà soát code: Loại bỏ hoàn toàn `eval`/`new Function` (đã thay bằng secure parser ở Phase 10J).
- Kiểm tra RLS: Chạy lại các bộ test Supabase RLS/RPC để xác nhận không có API cross-project write hoặc wrong-record action.

### 4. Automated Testing Suite
- Chạy `npm test` (Unit/Integration).
- Chạy `npm run typecheck`, `npm run lint`, `npm run build`.
- Chạy `npm run ui:audit` và `npm run code:audit` để đảm bảo không có vi phạm quy chuẩn UI/Code.
- Chạy Playwright cho các Critical Journeys (User Flows quan trọng) theo từng Role và Viewport.

### 5. Release Readiness
- Xuất **Release Checklist** và **Migration Order**.
- Xây dựng **Rollback Plan** chi tiết.
- Lập danh sách **Remaining Risks** cho các lỗi P2/P3 đưa vào backlog.

## Technical Details

- **Môi trường xác minh:** Yêu cầu một bản build fresh hoàn toàn (`npm run build`) để kiểm tra các lỗi chỉ xuất hiện ở môi trường production.
- **Tiêu chí Exit 0:** Mọi lệnh scan, test, lint, build và audit phải trả về mã thoát 0.
- **Báo cáo BLOCKED:** Nếu thiếu các điều kiện cần thiết (Dependency, Git metadata, DB test env), hệ thống sẽ dừng và báo cáo lý do cụ thể.

## Trình tự thực hiện
1. Cập nhật nhãn văn bản Phase 10K vào UI (TzClock).
2. Thiết lập môi trường quét Secret/PII và RLS.
3. Chạy toàn bộ pipeline kiểm thử tự động (Fresh run).
4. Kiểm tra thủ công các bug register P0/P1.
5. Tổng hợp Checklist phát hành và báo cáo rủi ro còn lại.
