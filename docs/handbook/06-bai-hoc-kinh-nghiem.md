# 06 — Bài học kinh nghiệm

Tổng hợp các **sai lầm và lỗi thực tế** đã gặp trong quá trình dựng và bảo trì
MIRATS. Mục đích: khi lỗi lặp lại, tra ở đây trước khi debug lại từ đầu.

---

## 1. Quyền/GRANT bị "bay" sau mỗi migration DDL

**Triệu chứng:** đang chạy ngon, sau khi push 1 migration mới → RPC
`khai_them_thanh_phan_he_thong` trả `permission denied` (SQLSTATE `42501`);
UI "Khai thêm thành phần" báo lỗi 403; đôi khi cả bảng list rỗng.

**Nguyên nhân gốc rễ (đã xác minh bằng psql + Playwright):**
1. Supabase Data API KHÔNG grant mặc định trên schema `public` cho `anon` /
   `authenticated` / `service_role` / `sandbox_exec`.
2. Mỗi lần `CREATE TABLE`, `DROP + CREATE FUNCTION`, `ALTER TABLE` chạy trong
   migration mới → owner có thể bị reset về `sandbox_exec`, các GRANT thủ công
   trước đó bị mất.
3. RPC `SECURITY DEFINER` và direct insert vào bảng con cần **`UPDATE`** trên
   owner/runtime role của bảng cha FK (`sandbox_exec, postgres`) vì Postgres 17
   thực hiện `SELECT ... FOR KEY SHARE` khi validate khóa ngoại. Chỉ có
   `SELECT/REFERENCES` là không đủ.
4. Lỗi từng lặp lại vì ACL của owner `sandbox_exec` có dạng
   `ardDxtm/sandbox_exec`: đủ SELECT/INSERT/DELETE/REFERENCES/TRIGGER/MAINTAIN
   nhưng thiếu riêng `w=UPDATE`. User `authenticated=arwdxt` đủ quyền vẫn 403
   vì FK RI trigger chạm bảng cha dưới owner/runtime role.
5. Event trigger auto-grant từng có → gây recursion timeout ở migration lớn,
   sau đó tắt/hỏng → grant không tự nhả.

**Cách khắc phục triệt để:** mỗi migration BẮT BUỘC dán block GRANT cuối file
cho **bảng đích + TẤT CẢ bảng cha FK**, kèm `GRANT ALL PRIVILEGES … TO sandbox_exec, postgres` và dòng riêng `GRANT UPDATE … TO sandbox_exec, postgres`.
Xem `04-quy-uoc/grant-discipline.md` và `docs/superpowers/specs/migration-grant-discipline.md`.

**Bài học:** không tin vào event trigger; kỷ luật GRANT là bắt buộc thủ công.
Trigger function phải `OWNER TO postgres` để RLS không chặn ngầm.

---

## 2. Ràng buộc UNIQUE 1-1 trên `gan_chuc_nang` gây lỗi "gắn trùng"

**Triệu chứng:** một tài sản đang lắp ở TPHT A, khi lắp tiếp sang TPHT B thì
UI báo "tài sản đã được gắn". Sai nghiệp vụ: 1 tài sản CÓ THỂ lắp đồng thời
nhiều thành phần.

**Nguyên nhân:** migration đời đầu thêm unique constraint / logic auto-tháo
theo tư duy 1-1.

**Fix:** đã bỏ constraint và mọi logic auto-unmount trong RPC lắp. Ghi vào
memory `features/gan-tai-san-nhieu-thanh-phan`. **KHÔNG khôi phục** unique
constraint dưới bất kỳ hình thức nào.

---

## 3. Đơn vị quản lý bị lệch giữa tài sản và thành phần

**Triệu chứng:** filter theo đơn vị ra kết quả sai; báo cáo tuân thủ đếm nhầm.

**Nguyên nhân:** ban đầu định gán `don_vi_id` trực tiếp trên `thiet_bi` →
data drift khi luân chuyển tài sản.

**Cách đúng:** nguồn sự thật duy nhất là `dm_he_thong.don_vi_id`. Tài sản
KHÔNG có đơn vị riêng, kế thừa qua thành phần hệ thống đang lắp. Vị trí
cascade ngược: thành phần lấy vị trí từ tài sản. Xem
`mem://features/don-vi-quan-ly`.

---

## 4. Login loop do `use-idle-logout` xoá session localStorage sai chỗ

**Triệu chứng:** đăng nhập thành công trên server (Supabase trả session),
nhưng client bị `use-idle-logout` clear localStorage ngay sau đó → refresh
→ về `/auth` → loop.

**Fix:** chỉ reset khi có event thật (mouse/keyboard/visibility), không reset
ở mount. Đã sửa `src/hooks/use-idle-logout.ts`.

---

## 5. Giới hạn 1000 rows của PostgREST làm dashboard hiển thị sai

**Triệu chứng:** KPI tổng số tài sản dừng ở 1000; bảng tải lên "hết dữ liệu"
sớm.

**Fix:** tạo `usePagedQuery` chia trang range-based, kèm
`patch-paged-cache.ts` để realtime patch O(1) không refetch cả trang.
Song song đó, dùng RPC `rpc_*_toan_cuc` để aggregate ở DB.

---

## 6. Server function trả `Unauthorized` khi có `requireSupabaseAuth`

**Nguyên nhân:** thiếu `functionMiddleware` gắn bearer token ở `src/start.ts`.
Middleware phải append vào mảng `functionMiddleware`, không được replace.

**Bẫy phụ:** đưa server fn có auth vào `loader` của route công khai → SSR /
prerender chạy không có session → build fail. Giải pháp: chỉ gọi ở component
qua `useServerFn`, hoặc đặt route dưới `_authenticated`.

---

## 7. `supabaseAdmin` bị leak vào client bundle

**Nguyên nhân:** import trực tiếp `client.server.ts` từ file `.functions.ts`
(nằm trong graph client). Chỉ handler body bị strip, top-level import thì không.

**Fix:** dynamic import trong handler:
`const { supabaseAdmin } = await import('@/integrations/supabase/client.server')`.

---

## 8. Redirect OAuth về route bảo vệ → mất session

**Nguyên nhân:** `signInWithOAuth({ redirectTo: '/dashboard' })` trực tiếp;
provider round-trip xong Supabase chưa hydrate → route guard đá về `/auth`.

**Fix:** redirect về `window.location.origin` (hoặc `/auth/callback`), lưu
`next` ở query string, navigate sau khi có session.

---

## 9. Migrations dùng CHECK constraint có `now()`

**Triệu chứng:** restore backup fail; validate row cũ fail sau seed.

**Nguyên nhân:** CHECK phải immutable. Rule kiểu `expire_at > now()` phải
dùng trigger, không phải constraint.

---

## 10. CI/CD GitHub Actions bị tính phí

**Fix:** đã xoá `.github/workflows/` (tháng 7/26). Build/publish làm qua
Lovable UI. Xem `05-van-hanh/deploy.md`.

---

## 11. `src/pages/` bị nhầm với TanStack convention

**Sai lầm:** tạo `src/pages/xxx.tsx` theo thói quen Next.js — TanStack
Router không nhận, build fail hoặc route trống. Đúng là `src/routes/` flat
routing.

---

## 12. Native `confirm()` block UI Worker

**Sai lầm:** dùng `window.confirm` trong flow xoá — Cloudflare Worker
runtime + async flow gây UX kém, không style được.

**Fix:** dùng shadcn `<AlertDialog>` cho mọi xác nhận huỷ/xoá.

---

## 13. Event trigger auto-grant gây recursion timeout

**Triệu chứng:** migration DDL lớn treo vô hạn; sau đó grant không nhả.

**Fix vĩnh viễn:** cần superuser drop trigger (đã gửi ticket support). Trước
khi drop được: tuyệt đối tuân thủ block GRANT thủ công cuối migration.

---

## 14. Type Supabase auto-gen bị lệch sau migration

**Triệu chứng:** TS đỏ khắp nơi ngay sau khi migration approved.

**Nguyên nhân:** `src/integrations/supabase/types.ts` chỉ regen sau khi user
duyệt migration. Nếu code trước migration → type cũ.

**Quy tắc:** viết migration trước, đợi approve, mới viết code phụ thuộc schema mới.

---

## 15. `VITE_*` bị lộ nhầm với secret server

**Sai lầm:** ai đó đặt `VITE_LOVABLE_API_KEY` → key rò vào bundle browser.

**Quy tắc:** CHỈ khoá publishable/anon được `VITE_*`. Secret luôn là env
server-only, đọc trong `.handler()` bằng `process.env.*`.

---

## 16. Trigger function không set `search_path`

**Triệu chứng:** function chạy sai schema, hoặc SECURITY DEFINER bị cảnh báo
lint.

**Fix:** mọi function `SECURITY DEFINER` đều phải `SET search_path = public`.
