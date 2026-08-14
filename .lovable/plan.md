# Phục hồi tính năng Sổ lý lịch (Hệ thống & Thành phần)

Tính năng sổ lý lịch cấp Hệ thống và Thành phần hiện đang gặp lỗi "không hoạt động" hoặc mất đường vào từ giao diện sau các đợt refactor. Kế hoạch này tập trung phục hồi đường dẫn truy cập và đảm bảo dữ liệu lý lịch (Sự cố, Bảo trì, Hỏng hóc, Tháo lắp) được hiển thị đầy đủ.

## Các vấn đề phát hiện
1.  **Thiếu điểm vào (Entry Point):** Giao diện danh sách thành phần và cây hệ thống chưa có nút hoặc hành động rõ ràng để mở Sổ lý lịch thành phần/hệ thống.
2.  **Lỗi truyền dữ liệu (Props Mismatch):** Component `ThanhPhanChiTietDialog` được gọi nhưng có thể thiếu các handler quan trọng hoặc truyền `null`.
3.  **Thiếu dữ liệu (Data Missing):** Trang chi tiết tài sản (`_app.thiet-bi.$maThietBi.tsx`) có các tab lý lịch nhưng dữ liệu `timeline`, `suCo`, `baoTri` đang bị bỏ trống (mảng rỗng) trong code.
4.  **Tên hàm/Hook:** Có sự chồng chéo giữa `useLyLichThietBi`, `useLyLichThanhPhan`, và `useLyLichHeThong`.

## Kế hoạch thực hiện

### 1. Phục hồi Sổ lý lịch Tài sản (Asset Level)
*   **File:** `src/routes/_app.thiet-bi.$maThietBi.tsx`
*   **Hành động:** 
    *   Sử dụng hook `useLyLichThietBi` để lấy dữ liệu timeline thực tế thay vì mảng rỗng.
    *   Tích hợp `useOperationsData` để lọc ra danh sách `suCo`, `baoTri`, `hongHoc`, `banGiao` thuộc về tài sản này.
    *   Đảm bảo tab "Lý lịch" và tab "Vận hành" hiển thị dữ liệu thật từ database.

### 2. Phục hồi Sổ lý lịch Thành phần (Component Level)
*   **File:** `src/components/mirats/ThanhPhanChiTietDialog.tsx`
*   **Hành động:** 
    *   Kiểm tra logic hiển thị `LyLichThanhPhanPanel`.
    *   Đảm bảo nút "Sổ hệ thống" mở đúng Dialog lý lịch cấp hệ thống.
    *   Bổ sung nút "Lý lịch" (biểu tượng History) vào các vị trí còn thiếu trong `ThanhPhanTable` và `TreeView`.

### 3. Phục hồi Sổ lý lịch Hệ thống (System Level)
*   **File:** `src/routes/_app.he-thong.$id.tsx`
*   **Hành động:**
    *   Sử dụng `LyLichHeThongPanel` để hiển thị toàn bộ lịch sử hệ thống.
    *   Đảm bảo tab "Nhật ký" (Timeline) sử dụng dữ liệu từ `useLyLichHeThong` để có cái nhìn tổng quát 3 lớp (Hệ thống - Thành phần - Tài sản).

### 4. Kiểm tra và đồng nhất Hook
*   **File:** `src/lib/mirats/he-thong-thanh-phan.ts`
*   **Hành động:** Xác minh các hook `useLyLichThanhPhan`, `useLyLichHeThong` gọi đúng các RPC database tương ứng (`v_ly_lich_thanh_phan`, `v_ly_lich_he_thong`).

## Chi tiết kỹ thuật
```typescript
// Ví dụ phục hồi dữ liệu trong chi tiết thiết bị
const { data: lyLich } = useLyLichThietBi(tb.id);
const { ops } = useOperationsData();
const suCo = ops.suCo.filter(e => e.thiet_bi_id === tb.id);
```

## Kiểm thử
1.  Mở chi tiết một tài sản, kiểm tra tab "Lý lịch" có hiện dòng thời gian không.
2.  Mở cây hệ thống, chọn một thành phần, kiểm tra Drawer có hiện "Sổ lý lịch thành phần" không.
3.  Từ Drawer thành phần, bấm "Sổ hệ thống" xem có hiện Dialog lịch sử toàn hệ thống không.
