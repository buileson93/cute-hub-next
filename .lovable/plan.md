# Kế hoạch Bổ sung aria-label cho Icon Buttons

## Mục tiêu
Bổ sung `aria-label` bằng tiếng Việt cho 30 nút `size="icon"` đầu tiên trong danh sách vi phạm UI để đảm bảo tính truy cập (accessibility). Vì `src/components/ui/button.tsx` đã có logic tự động hiển thị `Tooltip` nếu có `aria-label`, chúng ta không cần thêm `Tooltip` thủ công.

## Danh sách 30 vị trí đầu tiên
1. `src/routes/_app.admin.bao-tri-chinh-sach.tsx:194` - Sửa: `aria-label="Chỉnh sửa chính sách"`
2. `src/routes/_app.admin.bao-tri-chinh-sach.tsx:195` - Sửa: `aria-label="Xoá chính sách"`
3. `src/routes/_app.admin.nhan-vien.tsx:158` - Sửa: `aria-label="Xuất báo cáo cá nhân"`
4. `src/routes/_app.admin.nhan-vien.tsx:169` - Sửa: `aria-label="Xem phần mềm nhân viên"`
5. `src/routes/_app.admin.nhan-vien.tsx:177` - Sửa: `aria-label="Chỉnh sửa thông tin nhân viên"`
6. `src/routes/_app.admin.nhan-vien.tsx:180` - Sửa: `aria-label="Xoá nhân viên"`
7. `src/routes/_app.admin.permissions.tsx:189` - Sửa: `aria-label="Xoá phân quyền"`
8. `src/routes/_app.admin.tich-hop.tsx:218` - Sửa: `aria-label="Thu hồi key"`
9. `src/routes/_app.bao-cao.do-tin-cay.tsx:315` - Sửa: `aria-label="Xoá mục đã lưu"`
10. `src/routes/_app.danh-muc.he-thong.tsx:186` - Sửa: `aria-label="Chỉnh sửa hệ thống"`
11. `src/routes/_app.danh-muc.he-thong.tsx:190` - Sửa: `aria-label="Xoá hệ thống"`
12. `src/routes/_app.danh-muc.model.tsx:694` - Sửa: `aria-label="Tìm trên Google"`
13. `src/routes/_app.danh-muc.model.tsx:705` - Sửa: `aria-label="Thông tin mẫu"`
14. `src/routes/_app.danh-muc.model.tsx:1449` - Sửa: `aria-label="Khai chủng loại mới"`
15. `src/routes/_app.danh-muc.thiet-bi.tsx:666` - Sửa: `aria-label="Xem chi tiết thiết bị"`
16. `src/routes/_app.danh-muc.thiet-bi.tsx:667` - Sửa: `aria-label="Chỉnh sửa thiết bị"`
17. `src/routes/_app.danh-muc.thiet-bi.tsx:668` - Sửa: `aria-label="Gán thiết bị"`
18. `src/routes/_app.danh-muc.thiet-bi.tsx:669` - Sửa: `aria-label="Gỡ thiết bị"`
19. `src/routes/_app.danh-muc.thiet-bi.tsx:670` - Sửa: `aria-label="Xoá thiết bị"`
20. `src/routes/_app.danh-muc.vi-tri.tsx:35` - Sửa: `aria-label="Xem ảnh/3D vị trí"`
21. `src/routes/_app.du-an.$id.tsx:399` - Sửa: `aria-label="Thêm task mới"`
22. `src/routes/_app.gop-gach.tsx:133` - Sửa: `aria-label="Bỏ qua đề xuất"`
23. `src/routes/_app.he-thong.$id.tsx:508` - Sửa: `aria-label="Xem lý lịch hệ thống"`
24. `src/routes/_app.he-thong.cay.tsx:431` - Sửa: `aria-label="Chỉnh sửa cây sơ đồ"`
25. `src/routes/_app.he-thong.cay.tsx:448` - Sửa: `aria-label="Cấu hình sơ đồ"`
26. `src/routes/_app.he-thong.lien-ket.tsx:140` - Sửa: `aria-label="Chia sẻ sơ đồ"`
27. `src/routes/_app.he-thong.lien-ket.tsx:284` - Sửa: `aria-label="Tạm ngừng liên kết"`
28. `src/routes/_app.he-thong.lien-ket.tsx:293` - Sửa: `aria-label="Kích hoạt liên kết"`
29. `src/routes/_app.he-thong.lien-ket.tsx:303` - Sửa: `aria-label="Xoá liên kết"`
30. `src/routes/_app.he-thong.thanh-phan.tsx:53` - Sửa: `aria-label="Chỉnh sửa nhanh thành phần"`

## Kế hoạch thực thi
1. Thực hiện `line_replace` cho 30 file/vị trí trên.
2. Xác nhận bằng `npm run ui:audit` (số vi phạm giảm 30).
3. Kiểm tra bằng cách hover thủ công vài nút để xác nhận tooltip hiển thị đúng.
