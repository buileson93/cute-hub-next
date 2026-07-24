import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { ClipboardCheck } from "lucide-react";


export const Route = createFileRoute("/_app/admin/kiem-tra-so-lieu")({
  head: () => ({
    meta: [
      { title: "Kiểm tra số liệu — Nhóm hệ thống & Vị trí — MIRATS 2.0" },
      {
        name: "description",
        content:
          "So sánh số lượng nhóm hệ thống và vị trí lắp đặt giữa dạng cây và dạng bảng, hiển thị chênh lệch nếu có.",
      },
    ],
  }),
  component: KiemTraSoLieuPage,
});

type Nhom = { id: string; ma: string; ten: string };
type ViTri = { id: string; ma: string; ten: string };
type HeThong = { id: string; nhom_he_thong_id: string | null };
type ThietBi = {
  id: string;
  he_thong_id: string | null;
  nhom_he_thong_id: string | null;
  vi_tri_id: string | null;
};
type ThanhPhan = { id: string; he_thong_id: string | null; vi_tri_id: string | null };

async function fetchAll<T>(
  table: string,
  cols: string,
  order: string,
): Promise<T[]> {
  const page = 1000;
  let from = 0;
  const out: T[] = [];
  for (;;) {
    const { data, error } = await supabase
      .from(table as never)
      .select(cols)
      .order(order, { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < page) break;
    from += page;
  }
  return out;
}

function KiemTraSoLieuPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nhomList, setNhomList] = useState<Nhom[]>([]);
  const [viTriList, setViTriList] = useState<ViTri[]>([]);
  const [heThongList, setHeThongList] = useState<HeThong[]>([]);
  const [thietBiList, setThietBiList] = useState<ThietBi[]>([]);
  const [thanhPhanList, setThanhPhanList] = useState<ThanhPhan[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [nhom, vt, ht, tb, tp] = await Promise.all([
          fetchAll<Nhom>("dm_nhom_he_thong", "id, ma, ten", "ten"),
          fetchAll<ViTri>("dm_vi_tri", "id, ma, ten", "ten"),
          fetchAll<HeThong>("dm_he_thong", "id, nhom_he_thong_id", "id"),
          fetchAll<ThietBi>(
            "thiet_bi",
            "id, he_thong_id, nhom_he_thong_id, vi_tri_id",
            "id",
          ),
          fetchAll<ThanhPhan>(
            "he_thong_thanh_phan",
            "id, he_thong_id, vi_tri_id",
            "id",
          ),
        ]);
        if (cancelled) return;
        setNhomList(nhom);
        setViTriList(vt);
        setHeThongList(ht);
        setThietBiList(tb);
        setThanhPhanList(tp);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nhomRows = useMemo(() => {
    const htNhomMap = new Map(heThongList.map((h) => [h.id, h.nhom_he_thong_id ?? ""]));
    // Tree view: derived nhóm cho tài sản = thiet_bi.nhom_he_thong_id
    //                                    || dm_he_thong.nhom_he_thong_id
    // Bảng: thiet_bi.nhom_he_thong_id (khóa ngoại trực tiếp)
    const treeCount = new Map<string, number>();
    const tableCount = new Map<string, number>();
    for (const tb of thietBiList) {
      const treeKey =
        tb.nhom_he_thong_id || htNhomMap.get(tb.he_thong_id ?? "") || "";
      const tableKey = tb.nhom_he_thong_id ?? "";
      if (treeKey) treeCount.set(treeKey, (treeCount.get(treeKey) ?? 0) + 1);
      if (tableKey)
        tableCount.set(tableKey, (tableCount.get(tableKey) ?? 0) + 1);
    }
    const rows = nhomList.map((n) => {
      const tree = treeCount.get(n.id) ?? 0;
      const table = tableCount.get(n.id) ?? 0;
      return { ...n, tree, table, delta: tree - table };
    });
    rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.ten.localeCompare(b.ten));
    return rows;
  }, [nhomList, heThongList, thietBiList]);

  const viTriRows = useMemo(() => {
    // Tree view: số tài sản (thiet_bi.vi_tri_id) tại vị trí
    // Bảng: số thành phần hệ thống (he_thong_thanh_phan.vi_tri_id) tại vị trí
    const tbCount = new Map<string, number>();
    const tpCount = new Map<string, number>();
    for (const tb of thietBiList) {
      const k = tb.vi_tri_id ?? "";
      if (k) tbCount.set(k, (tbCount.get(k) ?? 0) + 1);
    }
    for (const tp of thanhPhanList) {
      const k = tp.vi_tri_id ?? "";
      if (k) tpCount.set(k, (tpCount.get(k) ?? 0) + 1);
    }
    const rows = viTriList.map((v) => {
      const tree = tbCount.get(v.id) ?? 0;
      const table = tpCount.get(v.id) ?? 0;
      return { ...v, tree, table, delta: tree - table };
    });
    rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.ten.localeCompare(b.ten));
    return rows;
  }, [viTriList, thietBiList, thanhPhanList]);

  const nhomDelta = nhomRows.filter((r) => r.delta !== 0);
  const viTriDelta = viTriRows.filter((r) => r.delta !== 0);

  const orphanTbNoHt = thietBiList.filter((tb) => !tb.he_thong_id).length;
  const orphanTbNoNhom = thietBiList.filter(
    (tb) => !tb.nhom_he_thong_id,
  ).length;
  const orphanTbNoViTri = thietBiList.filter((tb) => !tb.vi_tri_id).length;
  const orphanTpNoViTri = thanhPhanList.filter((tp) => !tp.vi_tri_id).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu so sánh…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-destructive" role="alert">
        Lỗi tải dữ liệu: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Kiểm tra số liệu"
        description="So sánh số lượng nhóm hệ thống và vị trí lắp đặt giữa dạng cây (tree view) và dạng bảng. Chỉ chênh lệch mới cần xử lý."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="Tài sản chưa gán hệ thống"
          value={orphanTbNoHt}
          tone={orphanTbNoHt > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Tài sản chưa gán nhóm hệ thống"
          value={orphanTbNoNhom}
          tone={orphanTbNoNhom > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Tài sản chưa gán vị trí"
          value={orphanTbNoViTri}
          tone={orphanTbNoViTri > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Thành phần chưa gán vị trí"
          value={orphanTpNoViTri}
          tone={orphanTpNoViTri > 0 ? "warn" : "ok"}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Nhóm hệ thống — Cây vs Bảng
          </CardTitle>
          {nhomDelta.length === 0 ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Trùng khớp
            </Badge>
          ) : (
            <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {nhomDelta.length} nhóm chênh lệch
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <DeltaTable
            colLabel="Nhóm hệ thống"
            treeLabel="Cây (kế thừa từ hệ thống)"
            tableLabel="Bảng (khóa ngoại tài sản)"
            rows={nhomRows}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            Vị trí lắp đặt — Tài sản vs Thành phần
          </CardTitle>
          {viTriDelta.length === 0 ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Trùng khớp
            </Badge>
          ) : (
            <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {viTriDelta.length} vị trí chênh lệch
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <DeltaTable
            colLabel="Vị trí"
            treeLabel="Số tài sản (thiet_bi.vi_tri_id)"
            tableLabel="Số thành phần (he_thong_thanh_phan.vi_tri_id)"
            rows={viTriRows}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn";
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "warn"
          ? "border-amber-300/60 bg-amber-500/5"
          : "border-emerald-300/60 bg-emerald-500/5"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString("vi-VN")}</div>
    </div>
  );
}

function DeltaTable({
  colLabel,
  treeLabel,
  tableLabel,
  rows,
}: {
  colLabel: string;
  treeLabel: string;
  tableLabel: string;
  rows: Array<{ id: string; ma: string; ten: string; tree: number; table: number; delta: number }>;
}) {
  return (
    <div className="max-h-[520px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted/70 backdrop-blur">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">{colLabel}</th>
            <th className="px-4 py-2 font-medium text-right">{treeLabel}</th>
            <th className="px-4 py-2 font-medium text-right">{tableLabel}</th>
            <th className="px-4 py-2 font-medium text-right">Chênh lệch</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={`border-t ${r.delta !== 0 ? "bg-amber-500/5" : ""}`}
            >
              <td className="px-4 py-2">
                <div className="font-medium">{r.ten}</div>
                <div className="text-xs text-muted-foreground">{r.ma}</div>
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{r.tree}</td>
              <td className="px-4 py-2 text-right tabular-nums">{r.table}</td>
              <td className="px-4 py-2 text-right tabular-nums font-semibold">
                {r.delta === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">0</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    {r.delta > 0 ? `+${r.delta}` : r.delta}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                Không có dữ liệu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
