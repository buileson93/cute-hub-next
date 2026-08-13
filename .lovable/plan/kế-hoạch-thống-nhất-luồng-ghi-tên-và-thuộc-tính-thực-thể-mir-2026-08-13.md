# Kế hoạch Thống nhất Luồng ghi Tên và Thuộc tính thực thể (MIRATS)

Bản kế hoạch này nhằm giải quyết triệt để sự sai lệch dữ liệu giữa tên gốc (Database) và tên hiển thị (Mindmap/Cây), đồng thời lấp lỗ hổng bảo mật khi người dùng có thể đổi tên trực tiếp thông qua giao diện Bảng mà không qua phê duyệt (Change Request).

## 1. Phân tích hiện trạng (Bản đối chiếu)

| Tiêu chí | Đường 1: components/mirats/ThanhPhanTable.tsx | Đường 2: components/mirats/he-thong-cay/mutations.ts |
| :--- | :--- | :--- |
| **Hàm thực thi** | `supabase.from("...").update({ ten })` | `saveEntityFieldSecurely` |
| **Kiểm tra quyền (RBAC)** | Không (Dễ bị bypass ở client) | Có (Admin ghi trực tiếp, KTV tạo đề xuất) |
| **Change Request** | Không hỗ trợ | Có (Tạo `yeu_cau_thay_doi`) |
| **Dọn tên đè (cay_node_edit)** | **Không** (Dẫn đến lỗi đổi tên không ăn) | Có (Chỉ cho Admin khi ghi trực tiếp) |
| **Xoá ten_mindmap (du_lieu)** | Không | Chưa triệt để |
| **Làm mới dữ liệu** | `invalidateQueries(["thanh-phan-toan-cuc"])` | `invalidate()` (Toàn cây) |

## 2. Giải pháp: Hợp nhất luồng ghi "Secure Write Pipeline"

### Hàm ghi tên dùng chung
Tôi chọn **`src/lib/mirats/ui/save-entity-securely.ts`** làm "cửa ngõ" duy nhất.
**Lý do:** File này đã có sẵn logic phân nhánh Admin/User và tích hợp với hệ thống Change Request của dự án.

**Chữ ký hàm đề xuất:**
```typescript
/**
 * Ghi dữ liệu thực thể an toàn, xử lý dọn dẹp override và Change Request.
 */
export async function saveEntityFieldSecurely(args: {
  kind: RenameKind;    // 'pl', 'nh', 'ht', 'tb', 'md', ...
  id: string;          // ID bản ghi hoặc mã thiết bị
  field: string;       // Tên cột (tự chuẩn hóa 'ten' -> 'ten_thiet_bi' cho tb)
  value: any;
  userRoles: string[]; // Role của user hiện tại
  isDraft?: boolean;   // Nếu là node nháp trên Mindmap thì ghi thẳng vào cay_node_edit
}): Promise<{ 
  success: boolean; 
  mode: "direct" | "proposed" | "draft"; 
  requestId?: string 
}>;
```

### Trách nhiệm của hàm:
1.  **Chuẩn hóa:** Trim dữ liệu, mapping `ten` -> `ten_thiet_bi` tùy loại bảng.
2.  **Phân quyền:** 
    -   Nếu `isAdmin`: Thực hiện `update` vào bảng gốc + Xoá override trong `cay_node_edit` + Xoá key `ten_mindmap` trong `du_lieu`.
    -   Nếu `isUser`: Gọi `createChangeRequest`.
3.  **Dọn dẹp (Cleanup):** Khi ghi tên thật thành công, cưỡng bức xóa mọi dấu vết của "tên đè" để đảm bảo tính nhất quán (Single Source of Truth).

## 3. Kế hoạch Xử lý Dữ liệu Lệch (3 Bước)

Dữ liệu hiện tại có thể đang bị "loạn" giữa tên trong bảng `he_thong_thanh_phan` và tên trong `cay_node_edit`.

1.  **Bước 1: Đếm và Báo cáo (Audit)**
    -   Chạy truy vấn đối chiếu: `SELECT count(*) FROM cay_node_edit WHERE ten IS NOT NULL OR (du_lieu->>'ten_mindmap') IS NOT NULL`.
    -   Phân loại: Bao nhiêu bản ghi là node "Thật" nhưng vẫn có tên đè.
2.  **Bước 2: Đối chiếu (Compare)**
    -   Tạo giao diện tạm hoặc log danh sách các node có `Tên gốc != Tên đè`.
    -   Giữ lại giá trị `Tên đè` vào cột `ghi_chu` hoặc `mo_ta` nếu người dùng muốn phục hồi bằng tay sau này.
3.  **Bước 3: Xử lý (Sync)**
    -   Với node Thật: Cập nhật Tên gốc = Tên đè (nếu người dùng xác nhận tên đè mới là đúng), sau đó Xoá sạch tên đè.
    -   Với node Nháp: Giữ nguyên trong `cay_node_edit`.

## 4. Chặn Hồi quy bằng Máy (Enforcement)

Để đảm bảo không còn ai dùng `supabase.from(...).update({ ten })` trực tiếp:

1.  **Kiểm thử Đọc mã nguồn (Static Code Analysis Test):**
    -   Viết một bản kiểm thử trong `src/__tests__/architecture.test.ts`.
    -   Sử dụng regex quét toàn bộ thư mục `src/components` và `src/routes`.
    -   **Lỗi nếu tìm thấy:** Chuỗi `.update({ ten:` hoặc `.update({ ten_thiet_bi:`.
    -   **Ngoại lệ:** Chỉ cho phép trong các file thư viện tại `src/lib/mirats/`.
2.  **Bọc Supabase Client (Optional):**
    -   Tạo một Proxy cho Supabase client ở môi trường Dev, nếu phát hiện `update` vào các cột nhạy cảm từ component sẽ throw error ngay lập tức.

## 5. Danh sách Kiểm thử Tự động (Testing)

1.  **Test 1 (Bảo mật):** User role `user` gọi `saveEntityFieldSecurely` đổi tên thiết bị -> Khẳng định không có lệnh `UPDATE` nào gửi đi, chỉ có `INSERT` vào bảng `yeu_cau_thay_doi`.
2.  **Test 2 (Consistency):** Admin đổi tên Hệ thống -> Khẳng định bảng `dm_he_thong` cập nhật VÀ `cay_node_edit` bị xóa bản ghi tương ứng.
3.  **Test 3 (Draft):** Đổi tên node nháp -> Khẳng định chỉ ghi vào `cay_node_edit.ten`, không đụng vào bảng gốc.
4.  **Test 4 (Anti-regression):** Quét toàn bộ project, đảm bảo không còn file `.tsx` nào chứa mã cập nhật tên trực tiếp.

## 6. Trải nghiệm người dùng (UX)

Khi người dùng (không phải Admin) thực hiện đổi tên:
-   Thay vì hiện "Đã lưu", hệ thống sẽ hiện thông báo màu vàng: *"Đã tạo đề xuất thay đổi tên từ 'A' thành 'B'. Đang chờ Admin phê duyệt."*
-   Nút "Hủy đề xuất" sẽ xuất hiện ngay cạnh ô nhập liệu nếu có đề xuất đang treo.

---
*Lưu ý: Không thay đổi lược đồ (schema) database, không xóa bảng `cay_node_edit`.*
