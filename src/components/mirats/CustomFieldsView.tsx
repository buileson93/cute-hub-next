/**
 * Task 45 — Hiển thị custom fields ở DetailDrawer/registry (Task 27/30).
 * Chỉ đọc; format theo `renderAttrs`.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchDinhNghiaTruong } from "@/lib/mirats/custom-fields/api";
import { renderAttrs } from "@/lib/mirats/custom-fields/registry";

interface Props {
  entity: string;
  attrs: Record<string, unknown> | null | undefined;
}

export function CustomFieldsView({ entity, attrs }: Props) {
  const { data: defs } = useQuery({
    queryKey: ["dinh_nghia_truong", entity],
    queryFn: () => fetchDinhNghiaTruong(entity),
    staleTime: 5 * 60_000,
  });

  if (!defs || defs.length === 0) return null;
  const rows = renderAttrs(defs, attrs ?? {});
  if (rows.every((r) => r.giaTri === "—")) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Trường tuỳ biến</div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.flatMap((r) => [
          <dt key={`${r.key}-l`} className="text-muted-foreground">{r.nhan}</dt>,
          <dd key={`${r.key}-v`} className="font-medium">{r.giaTri}</dd>,
        ])}
      </dl>
    </div>
  );
}
