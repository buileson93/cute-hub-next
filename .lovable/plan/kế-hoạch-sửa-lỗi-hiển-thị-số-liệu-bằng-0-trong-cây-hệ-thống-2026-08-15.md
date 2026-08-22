# Kế hoạch sửa lỗi hiển thị số liệu bằng 0 trong Cây hệ thống

Người dùng phản hồi rằng các số liệu (badge đếm số lượng) trong giao diện Cây hệ thống (`/he-thong/cay`) đang hiển thị số 0 mặc dù dữ liệu trong database có tồn tại.

## Phân tích nguyên nhân

1. **Lỗi logic đếm trong `buildTree`**: Hàm `buildTree` trong `src/components/mirats/he-thong-cay/utils.ts` có thể đang tính toán `count` dựa trên các mảng `devices` hoặc `systems` rỗng do lỗi gán taxonomy.
2. **Lỗi Query dữ liệu**: Trong `src/routes/_app.he-thong.cay.tsx`, query `he_thong_thanh_phan_count` có thể trả về 0 nếu có lỗi RLS hoặc mapping.
3. **Sự khác biệt giữa Cây và Sơ đồ**: Nếu sơ đồ (Mindmap) vẫn hiện số mà Cây hiện 0 (hoặc ngược lại), vấn đề nằm ở component hiển thị.
4. **Lỗi mapping `_thanhPhanId`**: Trong query `thiet_bi_cay`, việc mapping `_thanhPhanId: he_thong_thanh_phan(id)` trả về mảng, nếu logic lấy `[0]` bị sai hoặc dữ liệu không khớp, các nút con sẽ không được tính vào `count`.

## Các bước thực hiện

### 1. Kiểm tra và sửa logic `buildTree`

- Kiểm tra lại hàm `totalOf` trong `utils.ts`. Hiện tại nó đang tính: `devs.reduce((n, d) => n + 1 + d.children.length, 0)`. Nếu `d.children` không được map đúng từ database, số lượng sẽ bị thiếu.
- Đảm bảo `realSystems` và `devices` được map chính xác các trường `plId`, `nhMa`, `htId`.

### 2. Sửa logic hiển thị Badge trong `TreeView.tsx` và `CayMindMap.tsx`

- Rà soát các badge hiển thị `pl.count`, `nh.count`, `ht.count`.
- Đảm bảo các giá trị này được cập nhật khi dữ liệu từ `useQuery` trả về.

### 3. Đồng bộ hóa mapping ID trong `_app.he-thong.cay.tsx`

- Kiểm tra query `thiet_bi_cay`. Đảm bảo `_pl`, `_nhKey`, `_htId` lấy đúng từ các bảng danh mục mới (`dm_phan_loai`, `dm_nhom_he_thong`, `dm_he_thong`).

### 4. Kiểm tra quyền truy cập (RLS)

- Xác nhận các bảng `he_thong_thanh_phan` và `gan_chuc_nang` có đầy đủ policy cho user hiện tại để `count` không bị trả về 0 do thiếu quyền.

## Kỹ thuật chi tiết

- Cập nhật `src/components/mirats/he-thong-cay/utils.ts` để debug log các giá trị `count` trung gian.
- Kiểm tra việc sử dụng `count: "exact"` trong các query Supabase.
