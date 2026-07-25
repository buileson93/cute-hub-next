# Render form tác nghiệp nhanh natively trong Sheet (bỏ iframe)

## Mục tiêu
Mở "Tác nghiệp nhanh" ở sổ lý lịch hệ thống gần như tức thì (0 boot SPA, chia sẻ react-query cache và session với trang đang xem). Không thay đổi nghiệp vụ — chỉ tách thân form thành component tái sử dụng.

## Phạm vi (3 form dùng nhiều nhất)
- `/su-co/moi` → `SuCoMoiForm`
- `/bao-tri/moi` → `BaoTriMoiForm`
- `/hong-hoc/moi` → `HongHocMoiForm`

4 mục còn lại (`/ban-giao/moi`, `/forms`, `/van-de`, `/bao-tri/cong-viec`) giữ iframe warm như hiện tại — ít dùng, refactor không đáng công.

## Cách làm

### 1. Tách component form
Với mỗi route trong phạm vi:
- Tạo file `src/components/mirats/quick/<Ten>Form.tsx` chứa toàn bộ JSX + logic (state, mutation, submit) của page hiện tại.
- Nhận props tối thiểu:
  ```ts
  { defaultHeThongId?: string; embedded?: boolean; onDone?: () => void }
  ```
- `embedded=true`: ẩn `FormPageHeader` (đã có Sheet header), bỏ padding trang, sau khi submit thành công gọi `onDone()` thay vì `navigate()`.
- `defaultHeThongId`: prefill giống hệt logic đang đọc `?he_thong=` từ URL.

### 2. Route wrapper mỏng
Route `_app.su-co.moi.tsx` (và 2 route còn lại) chỉ còn:
```tsx
export const Route = createFileRoute(...)({ component: Page });
function Page() {
  const sp = Route.useSearch();
  const nav = useNavigate();
  return <SuCoMoiForm defaultHeThongId={sp.he_thong} onDone={() => nav({ to: "/su-co" })} />;
}
```
URL trực tiếp vẫn hoạt động như cũ, không breaking change.

### 3. Cập nhật `QuickActionsBar` (sổ lý lịch)
- Bỏ iframe cho 3 form đã refactor.
- Sheet render trực tiếp `<SuCoMoiForm defaultHeThongId={heThongId} embedded onDone={() => setOpenPath(null)} />`.
- Giữ pattern iframe cho 4 mục chưa refactor (fallback).
- Sau `onDone`: đóng Sheet + `queryClient.invalidateQueries` các key liên quan để sổ lý lịch tự cập nhật nhật ký.

## Kiểm thử
- Mở sổ lý lịch → bấm 3 mục refactor → xác nhận mở tức thì, prefill đúng hệ thống, submit thành công, sổ lý lịch tự refresh nhật ký khai thác.
- Vào thẳng `/su-co/moi?he_thong=<id>` → vẫn render bình thường, header đầy đủ.
- Playwright smoke: tạo 1 sự cố + 1 phiếu bảo dưỡng gắn hệ thống.

## Rủi ro
- Refactor 3 file lớn (~500–1500 dòng) → có thể lệch state/effect nhỏ. Giảm bằng cách copy nguyên khối, chỉ thay `useSearch`/`useNavigate` thành props, không viết lại logic.
- Import vòng: đảm bảo component mới không import lại route.

## Không làm
- Không đổi schema, không đổi API/mutation, không đụng RLS.
- Không refactor 4 mục còn lại trong đợt này.
