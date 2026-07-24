// ============================================================================
// Tab "Liên kết" cho trang chi tiết hệ thống.
//  - Nhóm theo Đi ra / Đi vào
//  - Badge đỏ khi liên kết vai_tro='chinh' mà KHÔNG có 'du_phong' tương ứng
//  - Nút phân tích tác động (gọi RPC phan_tich_tac_dong)
// Phần hiển thị tách thành LienKetGroups (thuần, dễ test).
// ============================================================================

import { useMemo, useState } from "react";
import { Link2, ArrowRight, ArrowLeftRight, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useLienKetCuaHeThong, usePhanTichTacDong, LOP_LABEL,
} from "@/lib/mirats/lien-ket";
import { LOAI_LIEN_KET_LABEL, type DoThiRow, type LoaiLienKetMa } from "@/lib/mirats/system-graph";

/**
 * Thuần: một liên kết vai_tro='chinh' ở phía `heThongId` được coi là THIẾU DỰ
 * PHÒNG nếu không có liên kết nào khác cùng phía, cùng loại, vai_tro='du_phong'.
 */
export function thieuDuPhong(row: DoThiRow, heThongId: string, all: DoThiRow[]): boolean {
  if (row.vai_tro_du_phong !== "chinh") return false;
  const side: "nguon" | "dich" = row.nguon_id === heThongId ? "nguon" : "dich";
  return !all.some((r) => {
    if (r.id === row.id) return false;
    if (r.vai_tro_du_phong !== "du_phong") return false;
    if (r.loai_ma !== row.loai_ma) return false;
    const rSide = r.nguon_id === heThongId ? "nguon" : r.dich_id === heThongId ? "dich" : null;
    return rSide === side;
  });
}

function LienKetItem({ r, heThongId, all }: { r: DoThiRow; heThongId: string; all: DoThiRow[] }) {
  const outgoing = r.nguon_id === heThongId;
  const other = outgoing ? r.dich_ten : r.nguon_ten;
  const missingBackup = thieuDuPhong(r, heThongId, all);
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
      <Badge variant="outline">{LOAI_LIEN_KET_LABEL[r.loai_ma as LoaiLienKetMa] ?? r.loai_ma}</Badge>
      <span className="text-muted-foreground">
        {r.huong === "hai_chieu" ? <ArrowLeftRight className="inline h-3.5 w-3.5" /> : <ArrowRight className="inline h-3.5 w-3.5" />}
      </span>
      <span className="font-medium">{other}</span>
      <span className="text-xs text-muted-foreground">· {LOP_LABEL[r.lop]}</span>
      {r.vai_tro_du_phong && (
        <Badge variant="secondary" className="text-[10px]">
          {r.vai_tro_du_phong === "chinh" ? "Chính" : "Dự phòng"}
        </Badge>
      )}
      {r.giao_thuc && <span className="text-xs text-muted-foreground">· {r.giao_thuc}</span>}
      {missingBackup && (
        <Badge variant="destructive" className="gap-1 text-[10px]" title="Liên kết chính chưa có liên kết dự phòng tương ứng">
          <ShieldAlert className="h-3 w-3" /> Thiếu dự phòng
        </Badge>
      )}
      <Badge variant={r.trang_thai === "hoat_dong" ? "default" : "secondary"} className="ml-auto">
        {r.trang_thai === "hoat_dong" ? "Hoạt động" : "Ngừng"}
      </Badge>
    </li>
  );
}

/** Hiển thị thuần: nhóm Đi ra / Đi vào + badge thiếu dự phòng. */
export function LienKetGroups({ heThongId, rows }: { heThongId: string; rows: DoThiRow[] }) {
  const { diRa, diVao } = useMemo(() => {
    const diRa: DoThiRow[] = [];
    const diVao: DoThiRow[] = [];
    for (const r of rows) {
      if (r.nguon_id === heThongId) diRa.push(r);
      else if (r.dich_id === heThongId) diVao.push(r);
    }
    return { diRa, diVao };
  }, [rows, heThongId]);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Hệ thống này chưa có liên kết nào tới hệ thống khác.</p>;
  }

  return (
    <div className="space-y-4">
      <section aria-label="Liên kết đi ra">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" /> Đi ra ({diRa.length})
        </div>
        {diRa.length === 0 ? (
          <p className="text-xs text-muted-foreground">Không có liên kết đi ra.</p>
        ) : (
          <ul className="space-y-2">
            {diRa.map((r) => <LienKetItem key={r.id} r={r} heThongId={heThongId} all={rows} />)}
          </ul>
        )}
      </section>
      <section aria-label="Liên kết đi vào">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Đi vào ({diVao.length})
        </div>
        {diVao.length === 0 ? (
          <p className="text-xs text-muted-foreground">Không có liên kết đi vào.</p>
        ) : (
          <ul className="space-y-2">
            {diVao.map((r) => <LienKetItem key={r.id} r={r} heThongId={heThongId} all={rows} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

export function HeThongLienKetTab({ heThongId }: { heThongId: string }) {
  const { rows, isLoading } = useLienKetCuaHeThong(heThongId);
  const [showImpact, setShowImpact] = useState(false);
  const { impact, isFetching } = usePhanTichTacDong(showImpact ? heThongId : undefined);

  const tenMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      m.set(r.nguon_id, r.nguon_ten ?? r.nguon_id);
      m.set(r.dich_id, r.dich_ten ?? r.dich_id);
    }
    return m;
  }, [rows]);

  if (isLoading) {
    return <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải liên kết…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-primary" /> {rows.length} liên kết đi/đến
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowImpact((v) => !v)}>
          <AlertTriangle className="mr-1 h-4 w-4" /> {showImpact ? "Ẩn phân tích" : "Phân tích tác động"}
        </Button>
      </div>

      <LienKetGroups heThongId={heThongId} rows={rows} />

      {showImpact && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50/50 p-3 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Nếu hệ thống này ngừng hoạt động
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>
          {impact.length === 0 ? (
            <p className="text-xs text-muted-foreground">Không có hệ thống nào bị ảnh hưởng theo luồng tín hiệu / phụ thuộc dịch vụ.</p>
          ) : (
            <ul className="space-y-1">
              {impact.map((i) => (
                <li key={i.he_thong_id} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-xs">
                  <span>{i.ten ?? tenMap.get(i.he_thong_id) ?? i.he_thong_id}</span>
                  <Badge variant="secondary">bậc {i.do_sau}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
