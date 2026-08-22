# N11 — Mobile hiện trường + Hàng chờ ghi offline (SPEC)

Trạng thái: DRAFT — chờ duyệt trước khi TDD.
Phụ thuộc: **N6** (máy trạng thái sự cố), **N4** (PM), **N7** (QR mobile landing).

## 1. Mục tiêu

Kỹ thuật viên hiện trường dùng điện thoại để:

- Quét QR → xem lý lịch thiết bị (N7).
- Báo sự cố mới (N6) và chuyển bước xử lý (tiếp nhận / xử lý / hoàn thành / chờ vật tư).
- Hoàn thành công việc PM (N4): chụp ảnh minh chứng, ghi ghi chú, đóng công việc.
- Ghi bàn giao ca đơn giản.

Điện thoại 4G yếu / trong nhà kỹ thuật thường **mất sóng tạm thời**. Ứng dụng phải cho phép **thao tác tiếp** khi offline, xếp hàng ghi, và tự **flush** khi có mạng lại — không cần user bấm gì.

## 2. Luồng hiện trường (in scope N11)

| #   | Luồng                        | Nguồn API                                 | Idempotent?                            |
| --- | ---------------------------- | ----------------------------------------- | -------------------------------------- |
| F1  | Xem lý lịch qua QR           | server fn `get_thiet_bi_ly_lich`          | GET, không cần queue                   |
| F2  | Tạo sự cố mới (N6 `bao_cao`) | `su_co_create`                            | Có (khoá `client_uuid`)                |
| F3  | Chuyển trạng thái sự cố      | `su_co_transition`                        | Có (khoá `client_uuid` + `from_state`) |
| F4  | Đính kèm ảnh sự cố/PM        | `attach_upload` (Storage) + `attach_link` | Có (hash file + `client_uuid`)         |
| F5  | Hoàn thành PM                | `pm_complete_task` (N4)                   | Có (`client_uuid`)                     |
| F6  | Ghi chú bàn giao ca          | `ban_giao_add_note`                       | Có (`client_uuid`)                     |
| F7  | Chỉnh sửa danh mục           | KHÔNG offline (chặn khi mất mạng)         | —                                      |

Các luồng ngoài danh sách trên **vô hiệu hoá** khi offline (nút mờ + tooltip "Cần kết nối").

## 3. UX Offline

- **Chỉ báo mạng**: badge nhỏ ở header ("Online" / "Offline • N thao tác chờ"). Bấm mở panel hàng chờ.
- **Optimistic**: sau khi user submit, UI hiển thị ngay dữ liệu mới với nhãn "Đang chờ đồng bộ" (icon đồng hồ). Khi flush thành công ⇒ nhãn biến mất; thất bại ⇒ nhãn đỏ + nút "Thử lại" / "Xoá".
- **Không chặn user**: user tiếp tục thao tác trong khi item chờ.
- **Ảnh**: chụp ảnh khi offline được lưu trong IndexedDB (blob), upload khi flush trước khi gọi mutation liên quan.
- **Xung đột**: khi flush trả `409 CONFLICT` (ví dụ trạng thái N6 đã thay đổi ở nơi khác), hiển thị màn "Xung đột" với 3 lựa chọn: **Xem lại & sửa** (mở form với data mới nhất), **Giữ bản của tôi** (yêu cầu admin duyệt như Change Request N2), **Huỷ**.

## 4. Chiến lược offline

### 4.1 Detect

- `navigator.onLine` + heartbeat GET `/api/public/hooks/ping` mỗi 30s khi tab active. Coi là online chỉ khi cả hai đều OK.
- Khi vừa online lại ⇒ tự `flushQueue()`.

### 4.2 Queue (IndexedDB)

Store `mirats_outbox` với schema:

```ts
type OutboxItem = {
  id: string; // uuid v4 = client_uuid
  op:
    | "su_co_create"
    | "su_co_transition"
    | "pm_complete_task"
    | "ban_giao_add_note"
    | "attach_upload"
    | "attach_link";
  payload: Record<string, unknown>;
  created_at: string; // ISO
  attempts: number; // 0..N
  next_attempt_at: string; // ISO, backoff
  status: "pending" | "in_flight" | "done" | "failed" | "conflict";
  last_error?: string;
  depends_on?: string[]; // id của item khác phải flush trước (ảnh trước → link)
};
```

Blob ảnh nằm ở store riêng `mirats_outbox_blobs` (`{ id, blob, mime }`), tham chiếu qua `payload.blob_id`.

Đưa DB tên `mirats_offline_v1`. Bump tên (`_v2`) khi đổi schema không tương thích, không migrate ngầm.

### 4.3 Enqueue

Mỗi mutation offline-safe dùng helper duy nhất:

```ts
enqueue({ op, payload, depends_on? }): Promise<{ id }>
```

- Sinh `client_uuid` (uuid v7 nếu polyfill có, không thì v4) và nhét vào `payload.client_uuid`.
- Ghi vào IndexedDB. Nếu **online** ⇒ đẩy vào flusher ngay; nếu **offline** ⇒ chờ heartbeat.
- Trả về ngay để UI làm optimistic update.

### 4.4 Flush

- **Tuần tự** (concurrency = 1) để tôn trọng thứ tự người dùng thao tác trên cùng một thực thể.
- Với các thực thể độc lập, cho phép **2 luồng song song** (tuỳ chỉnh sau; mặc định 1 để đơn giản và không đảo thứ tự).
- Với item có `depends_on` chưa `done` ⇒ hoãn.
- Gọi server fn tương ứng qua `useServerFn` (đường mutation chính thống, có RLS + audit).
- Backoff: `min(60s, 2^attempts * 2s) + jitter±20%`; huỷ (`failed`) sau `attempts ≥ 8` (~ 4 phút cộng dồn); yêu cầu user xử lý thủ công.

### 4.5 Idempotency (chống ghi trùng)

Mọi server fn ghi phải nhận `client_uuid` (bắt buộc) và:

- Kiểm tra bảng `idempotency_ledger` (mới) hoặc dùng UNIQUE index trên cột `client_uuid` ở bảng đích:
  - `su_co(client_uuid) UNIQUE`
  - `su_co_lich_su(client_uuid) UNIQUE`
  - `bao_tri(client_uuid) UNIQUE`
  - `ban_giao(client_uuid) UNIQUE`
  - `thiet_bi_tep_dinh_kem(client_uuid) UNIQUE`
- Nếu đã tồn tại ⇒ trả **kết quả cũ** (idempotent replay), không tạo bản ghi mới.
- Với transition (F3), thêm cột `from_state` trong payload; server so với trạng thái hiện tại:
  - Trùng transition (đã áp dụng) ⇒ trả OK.
  - Trạng thái hiện tại khác `from_state` và cũng khác `to_state` ⇒ trả `409 CONFLICT` với snapshot mới.

`client_uuid` = uuid v4/v7 sinh phía client; không tin `id` server-sinh cho việc chống trùng.

### 4.6 Sync ngược (server → client)

- TanStack Query invalidate các key liên quan sau mỗi flush thành công.
- Realtime channel (nếu đã bật ở project) cập nhật snapshot khi có thay đổi từ máy khác — dùng cho phát hiện xung đột sớm.

## 5. Kiến trúc code

- `src/lib/mirats/offline-queue.ts`: pure logic (IndexedDB adapter + reducer). Không import server fn trực tiếp; nhận `handlers` map từ ngoài để dễ test.
- `src/lib/mirats/offline-runtime.ts`: nối handlers thực với `useServerFn`, khởi động ở `__root.tsx` sau hydration.
- `src/hooks/use-offline-queue.ts`: hook UI (badge, panel, retry, count).
- Adapter IDB được abstract sau interface `Storage` để test dùng in-memory implementation.

## 6. Bảo mật & tính toàn vẹn

- Không ghi PII/secret vào IDB ngoài payload cần thiết cho mutation. Không cache token.
- Khi user đăng xuất ⇒ xoá `mirats_offline_v1` (tránh rò rỉ trên máy chia sẻ).
- Mutation vẫn qua đường chính thống → RLS + audit đầy đủ; không có "admin backdoor" cho item queue.
- `idempotency_ledger` (nếu dùng) chỉ lưu `client_uuid + op + user_id + created_at + result_ref` — không lưu payload.

## 7. Test kế hoạch (BƯỚC 2)

`src/lib/mirats/__tests__/offline-queue.test.ts` với fake IDB in-memory + fake handlers:

1. **enqueue offline**: 3 mutation liên tiếp khi `online=false` ⇒ store có 3 item `pending`, chưa gọi handler.
2. **flush khi online**: bật online ⇒ handler được gọi đúng thứ tự nhập, mỗi call nhận `client_uuid` khớp.
3. **idempotency**: replay cùng item (crash giữa chừng) ⇒ handler được gọi 2 lần nhưng chỉ tạo 1 hiệu ứng (fake handler dedup theo `client_uuid`); trạng thái cuối `done`.
4. **depends_on**: `attach_upload` phải `done` trước `attach_link`; hoãn `attach_link` nếu upload còn pending.
5. **backoff**: handler ném lỗi 3 lần ⇒ `attempts=3`, `next_attempt_at` tăng theo công thức; sau khi hết fail ⇒ `done`.
6. **failure ceiling**: 8 lần fail ⇒ `status='failed'`, không retry tự động.
7. **conflict**: handler trả `{ conflict: true, server_state }` ⇒ item `conflict`, không tăng attempts, UI có snapshot mới.
8. **transition guard**: 2 transition khác nhau cùng `from_state` ⇒ transition thứ hai bị đánh `conflict` (server trả 409 giả lập).
9. **sign-out**: gọi `clearAll()` ⇒ store trống, blob store trống.
10. **ordering trong cùng entity**: 2 op trên cùng `thiet_bi_id` phải flush tuần tự dù bật parallel=2.

Không đụng test hiện có; test này chạy trong node/vitest với fake indexedDB (`fake-indexeddb`).

## 8. UI & mobile responsive

- Trang `_app.q.$maThietBi.tsx` (N7) làm điểm vào chính; tất cả nút hành động ≥ 44×44px.
- Form báo sự cố (F2): 1 cột, input to, camera capture (`<input type="file" accept="image/*" capture="environment">`).
- Chuyển trạng thái (F3): nút lớn theo ngữ cảnh; ẩn nút không hợp lệ theo N6.
- PM hoàn thành (F5): checklist + camera + ghi chú, đóng bằng 1 nút.
- Panel hàng chờ: mở từ badge, hiện list, cho phép "Thử lại tất cả", xoá item `failed`, xem chi tiết `conflict`.

## 9. Câu hỏi làm rõ

1. **Idempotency**: dùng UNIQUE trên `client_uuid` ở từng bảng (đơn giản, migration nhỏ) hay bảng `idempotency_ledger` trung tâm (linh hoạt hơn nhưng thêm 1 bảng)?
2. **Concurrency flush**: 1 (an toàn tuyệt đối thứ tự) hay 2 (nhanh hơn cho việc bàn giao + upload)? Đề xuất mặc định 1.
3. **Failure ceiling**: 8 lần / ~4 phút có phù hợp không? Với ảnh có nên retry lâu hơn?
4. **Ping endpoint**: dùng `/api/public/hooks/ping` mới hay reuse endpoint hiện có?
5. **Xoá store khi sign-out**: xoá cứng hay chỉ đánh dấu để giữ dữ liệu khi user quên đăng nhập trên máy dùng chung?
6. **Realtime**: bật để phát hiện xung đột sớm, hay để dành cho N-sau (tránh tăng phức tạp)?
7. **Server fn nhận `client_uuid`**: chỉnh sửa cả N4/N6 hiện có, hay giới thiệu wrapper `withIdempotency()`?
8. **Ảnh offline**: giới hạn dung lượng (ví dụ 50MB blob store) và chính sách khi vượt?

Chờ duyệt spec + trả lời câu hỏi trước khi sang BƯỚC 2 (TDD + code + UI).
