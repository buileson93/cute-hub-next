# Kế hoạch: Phase U5 - Giai đoạn 2 (Thực thi Dọn dẹp Cấu trúc)

Giai đoạn này tập trung vào việc hiện thực hóa các khuyến nghị từ bản khảo sát nợ cấu trúc (Baseline U5), nhằm đưa MIRATS 2.0 về một trạng thái mã nguồn lành mạnh, dễ bảo trì và hiệu năng cao.

## 1. Chia nhỏ các "Siêu thành phần" (Mega-components)
Phá vỡ các file > 1000 dòng thành các module chức năng đơn lẻ.
- **NetworkOverview.tsx (2340 dòng)**: Tách logic đồ thị (React Flow/Force Graph) và logic bảng dữ liệu sang các sub-components.
- **StandardTable.tsx (1786 dòng)**: Tách logic xuất file (CSV/Word), logic lọc (FilterBuilder), và logic hiển thị hàng (RowRenderer).
- **_app.he-thong.$id.tsx (1890 dòng)**: Chuyển nội dung các Tab (Cấu trúc, Lịch sử, Tài liệu) thành các file component riêng biệt.

## 2. Chuẩn hóa Kiến trúc Route (Route Integrity)
Khắc phục 62 vi phạm kiến trúc nơi Route gọi trực tiếp API/Database.
- Di chuyển `useQuery` và logic `supabase` vào các custom hooks tại `src/lib/mirats/hooks/`.
- Chuyển đổi fetch dữ liệu sang mô hình `loader` + `useSuspenseQuery` của TanStack Start để tối ưu SSR.
- Đảm bảo file Route chỉ chứa logic điều hướng và bố cục khung (Shell).

## 3. Giải quyết xung đột đặt tên & Cấu trúc
- Loại bỏ các file `index.tsx` ẩn danh trong thư mục components, đổi tên thành tên định danh (vd: `AppShell.tsx`, `ThietBiDetail.tsx`).
- Phân tách rõ ràng các component trùng tên như `TreeView` bằng cách thêm tiền tố domain (vd: `SystemTreeView`, `HistoryTreeView`).
- Tổ chức lại `src/lib/mirats/` theo domain chức năng thay vì để phẳng 350 file.

## 4. Tối ưu hóa tài nguyên và Dependencies
- Gỡ bỏ an toàn 31 thư viện đã được xác nhận không sử dụng trong code (vd: `@google/model-viewer`, `leaflet`, `jspdf-autotable` nếu đã có giải pháp thay thế).
- Chuyển các file JSON dữ liệu mẫu (mock data) cực lớn ra khỏi thư mục `src/` để tránh làm chậm quá trình biên dịch (HMR).

## Chi tiết kỹ thuật
- **Công cụ**: Sử dụng `scripts/code-audit.mjs` để kiểm tra tiến độ giảm nợ sau mỗi bước.
- **Quy tắc**: Không thay đổi logic nghiệp vụ, chỉ tái cấu trúc mã nguồn (Refactoring).
- **Kiểm thử**: Chạy `npm run test` và `ui:audit` để đảm bảo không gây hồi quy giao diện.

---
**Lưu ý**: Đây là giai đoạn "phẫu thuật" cấu trúc, yêu cầu sự cẩn trọng cao để không làm đứt gãy các kết nối dữ liệu hiện có.
