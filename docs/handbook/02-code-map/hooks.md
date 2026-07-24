# 02 — Code map: Hooks

Custom hooks trong `src/hooks/`. Mỗi hook có 1 dòng mục đích + input/output chính. Không copy code.

| Hook | Input | Output | Mục đích |
|---|---|---|---|
| `use-session` | — | `{loading, session, user, profile, roles, hasRole, refresh}` | Bọc `supabase.auth`, join `profiles` + `user_roles`. Reactive với `onAuthStateChange`. |
| `use-permissions` (`useMyPermissions`, `useCan`) | module, action | `boolean` / `MyPerms` | Cache 60s quyền từ RPC `get_my_permissions`. `useCan('thiet_bi','update')`. |
| `use-daily-brief` | — | `{ metrics, generated_at }` | Gọi `rpc_daily_brief`, refetch 5 phút. Dùng ở `/`. |
| `use-nav-badges` | — | Map badge count | Số liệu badge sidebar (sự cố mở, PM quá hạn…). |
| `use-notifications` (in `src/lib/realtime/useNotifications.ts`) | user_id | list + unread count | Realtime channel `notifications`. |
| `use-realtime-taxonomy` | — | invalidate query | Nghe change trên `dm_*`, invalidate cache. |
| `use-route-tracker` | — | — | Ghi `user_recent` khi navigate. |
| `use-persistent-collapse` | key | `[open, toggle]` | localStorage cho panel collapse. |
| `use-user-pref` | key, default | `[value, setValue]` | Đọc/ghi `user_layout_prefs`. |
| `use-idle-logout` | timeoutMs | — | Auto-logout khi idle (KHÔNG loop trên login thành công — fix tháng 7/26). |
| `use-mobile` | — | `boolean` | Media query breakpoint. |
| `use-ambient-prefill` (`usePrefillKipTruc`, `usePrefillBienPhap`) | context | suggestion | Prefill AI, cache 60s. |
| `use-contextual-position` | ref | `{x,y}` | Toolbar theo vị trí cursor. |
| `use-offline-queue` | — | queue API | Enqueue mutation khi offline, flush khi online. |

## Hooks nội bộ (trong `src/lib/`)

- `src/lib/mirats/use-column-prefs.ts` — persist column visibility per table.
- `src/lib/mirats/use-import-engine.ts` — orchestration import dry-run + apply.
- `src/lib/realtime/useGlobalRealtime.ts` — subscribe nhiều bảng, invalidate query keys tương ứng.
- `src/lib/mirats/paged.ts` (`usePagedQuery`) — vượt giới hạn 1000 rows PostgREST, có realtime patch cache.

## Nguyên tắc

- Mọi hook query phải khai `queryKey` ổn định, tránh trùng khoá giữa module.
- `staleTime` mặc định: 60s cho danh mục, 5s cho realtime, `Infinity` cho reference tĩnh.
- Không đọc `localStorage`/`cookies` trong initializer của `useState` (SSR crash). Đặt trong `useEffect` hoặc dùng `useHydrated()`.
