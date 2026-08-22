# Kế hoạch T18 — Lọc sidebar theo phân hệ đang chọn

Thanh sidebar phụ ở desktop hiện đang hiển thị tất cả các mục menu của mọi phân hệ. Cần lọc danh sách này dựa trên `activeWsId` để chỉ hiển thị menu tương ứng với phân hệ đang chọn.

## Phân tích & Kiểm chứng

- `Sidebar.tsx` đã có prop `workspaceId` (được thêm từ T17 để hỗ trợ hover-preview).
- Trong `AppShell.tsx`:
  - Dòng 204 (Desktop): Đã truyền `workspaceId={hoveredWsId || activeWs.id}`.
  - Dòng 228 (Mobile): Chưa truyền `workspaceId`.
- Cấu trúc `navGroups()`: Hiện tại nó gộp tất cả `NavGroup` của một `Workspace` thành một danh sách phẳng duy nhất với `group.key = ws.id`.
- **Kiểm chứng ý 5:** Trong `nav-contract.ts`, một số workspace như `so-ly-lich` và `tai-san` có nhiều hơn một nhóm con (phân đoạn bằng `divider: true` hoặc các logic khác trong tương lai, nhưng hiện tại `navGroups` chỉ tạo 1 nhóm cho 1 workspace). Tuy nhiên, yêu cầu T18 cấm sửa `nav-config.ts` nên tôi sẽ chỉ thực hiện lọc và ẩn `h3` như yêu cầu.

## Các bước thực hiện

1.  **Sidebar.tsx:**
    - Thay đổi prop `workspaceId?: string` (từ T17) thành `activeWsId: string` (prop bắt buộc theo yêu cầu T18).
    - Cập nhật logic lọc: `allGroups.filter(g => g.key === activeWsId)`.
    - Ẩn thẻ `h3` (dòng 28-32) vì nó trùng lặp với tiêu đề workspace đã in ở `AppShell.tsx`.
2.  **AppShell.tsx:**
    - Tại dòng 204 (Desktop): Đổi prop thành `activeWsId={hoveredWsId || activeWs.id}`.
    - Tại dòng 228 (Mobile - trong Sheet): Thêm prop `activeWsId={activeWs.id}`.
3.  **Xác minh:**
    - Chạy `npx tsc --noEmit` để đảm bảo type-check vượt qua (đặc biệt là prop bắt buộc).
    - Chạy `npm run test` để đảm bảo không phá vỡ các test case cũ.
    - Kiểm tra trực quan trong Preview.

## Báo cáo đề xuất (Ý 5)

Sau khi kiểm tra `src/lib/mirats/nav-contract.ts`:

- Workspace `so-ly-lich` có mục tiêu đề phân đoạn: `{ to: "#so-ly-lich-xem", label: "Xem & thống kê", icon: BookMarked, divider: true }`.
- Hiện tại `navGroups()` trong `nav-config.ts` gộp tất cả vào 1 mảng `items`. Nếu muốn giữ phân đoạn, cần sửa `nav-config.ts` để trả về nhiều nhóm hơn hoặc xử lý `divider` trong `Sidebar.tsx`.
- **Hành động:** Tuân thủ luật "KHÔNG sửa nav-config.ts", tôi sẽ chỉ thực hiện lọc theo workspace ID hiện tại.
