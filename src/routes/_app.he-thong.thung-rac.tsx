import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertTriangle, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StandardTable, type ColumnDef } from "@/components/mirats/StandardTable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/he-thong/thung-rac")({
  head: () => ({
    meta: [
      { title: "Thùng rác — Thành phần hệ thống — MIRATS 2.0" },
      {
        name: "description",
        content:
          "Danh sách thành phần hệ thống đã ẩn (soft delete). Khôi phục hoặc xoá vĩnh viễn khi không còn ràng buộc.",
      },
    ],
  }),
  component: ThungRacPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive" role="alert">
      Lỗi tải dữ liệu: {error instanceof Error ? error.message : "Không xác định"}
    </div>
  ),
});

type Row = {
  id: string;
  ten: string;
  ma_thanh_phan: string | null;
  he_thong_id: string | null;
  he_thong_ten: string | null;
  don_vi_ma: string | null;
  deleted_at: string | null;
  refs: {
    gan_active: number;
    gan_total: number;
    bao_tri: number;
    su_co: number;
    hong_hoc: number;
  };
};

function ThungRacPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [hardTarget, setHardTarget] = useState<Row | null>(null);

  const listQ = useQuery({
    queryKey: ["thung-rac", "he_thong_thanh_phan"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select(
          "id, ten, ma_thanh_phan, he_thong_id, deleted_at, dm_he_thong:he_thong_id(ten, dm_don_vi:don_vi_id(ma))",
        )
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as any[];
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.id);
      const [gan, bt, sc, hh] = await Promise.all([
        supabase.from("gan_chuc_nang").select("thanh_phan_id, den_ngay").in("thanh_phan_id", ids),
        supabase.from("bao_tri").select("thanh_phan_id").in("thanh_phan_id", ids),
        supabase.from("su_co").select("thanh_phan_id").in("thanh_phan_id", ids),
        supabase.from("hong_hoc").select("thanh_phan_id").in("thanh_phan_id", ids),
      ]);

      const acc = (arr: any[], active?: boolean) => {
        const m = new Map<string, number>();
        for (const r of arr) {
          if (active !== undefined) {
            const isActive = r.den_ngay == null;
            if (isActive !== active) continue;
          }
          m.set(r.thanh_phan_id, (m.get(r.thanh_phan_id) ?? 0) + 1);
        }
        return m;
      };
      const mGanActive = acc((gan.data ?? []) as any[], true);
      const mGanTotal = acc((gan.data ?? []) as any[]);
      const mBt = acc((bt.data ?? []) as any[]);
      const mSc = acc((sc.data ?? []) as any[]);
      const mHh = acc((hh.data ?? []) as any[]);

      return rows.map((r) => ({
        id: r.id,
        ten: r.ten,
        ma_thanh_phan: r.ma_thanh_phan,
        he_thong_id: r.he_thong_id,
        he_thong_ten: r.dm_he_thong?.ten ?? null,
        don_vi_ma: r.dm_he_thong?.dm_don_vi?.ma ?? null,
        deleted_at: r.deleted_at,
        refs: {
          gan_active: mGanActive.get(r.id) ?? 0,
          gan_total: mGanTotal.get(r.id) ?? 0,
          bao_tri: mBt.get(r.id) ?? 0,
          su_co: mSc.get(r.id) ?? 0,
          hong_hoc: mHh.get(r.id) ?? 0,
        },
      }));
    },
  });

  const restoreMut = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from("he_thong_thanh_phan")
        .update({ deleted_at: null } as any)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_r, row) => {
      toast.success(`Đã khôi phục "${row.ten}"`);
      qc.invalidateQueries({ queryKey: ["thung-rac"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Không khôi phục được"),
  });

  const hardDeleteMut = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("he_thong_thanh_phan").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_r, row) => {
      toast.success(`Đã xoá vĩnh viễn "${row.ten}"`);
      setHardTarget(null);
      qc.invalidateQueries({ queryKey: ["thung-rac"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  const filtered = useMemo(() => {
    const rows = listQ.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.ten, r.ma_thanh_phan, r.he_thong_ten, r.don_vi_ma]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [listQ.data, q]);

  const canHardDelete = (r: Row) =>
    r.refs.gan_active === 0 && r.refs.bao_tri === 0 && r.refs.su_co === 0 && r.refs.hong_hoc === 0;

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    {
      key: "ten", header: "Thành phần", width: 300,
      render: (r) => (
        <div>
          <div className="font-medium">{r.ten}</div>
          {r.ma_thanh_phan && (
            <div className="font-mono text-[11px] text-muted-foreground">{r.ma_thanh_phan}</div>
          )}
        </div>
      )
    },
    {
      key: "he_thong_ten", header: "Hệ thống", width: 200,
      render: (r) => <span className="text-sm">{r.he_thong_ten ?? "—"}</span>
    },
    {
      key: "don_vi_ma", header: "Đơn vị", width: 100,
      render: (r) => <span className="text-sm">{r.don_vi_ma ?? "—"}</span>
    },
    {
      key: "refs", header: "Ràng buộc",
      render: (r) => {
        const clean = canHardDelete(r);
        return (
          <div className="flex flex-wrap gap-1">
            {r.refs.gan_active > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {r.refs.gan_active} tài sản đang lắp
              </Badge>
            )}
            {r.refs.bao_tri > 0 && (
              <Badge variant="secondary" className="text-[10px]">{r.refs.bao_tri} bảo trì</Badge>
            )}
            {r.refs.su_co > 0 && (
              <Badge variant="secondary" className="text-[10px]">{r.refs.su_co} sự cố</Badge>
            )}
            {r.refs.hong_hoc > 0 && (
              <Badge variant="secondary" className="text-[10px]">{r.refs.hong_hoc} hỏng hóc</Badge>
            )}
            {clean && (
              <Badge variant="outline" className="text-[10px] text-emerald-600">Không ràng buộc</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: "deleted_at", header: "Đã ẩn lúc", width: 150,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.deleted_at ? new Date(r.deleted_at).toLocaleString("vi-VN") : "—"}
        </span>
      )
    },
    {
      key: "actions", header: "", width: 220, align: "right",
      render: (r) => {
        const clean = canHardDelete(r);
        return (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => restoreMut.mutate(r)}
              disabled={restoreMut.isPending}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Khôi phục
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-[11px]"
              disabled={!clean || hardDeleteMut.isPending}
              onClick={() => setHardTarget(r)}
              title={clean ? "Xoá vĩnh viễn" : "Còn ràng buộc — không thể xoá vĩnh viễn"}
            >
              <Trash2 className="mr-1 h-3 w-3" /> Xoá
            </Button>
          </div>
        );
      }
    }
  ], [restoreMut.isPending, hardDeleteMut.isPending]);

  return (
    <PageFrame density="compact">
      <PageHeader
        icon={Trash2}
        title="Thùng rác — Thành phần hệ thống"
        description="Các thành phần đã ẩn (soft delete). Khôi phục để đưa lại vào cây, hoặc xoá vĩnh viễn khi không còn ràng buộc dữ liệu."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, mã, hệ thống…"
              className="h-8 w-64 pl-7"
            />
          </div>
        }
      />

      <PageBody noPadding className="relative flex flex-col overflow-hidden bg-muted/5">
        <div className="flex-1 min-h-0 overflow-auto">
          <StandardTable<Row>
            tableKey="he_thong_thanh_phan_trash"
            columns={columns}
            rows={filtered}
            getRowId={(r) => r.id}
            trangThai={{ dangTai: listQ.isLoading }}
            emptyText="Thùng rác trống."
          />
        </div>
      </PageBody>

      <AlertDialog open={!!hardTarget} onOpenChange={(o) => !o && setHardTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Xoá vĩnh viễn thành phần?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div>
                  Sẽ xoá hẳn <b>{hardTarget?.ten}</b> khỏi cơ sở dữ liệu. Thao tác này{" "}
                  <b className="text-destructive">không thể hoàn tác</b>.
                </div>
                {hardTarget && hardTarget.refs.gan_total > 0 && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
                    Có {hardTarget.refs.gan_total} bản ghi tháo–lắp đã kết thúc sẽ bị xoá theo.
                    Tài sản liên quan KHÔNG bị ảnh hưởng.
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => hardTarget && hardDeleteMut.mutate(hardTarget)}
            >
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  );
}
