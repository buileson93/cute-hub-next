# Hoàn thiện Sổ lý lịch hệ thống — Liên kết & Đồng bộ tên gọi

## Mục tiêu
Trang `/he-thong/$id` phải trở thành trung tâm điều hướng: đọc → hiểu → nhảy đúng chức năng để tác nghiệp, đồng thời dùng đúng thuật ngữ đã có trong sidebar (`nav-contract.ts`) để tránh gọi 2 tên cho cùng một thứ.

## 1. Đồng bộ tên gọi (bám theo sidebar chính thức)

| Đang dùng trong trang | Chuẩn theo sidebar | Ghi chú |
|---|---|---|
| "Sổ lý lịch" (nút quay lại) | **Sổ lý lịch** ✔ | giữ nguyên, nhưng thêm breadcrumb: Sổ lý lịch › {Tên HT} |
| "Sự cố" (tab) | **Sự cố kỹ thuật** | đổi label tab & nhãn card |
| "Bảo dưỡng" ✔ | Bảo dưỡng | ✔ |
| "Thay thế" (tab) | **Hỏng hóc** | đổi để trùng menu `/hong-hoc` |
| "Bàn giao" ✔ | Bàn giao | ✔ |
| "Liên kết" (tab) | **Liên kết hệ thống** | trùng menu `/he-thong/lien-ket` |
| "Chỉnh sửa dữ liệu" | **Nhật ký thay đổi** | phản ánh đúng nội dung ChangeLogPanel |
| "Giấy phép khai thác" ✔ | Giấy phép khai thác | ✔ |
| "Thành phần thuộc hệ thống" | **Thành phần hệ thống** | trùng menu `/he-thong/thanh-phan` |
| "Ngày mở sổ / Ghi nhận gần nhất" | giữ nguyên | đã ổn |

## 2. Bổ sung liên kết chức năng

### Header (thẻ Định danh sticky)
- **Đơn vị quản lý**: đã có → giữ.
- **Sơ đồ hệ thống**: thêm nút → `/so-do` (lọc theo `he_thong_id`).
- **Kiểm định & Hiệu chuẩn**: thêm chip → `/kiem-dinh?he_thong=<id>` nếu HT có tài sản cần hiệu chuẩn.
- **In QR nhãn hệ thống**: link tới `/nhan?he_thong=<id>`.
- **Giấy phép**: chip GPKT hiện tại + link `/giay-phep?q=<gpSo>` để xem toàn bộ lịch sử giấy phép.

### Thanh hành động nhanh (mới, dưới header, `no-print`)
Một hàng các nút icon+label để tác nghiệp không cần rời trang:
- **+ Sự cố kỹ thuật** → `/su-co/moi?he_thong=<id>`
- **+ Phiếu bảo dưỡng** → `/bao-tri/moi?he_thong=<id>`
- **+ Hỏng hóc** → `/hong-hoc/moi?he_thong=<id>`
- **+ Bàn giao** → `/ban-giao/moi?he_thong=<id>`
- **+ Biên bản** → `/forms` (mở dialog chọn mẫu, tự gắn HT)
- **Vấn đề (RCA)** → `/van-de?he_thong=<id>`
- **Phiếu công việc & KPI** → `/bao-tri/cong-viec?he_thong=<id>`

Các nút chỉ hiện với vai trò `admin`/`phong_kt`/`ktv` phù hợp.

### Tab Dòng thời gian
- Mỗi dòng đã link mã tài sản → giữ.
- Thêm nút "Mở chi tiết" trên mỗi item: BT → `/bao-tri/$maBaoTri`; SC → `/su-co/$maSuCo`; HH → `/hong-hoc/$maHongHoc`.

### Tab Bảo dưỡng / Sự cố / Hỏng hóc / Bàn giao
- Header mỗi tab: nút "Xem tất cả trong menu chính" → link tương ứng (`/bao-tri?he_thong=<id>`, `/su-co?he_thong=<id>`, `/hong-hoc?he_thong=<id>`, `/ban-giao?he_thong=<id>`) — dùng cùng bộ lọc theo hệ thống.
- Mã bản ghi trong `EventRow` trở thành `<Link>` tới trang chi tiết tương ứng.

### Card Thành phần hệ thống
- Nút "Quản lý" hiện có → `/he-thong/cay` (giữ), thêm nút "Xem dạng bảng" → `/he-thong/thanh-phan?he_thong=<id>`.
- Trong Sheet chi tiết thành phần: link "Xem sổ lý lịch tài sản" đã có; thêm shortcut "Lịch sử lắp/tháo" → mở LyLichThanhPhanPanel (đã import) inline.

### Sidebar phải (thẻ Định danh)
- Mục "Đơn vị quản lý" → giữ link.
- Mục **Nhóm hệ thống** (mới): nếu HT có `dm_nhom_he_thong` → link `/danh-muc/he-thong?nhom=<id>`.
- Mục **Vật tư & Kho** (mới, chỉ hiển thị nếu có `kho_giao_dich` liên quan): link `/vat-tu?he_thong=<id>`.
- Mục **Dự án liên quan** (mới, có điều kiện): nếu `du_an_cong_viec` gắn HT → link `/du-an?he_thong=<id>`.

### Chân trang
- Breadcrumb chuẩn: `Sổ lý lịch › {tenHt}` (link đầu về `/thiet-bi`).
- Nút "Xem liên kết hệ thống" → `/he-thong/lien-ket?src=<id>` (bên cạnh tab Liên kết trong trang).

## 3. Chuẩn hoá query filter theo hệ thống
Các trang đích cần chấp nhận query `?he_thong=<uuid>` để filter sẵn:
- `/su-co`, `/bao-tri`, `/hong-hoc`, `/ban-giao`, `/van-de`, `/bao-tri/cong-viec`, `/vat-tu`, `/kiem-ke`, `/forms`, `/so-do`, `/kiem-dinh`, `/nhan`, `/giay-phep`.

Nếu route đã có filter theo mã HT/đơn vị: thêm nhánh đọc `search.he_thong` và pre-fill bộ lọc; không đổi UI đích.

## 4. Print / PDF
- Ẩn thanh hành động nhanh & các nút "Xem tất cả" khi in (`.no-print`).
- In hiển thị đầy đủ nội dung 4 tab (giữ CSS hiện tại).

## Chi tiết kỹ thuật
- Sửa `src/routes/_app.he-thong.$id.tsx`: đổi label tab, thêm QuickActions bar (component nội bộ), thêm links trong sidebar-card, thêm nút "Xem tất cả" đầu mỗi tab.
- Thêm helper `buildHeThongSearch(id)` trả `{ he_thong: id } as never` để truyền `search` cho `<Link>` — tránh gõ lặp.
- Với các route đích chưa nhận `he_thong`: thêm parse `search.he_thong` trong `validateSearch`/`useSearch` và áp filter (thay đổi tối thiểu, không đụng UI).
- Không đổi schema DB, không migration.

## Ngoài phạm vi
- Không thay đổi thứ tự / cấu trúc sidebar chính.
- Không refactor các trang đích ngoài việc thêm bộ lọc query.
- Không đổi layout tổng thể trang `$id` vừa tối ưu.
