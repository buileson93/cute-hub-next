# 04 — Testing

## Kim tự tháp

Tham chiếu đầy đủ: `docs/superpowers/specs/qa-test-plan.md`.

| Tầng | Công cụ | Vị trí |
|---|---|---|
| Unit | Vitest (jsdom) | `src/lib/mirats/__tests__/`, `src/hooks/__tests__/` |
| Integration | Vitest + Supabase mock | cùng chỗ |
| DB / RLS | pgTAP | `supabase/tests/*.sql` |
| Route smoke | RTL | `src/__tests__/*.test.ts` |
| E2E | Playwright | `e2e/` (chưa dựng CI) |

## Chạy local

```bash
bun test              # Vitest run
bun test:coverage     # với --coverage
bun tsgo --noEmit     # typecheck
```

pgTAP:

```bash
supabase db test
```

## Quy ước đặt tên

- `<module>.test.ts` cho logic thuần.
- `<Component>.test.tsx` cho component.
- `<đối_tượng>_<hành_vi>.sql` cho pgTAP.

## Ngưỡng coverage (đề xuất)

- Statements ≥ 75%, Functions ≥ 80%.
- Loại trừ: `*.gen.ts`, `types.ts`, `client.server.ts`, `auth-*.ts`.

## Trước khi merge

1. Typecheck xanh.
2. Unit + integration xanh.
3. pgTAP xanh.
4. Test tay use case đụng migration (theo `grant-discipline.md`).
